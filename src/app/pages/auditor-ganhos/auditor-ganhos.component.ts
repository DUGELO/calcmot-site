import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { PageMetaService } from '../../core/services/page-meta.service';
import { SiteAnalyticsService } from '../../core/services/site-analytics.service';
import { webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';

type Field='grossPassengerCents'|'platformFeeCents'|'driverPayoutCents'|'tipsCents'|'incentivesCents'|'reimbursementsCents'|'grossTotalCents';
type Report={platform:'Uber';documentType:'earnings_statement'|'annual_earnings_statement';periodStart:string|null;periodEnd:string|null;grossTotalCents:number|null;grossPassengerCents:number|null;platformFeeCents:number|null;driverPayoutCents:number|null;tipsCents:number|null;incentivesCents:number|null;reimbursementsCents:number|null;kilometers:number|null;evidence:Partial<Record<Field,string>>};
type Item={hash:string;name:string;report:Report;issues:string[];status:'ready'|'review'};
const FIELD_LABELS:Record<Field,string>={
 grossPassengerCents:'Ganhos brutos com viagens',
 platformFeeCents:'Taxa da plataforma',driverPayoutCents:'Repasse ao motorista',
 tipsCents:'Gorjetas',incentivesCents:'Incentivos',reimbursementsCents:'Reembolsos',grossTotalCents:'Ganhos brutos totais (inclui extras)',
};
const FIELDS=Object.keys(FIELD_LABELS) as Field[];
const money=(value:number|null|undefined)=> value===null||value===undefined?'Não informado':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
const PATH='/ferramentas/auditor-ganhos-ir';
const DESCRIPTION='Confira PDFs de ganhos Uber gratuitamente com IA e obtenha um resumo financeiro e fiscal informativo, sujeito a conferência.';

@Component({
 selector:'app-auditor-ganhos',
 templateUrl:'./auditor-ganhos.component.html',
 styleUrl:'./auditor-ganhos.component.scss',
 changeDetection:ChangeDetectionStrategy.OnPush,
})
export class AuditorGanhosComponent {
 protected readonly documents=signal<Item[]>([]);
 protected readonly inProgress=signal(false);
 protected readonly error=signal('');
 protected readonly info=signal('');
 protected readonly consent=signal(false);
 protected readonly taxProfile=signal<'pf'|'mei'|'unknown'>('unknown');
 protected readonly taxYear=signal(2025);
 protected readonly eligible=signal(false);
 protected readonly confirmedGross=signal(false);
 protected readonly fiscalOptIn=signal(false);
 protected readonly money=money;
 protected readonly fields=FIELDS.map(key=>({key,label:FIELD_LABELS[key]}));
 protected readonly turnstileSiteKey=signal('');
 protected readonly securityReady=signal(false);
 private sessionVersion=0;
 private pending:AbortController|null=null;
 private widgetId:string|undefined;
 private securityToken='';
 private readonly destroyRef=inject(DestroyRef);
 protected readonly totalDocumentCount=()=>this.documents().length;
 protected readonly approved=()=>this.documents().filter(d=>d.status==='ready');
 protected readonly canonicalApproved=()=>{
  const sorted=[...this.approved()].sort((a,b)=>Number(b.report.documentType==='annual_earnings_statement')-Number(a.report.documentType==='annual_earnings_statement'));
  const selected:Item[]=[];
  for(const item of sorted) if(!selected.some(other=>other.report.periodStart && other.report.periodEnd && item.report.periodStart && item.report.periodEnd && other.report.periodStart<=item.report.periodEnd && item.report.periodStart<=other.report.periodEnd)) selected.push(item);
  return selected;
 };
 protected readonly totals=()=>{
  const docs=this.canonicalApproved();
  const add=(key:Field):number|null=> docs.every(item=>item.report[key]!==null)?docs.reduce((s,x)=>s+(x.report[key]||0),0):null;
  return {count:docs.length,fee:add('platformFeeCents'),payout:add('driverPayoutCents'),gross:add('grossTotalCents')};
 };
 protected readonly taxPreview=()=>{
  const docs=this.canonicalApproved().filter(x=>x.report.periodStart?.slice(0,4)===String(this.taxYear()) && x.report.periodEnd?.slice(0,4)===String(this.taxYear()));
  if(!this.fiscalOptIn()||this.taxProfile()!=='pf'||![2025,2026].includes(this.taxYear())||!this.eligible()||!this.confirmedGross()||docs.length===0||docs.some(x=>x.report.grossPassengerCents===null || x.report.periodStart?.slice(0,4)!==String(this.taxYear()) || x.report.periodEnd?.slice(0,4)!==String(this.taxYear())))
    return null;
  if(docs.some(x=>x.report.tipsCents!==0 || x.report.incentivesCents!==0 || x.report.reimbursementsCents!==0))return null;
  const gross=docs.reduce((s,x)=>s+(x.report.grossPassengerCents||0),0);
  if(!Number.isSafeInteger(gross))return null;
  const taxable=Number((BigInt(gross)*60n+99n)/100n);
  return {gross,taxable,exempt:gross-taxable};
 };
 private readonly analytics=inject(SiteAnalyticsService);
 private readonly document=inject(DOCUMENT);
 private readonly pageMeta=inject(PageMetaService);
 constructor(){
  afterNextRender(()=>{this.track('web_auditor_viewed');void this.configureSecurity();});
  this.destroyRef.onDestroy(()=>{this.sessionVersion++;this.pending?.abort();this.documents.set([]);const api=this.turnstile();if(this.widgetId!==undefined)api?.remove(this.widgetId);});
  this.pageMeta.apply({title:'Auditor de Ganhos e IR Facilitado | CalcMot',description:DESCRIPTION,path:PATH,structuredData:[webSiteJsonLd(),webPageJsonLd(PATH,'Auditor de Ganhos CalcMot',DESCRIPTION)]});
 }
 private turnstile(){return (this.document.defaultView as (Window & {turnstile?:{render:(container:Element,options:Record<string,unknown>)=>string;reset:(id?:string)=>void;remove:(id:string)=>void}})|null)?.turnstile;}
 private async configureSecurity(){
  try{
   const response=await fetch('/auditor-interno/config',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
   const config=await response.json() as {enabled?:boolean;siteKey?:string};
   if(this.destroyRef.destroyed || !response.ok || !config.enabled || !/^0x[0-9a-z_-]{10,}$/i.test(config.siteKey??''))return;
   this.turnstileSiteKey.set(config.siteKey!);
   const render=()=>{
    if(this.destroyRef.destroyed)return;
    const container=this.document.getElementById('auditor-turnstile');
    const api=this.turnstile();if(!container||!api)return;
    this.widgetId=api.render(container,{sitekey:config.siteKey,action:'auditor_ganhos',callback:(token:string)=>{this.securityToken=token;this.securityReady.set(true);},'expired-callback':()=>{this.securityToken='';this.securityReady.set(false);},'error-callback':()=>{this.securityToken='';this.securityReady.set(false);}});
   };
   if(this.turnstile())render();
   else{
    const script=this.document.createElement('script');script.async=true;script.defer=true;
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload=render;script.onerror=()=>this.error.set('Verificação de segurança indisponível. Tente novamente.');
    this.document.head.appendChild(script);
   }
  }catch{if(!this.destroyRef.destroyed)this.error.set('Verificação de segurança indisponível. Tente novamente.');}
 }
 private track(event:'web_auditor_viewed'|'web_auditor_upload_started'|'web_auditor_extraction_completed'|'web_auditor_review_needed'|'web_auditor_exported'|'web_auditor_failed'){this.analytics.trackAuditorEvent(event);}
 protected changeConsent(event:Event){this.consent.set((event.target as HTMLInputElement).checked);if(!this.consent())this.clear();}
 protected changeProfile(event:Event){this.taxProfile.set((event.target as HTMLSelectElement).value as 'pf'|'mei'|'unknown');this.fiscalOptIn.set(false);}
 protected changeYear(event:Event){this.taxYear.set(Number((event.target as HTMLSelectElement).value));this.fiscalOptIn.set(false);}
 protected onEligible(event:Event){this.eligible.set((event.target as HTMLInputElement).checked);}
 protected onGross(event:Event){this.confirmedGross.set((event.target as HTMLInputElement).checked);}
 protected onFiscalOptIn(event:Event){this.fiscalOptIn.set((event.target as HTMLInputElement).checked);}
 protected async onFileChange(event:Event){
  const input=event.target as HTMLInputElement;
  const files=Array.from(input.files ?? []);
  input.value='';
  if(!this.consent()){this.error.set('Leia e aceite o tratamento temporário do documento antes do envio.');return;}
  if(!files.length||this.inProgress())return;
  if(this.documents().length+files.length>8){this.error.set('Nesta sessão, envie no máximo oito documentos.');return;}
  if(!this.turnstileSiteKey()||!this.securityReady()){this.error.set('O serviço está preparado, mas a verificação de segurança ainda precisa ser configurada.');return;}
  this.error.set('');this.info.set('');
  this.track('web_auditor_upload_started');
  this.inProgress.set(true);
  try {
   await this.processFile(files[0],this.sessionVersion);
  } finally{this.inProgress.set(false);this.securityToken='';this.securityReady.set(false);if(!this.destroyRef.destroyed)this.turnstile()?.reset(this.widgetId);}
 }
 private async processFile(file:File,version:number){
  if(file.type!=='application/pdf'||file.size<16||file.size>4*1024*1024){this.error.set('Arquivo rejeitado: use PDF de até 4 MiB.');return;}
  const buf=await file.arrayBuffer();
  if(version!==this.sessionVersion||this.destroyRef.destroyed)return;
  if(![37,80,68,70,45].every((b,i)=>new Uint8Array(buf)[i]===b)){this.error.set('O arquivo não contém uma assinatura PDF válida.');return;}
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buf))).map(b=>b.toString(16).padStart(2,'0')).join('');
  if(version!==this.sessionVersion||this.destroyRef.destroyed)return;
  if(this.documents().some(d=>d.hash===digest)){this.error.set('Este documento já está na sessão. Nenhum valor foi somado novamente.');return;}
  const turnstile=this.securityToken;
  if(!turnstile){this.error.set('Conclua a verificação de segurança e tente novamente.');return;}
  const form=new FormData();
  form.set('document',new File([buf],'demonstrativo.pdf',{type:'application/pdf'}));
  form.set('turnstile_token',turnstile);
  this.pending=new AbortController();
  try{
   this.info.set('Analisando demonstrativo. Dados não serão armazenados no servidor do CalcMot.');
   const response=await fetch('/auditor-interno/analisar',{method:'POST',body:form,credentials:'omit',cache:'no-store',signal:AbortSignal.any([this.pending.signal,AbortSignal.timeout(45000)])});
   const data=await response.json() as {code?:string;report?:Report;issues?:string[];status?:'ready'|'review'};
   if(version!==this.sessionVersion||this.destroyRef.destroyed)return;
   if(!response.ok||!data.report||!data.status)throw Error(this.errorMessage(data.code));
   // Distinct date ranges are not silently added together when they overlap.
   const overlapped=this.documents().some(x=>x.report.periodStart&&x.report.periodEnd&&data.report?.periodStart&&data.report?.periodEnd && x.report.periodStart<=data.report.periodEnd&&data.report.periodStart<=x.report.periodEnd);
   const issues=[...(data.issues??[])];
   // Overlapping annual summaries remain visible but excluded from canonical calculations.
   if(overlapped)this.info.set('Foi detectado um período sobreposto. O consolidado seleciona uma única fonte.');
   const item:Item={hash:digest,name:file.name.slice(0,100),report:data.report,issues,status:issues.length?'review':'ready'};
   this.documents.update(old=>[...old,item]);
   this.track(issues.length?'web_auditor_review_needed':'web_auditor_extraction_completed');
   this.info.set('Documento analisado. Verifique pendências antes de usar valores fiscais.');
  }catch(e){
    if(version!==this.sessionVersion||this.destroyRef.destroyed)return;
    this.error.set(e instanceof Error && e.name==='Error'?e.message:'Não foi possível concluir a análise. Tente novamente.');this.track('web_auditor_failed');
  }
 }
 private errorMessage(code?:string){
  const messages:Record<string,string>={RATE_LIMIT:'Limite de tentativas atingido. Aguarde um minuto.',BUSY:'Serviço ocupado. Aguarde um minuto.',PROVIDER_QUOTA:'Limite da IA atingido. Tente mais tarde.',PROVIDER_TIMEOUT:'A IA demorou além do limite. Tente novamente.',PROVIDER_UNAVAILABLE:'A IA está indisponível. Tente mais tarde.',UNAVAILABLE:'Processamento indisponível. Tente mais tarde.',VERIFICATION_FAILED:'Verificação expirada ou inválida. Conclua uma nova verificação.',VERIFICATION_UNAVAILABLE:'Verificação de segurança indisponível.',PDF_PAGE_LIMIT:'Use um PDF com até oito páginas.',PDF_FORMAT_UNSUPPORTED:'Formato PDF não suportado. Baixe novamente o demonstrativo na Uber.',UNSAFE_PDF:'PDF bloqueado por conter recursos ativos ou protegidos.',INVALID_PDF:'O arquivo não é um PDF válido.',FILE_TOO_LARGE:'Use um PDF de até 4 MiB.',DOCUMENT_TOKEN_LIMIT:'O documento ultrapassa o limite de leitura.',INCOMPLETE_EXTRACTION:'A IA devolveu uma leitura incompleta. Nenhum valor foi somado.',UNVERIFIED_EXTRACTION:'Não foi possível validar a leitura. Nenhum valor foi somado.'};
  return messages[code??'']??'Não foi possível validar o documento. Tente novamente.';
 }
 protected changeField(hash:string,key:Field,event:Event){
  const raw=(event.target as HTMLInputElement).value.trim();
  if(!/^\d{1,9}(?:[,.]\d{1,2})?$/.test(raw)&&raw!==''){this.error.set('Preencha valor em reais, por exemplo 120,50.');return;}
  const [whole,fraction='']=raw.replace(',','.').split('.');
  const cents=raw===''?null:Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(cents!==null&&!Number.isSafeInteger(cents)){this.error.set('Valor inválido.');return;}
  this.documents.update(all=>all.map(item=>item.hash===hash?{...item,report:{...item.report,[key]:cents,evidence:{...item.report.evidence,[key]:'Correção manual pelo usuário'}},status:'review',issues:[...new Set([...item.issues,'ALTERACAO_MANUAL'])]}:item));
  this.fiscalOptIn.set(false);
 }
 protected confirmItem(hash:string){
  this.documents.update(all=>all.map(item=>{
   if(item.hash!==hash)return item;
   if(!item.report.periodStart||!item.report.periodEnd||item.report.grossPassengerCents===null||item.report.driverPayoutCents===null) {this.error.set('Para liberar a consolidação, informe período, base bruta e repasse comprovados.');return item;}
   const r=item.report;
   if(r.grossTotalCents===null || r.platformFeeCents===null || r.reimbursementsCents===null || r.grossTotalCents-r.platformFeeCents+r.reimbursementsCents!==r.driverPayoutCents){this.error.set('Bruto total, taxas e reembolsos precisam reconciliar exatamente com o repasse.');return item;}
   if(r.tipsCents!==null && r.incentivesCents!==null && r.grossPassengerCents!+r.tipsCents+r.incentivesCents!==r.grossTotalCents){this.error.set('Confira a composição dos ganhos brutos totais.');return item;}
   const other=all.filter(x=>x.hash!==hash&&x.status==='ready');
   const overlaps=other.some(x=>x.report.periodStart&&x.report.periodEnd&&x.report.periodStart<=item.report.periodEnd!&&item.report.periodStart!<=x.report.periodEnd);
   if(overlaps){this.error.set('Os períodos se sobrepõem. Não é seguro consolidar sem reconciliar viagens.');return item;}
   this.error.set('');
   return {...item,status:'ready',issues:[]};
  }));
 }
 protected discard(hash:string){this.documents.update(items=>items.filter(x=>x.hash!==hash));this.fiscalOptIn.set(false);}
 protected clear(){this.sessionVersion++;this.pending?.abort();this.documents.set([]);this.error.set('');this.info.set('Os dados desta sessão foram apagados da memória do navegador.');this.fiscalOptIn.set(false);}
 protected downloadCsv(){
   const docs=this.canonicalApproved();
   if(!docs.length)return;
   const heading='Plataforma;Inicio;Fim;Bruto_passageiros_R$;Taxa_plataforma_R$;Repasse_R$;Gorjetas_R$;Incentivos_R$;Reembolsos_R$;Bruto_total_R$;Regra_consolidacao';
   const asValue=(v:number|null)=>v===null?'':(v/100).toFixed(2).replace('.',',');
   const rows=docs.map(({report:r})=>['Uber',r.periodStart,r.periodEnd,...FIELDS.map(k=>asValue(r[k])),'ANNUAL_PRIORITY_V2'].join(';'));
   const csv='\uFEFF'+[heading,...rows].join('\r\n');
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
   const a=this.document.createElement('a');a.href=url;a.download='calcmot-auditoria.csv';a.click();URL.revokeObjectURL(url);
   this.track('web_auditor_exported');
 }
}
