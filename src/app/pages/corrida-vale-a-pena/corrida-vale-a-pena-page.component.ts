import { DOCUMENT } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { calculateRide, type RideField, type RideInputs } from '../../core/calculator/ride-calculator';
import { isRideAnalysis, type RideAnalysis } from '../../core/calculator/ride-analysis';
import { PageMetaService } from '../../core/services/page-meta.service';
import { SiteAnalyticsService } from '../../core/services/site-analytics.service';
import { breadcrumbJsonLd, rideCalculatorWebAppJsonLd, webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { FaqListComponent } from '../../shared/components/faq-list/faq-list.component';

const PATH = '/ferramentas/corrida-vale-a-pena';
const TITLE = 'Calculadora de Corrida Uber e 99: Vale a Pena? | CalcMot';
const DESCRIPTION = 'Calcule se uma corrida Uber, 99 ou particular vale a pena. Compare R$/km e R$/h e analise retorno vazio, espera, custos e preço mínimo com a IA do CalcMot.';
const LINK = `${BRAND_TOKENS.site.url}${PATH}/`;
const DEFAULT: RideInputs = {fare:'18,00',pickupKm:'0',tripKm:'10',tripMinutes:'20',pickupMinutes:'0',costPerKm:''};
const COMPLETE_EXAMPLE: RideInputs = {...DEFAULT,pickupKm:'2',pickupMinutes:'4'};
const MONEY = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const NUMBER = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});

@Component({
  selector:'app-corrida-vale-a-pena-page',
  imports:[FaqListComponent],
  templateUrl:'./corrida-vale-a-pena-page.component.html',
  styleUrl:'./corrida-vale-a-pena-page.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class CorridaValeAPenaPageComponent implements OnDestroy {
  protected readonly context=signal('');
  protected readonly analysisGoal=signal('general');
  protected readonly goals=[
    {value:'general',label:'Essa corrida compensa?'},
    {value:'return',label:'E se eu voltar vazio?'},
    {value:'hourly',label:'Vou bater minha meta por hora?'},
    {value:'private',label:'Quanto cobrar no particular?'},
  ];
  protected readonly contextIdeas=[
    {label:'Volta vazia',text:'Talvez eu volte sem passageiro. Ainda não sei quantos km nem quanto tempo vai levar.'},
    {label:'Aeroporto',text:'A corrida é para o aeroporto. Não sei se vou esperar ou pagar estacionamento, nem se vou conseguir passageiro na volta.'},
    {label:'Carro alugado',text:'Meu carro é alugado. Quero saber como colocar o aluguel na conta sem descontar duas vezes.'},
  ];
  protected readonly aiAnnouncement=signal('');
  protected readonly aiLoading=signal(false);
  protected readonly aiSlow=signal(false);
  protected readonly fillFeedback=signal('');
  protected readonly verdictLabel=(value:RideAnalysis['verdict'])=>({'VALE A PENA':'A conta pode fechar para você','VALE COM RESSALVAS':'Pode valer, mas confira estes pontos','NÃO VALE A PENA':'Nessas condições, a conta não fecha','DADOS INSUFICIENTES':'Ainda falta informação para decidir'}[value]);
  protected readonly confidenceLabel=(value:RideAnalysis['insights'][number]['confidence'])=>({'CONFIRMADO':'Com base nos números informados','ESTIMADO':'É uma estimativa: confira os valores','CONDICIONAL':'Isso depende de confirmação'}[value]);
  protected readonly aiError=signal('');
  protected readonly aiResult=signal<RideAnalysis|null>(null);
  private aiController:AbortController|null=null;
  private resetAnalysis():void{
    this.aiController?.abort();
    this.aiController=null;
    this.aiLoading.set(false);
    this.aiSlow.set(false);
    this.aiError.set('');
    this.aiResult.set(null);
    this.aiAnnouncement.set('');
  }
  ngOnDestroy():void{this.aiController?.abort();}
  protected updateContext(event:Event):void{
    this.context.set((event.target as HTMLTextAreaElement).value.slice(0,1500));
    this.resetAnalysis();
  }
  protected updateGoal(event:Event):void{
    this.analysisGoal.set((event.target as HTMLSelectElement).value);
    this.resetAnalysis();
  }
  protected addContextIdea(text:string):void{
    if(this.context().includes(text))return;
    const combined=[this.context().trim(),text].filter(Boolean).join('\n');
    if(combined.length>1500){this.aiError.set('Seu contexto está quase no limite. Edite o texto para incluir esse ponto.');return;}
    this.context.set(combined);this.resetAnalysis();
    this.document.getElementById('ride-context')?.focus();
  }
  protected editCosts():void{
    this.extrasOpen.set(true);
    setTimeout(()=>this.document.getElementById('costPerKm')?.focus());
  }
  protected cancelAnalysis():void{
    this.resetAnalysis();
    this.aiAnnouncement.set('Análise cancelada. A conta da corrida continua aqui.');
  }
  protected async analyze():Promise<void>{
    if(!this.hasCalculated() || !this.result().ok || this.aiLoading() || this.aiResult())return;
    if(this.context().trim().length<10){this.aiError.set('Conte um pouco mais: use pelo menos 10 caracteres.');this.document.getElementById('ride-context')?.focus();return;}
    const controller=new AbortController();
    this.aiController=controller;
    this.aiLoading.set(true);this.aiError.set('');this.aiResult.set(null);
    const slowTimeout=setTimeout(()=>{if(this.aiController===controller)this.aiSlow.set(true);},8000);
    const timeout=setTimeout(()=>controller.abort(),35000);
    try{
      const response=await fetch('/api/tools/ride-insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inputs:this.inputs(),context:this.context(),goal:this.analysisGoal()}),signal:controller.signal});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'A análise está indisponível. Tente mais tarde.');
      if(!isRideAnalysis(data))throw new Error('Resposta inválida. Tente novamente.');
      if(this.aiController===controller){this.aiResult.set(data);this.aiAnnouncement.set(`Análise pronta: ${data.verdict}. ${data.summary}`);}
    }catch(error){
      if(this.aiController===controller)this.aiError.set(controller.signal.aborted?'A análise demorou demais. Tente novamente.':error instanceof Error?error.message:'Sem conexão com a análise. Tente novamente.');
    }finally{clearTimeout(timeout);clearTimeout(slowTimeout);if(this.aiController===controller){this.aiLoading.set(false);this.aiSlow.set(false);this.aiController=null;}}
  }
  protected readonly fields = [
    {key:'fare',label:'Quanto você vai receber?',hint:'Valor mostrado no app, em reais.',unit:'R$',placeholder:'Ex.: 18,00',required:true},
    {key:'tripKm',label:'Quantos km?',hint:'Do passageiro até o destino.',unit:'km',placeholder:'Ex.: 10',required:true},
    {key:'tripMinutes',label:'Quanto tempo?',hint:'Minutos que aparecem no app.',unit:'min',placeholder:'Ex.: 20',required:true},
    {key:'pickupKm',label:'Km até buscar o passageiro',hint:'Se não souber, deixe em branco.',unit:'km',placeholder:'Ex.: 2',required:false},
    {key:'pickupMinutes',label:'Minutos até buscar',hint:'Se não souber, deixe em branco.',unit:'min',placeholder:'Ex.: 4',required:false},
    {key:'costPerKm',label:'Quanto seu carro gasta por km?',hint:'Inclua combustível e os outros gastos que você já conhece.',unit:'R$/km',placeholder:'Ex.: 0,55',required:false},
  ] as const;
  protected readonly essentialFields = this.fields.filter(field => field.required);
  protected readonly optionalFields = this.fields.filter(field => !field.required);
  protected readonly inputs=signal<RideInputs>({fare:'',pickupKm:'',tripKm:'',tripMinutes:'',pickupMinutes:'',costPerKm:''});
  protected readonly submitted=signal(false);
  protected readonly hasCalculated=signal(false);
  protected readonly extrasOpen=signal(false);
  protected readonly result=computed(()=>calculateRide(this.inputs()));
  protected readonly money=(cents:number)=>MONEY.format(cents/100);
  protected readonly number=(value:number)=>NUMBER.format(value);
  protected readonly playUrl=BRAND_TOKENS.links.playStore;
  protected readonly instagramUrl=BRAND_TOKENS.links.instagram;
  protected readonly faq=[
    {question:'Como a Inteligência CalcMot analisa uma corrida com retorno vazio ou espera?',answer:'Calcule a oferta e descreva o retorno previsto, a espera, o pedágio e sua meta no campo de contexto. Ao tocar em Analisar com CalcMot, os valores e o texto serão enviados ao Google Gemini para gerar um diagnóstico, insights e próximos passos. A análise separa os dados informados das hipóteses, não consulta trânsito ou demanda em tempo real e não altera os indicadores da calculadora.'},
    {question:'Como calcular o preço mínimo de uma corrida particular?',answer:'Some os custos de todos os quilômetros da operação, inclusive busca e retorno, aos extras não incluídos e à remuneração desejada pelas horas comprometidas. Se os custos considerados forem R$ 40 e a meta após custos for R$ 30/h para duas horas, o mínimo desse cenário é R$ 100. O equilíbrio de R$ 40 só cobre esses custos e não remunera o seu trabalho.'},
    {question:'A IA diz se devo aceitar uma corrida Uber ou 99?',answer:'O CalcMot compara a oferta com custos, metas e condições que você informou. O resultado pode ser vale a pena, vale com ressalvas, não vale a pena ou dados insuficientes. Sem uma meta ou custo conhecido, não existe um corte universal que determine se a oferta compensa. A decisão continua com você.'},
    {question:'Posso usar a análise para negociar uma corrida particular?',answer:'Sim. Informe que é um serviço particular e descreva espera, paradas, pedágios, retorno e sua meta. A análise pode ajudar a avaliar um preço e condições antes do serviço, quando os dados forem suficientes. Em ofertas de aplicativo, o foco é avaliar a oferta disponível; a ferramenta não orienta cancelar a corrida para negociar com o passageiro fora da plataforma.'},
    {question:'Como saber se uma corrida da Uber ou 99 vale a pena?',answer:'Compare o valor oferecido com todos os quilômetros e minutos envolvidos, incluindo a busca do passageiro. R$/km e R$/h mostram o retorno bruto; custos informados permitem estimar o saldo.'},
    {question:'O cálculo inclui o deslocamento até o passageiro?',answer:'Sim, quando você preenche os quilômetros e minutos de busca. Campos opcionais em zero não significam que o deslocamento não existe.'},
    {question:'R$/km é o mesmo que lucro?',answer:'Não. R$/km é a receita bruta dividida pela distância total. O saldo desconta apenas o custo por quilômetro informado e não inclui despesas ou tempos omitidos.'},
    {question:'Preciso criar conta ou baixar aplicativo para calcular?',answer:'Não. A calculadora funciona gratuitamente neste site, sem cadastro. O aplicativo Android CalcMot é opcional para acompanhar ofertas automaticamente.'},
    {question:'Como calcular o valor por km de uma corrida Uber ou 99?',answer:'Divida o valor que você receberá pela soma da distância até o passageiro e dos quilômetros da viagem. Para saber quanto rende por hora, divida o valor pelos minutos totais e multiplique por 60.'},
    {question:'Qual é um bom valor por km para aceitar uma corrida?',answer:'Não existe um valor único que sirva para todos os motoristas. Compare o R$/km com o custo do seu veículo, sua meta de ganho e o tempo estimado. Uma oferta com boa receita por km pode render pouco por hora.'},
    {question:'A calculadora desconta combustível, manutenção e IPVA?',answer:'Ela desconta apenas o custo por km que você informar. Para estimar melhor, considere combustível, manutenção, pneus, seguro, impostos do veículo e depreciação no seu próprio custo médio.'},
    {question:'Como sei se uma corrida com passageiro longe compensa?',answer:'Some os quilômetros e minutos de deslocamento até o passageiro à viagem. Mesmo sem receber por essa busca separadamente, seu carro consome tempo e recursos, reduzindo o retorno da oferta.'},
    {question:'O CalcMot é oficial da Uber ou da 99?',answer:'Não. O CalcMot é independente e não tem vínculo oficial com essas plataformas.'},
  ];
  private readonly pageMeta=inject(PageMetaService);
  private readonly analytics=inject(SiteAnalyticsService);
  private readonly document=inject(DOCUMENT);
  private started=false;
  private firstCalculationTracked=false;
  protected readonly shareFeedback=signal('');
  protected readonly resultAnnouncement=signal('');
  constructor(){
    this.pageMeta.apply({title:TITLE,description:DESCRIPTION,path:PATH,structuredData:[webSiteJsonLd(),webPageJsonLd(PATH,TITLE,DESCRIPTION),rideCalculatorWebAppJsonLd(PATH,DESCRIPTION),breadcrumbJsonLd([{name:'Início',path:'/'},{name:'Calculadora de corrida',path:PATH}])]});
  }
  protected update(field:RideField,event:Event):void{
    this.resetAnalysis();
    this.fillFeedback.set('');
    const target=event.target as HTMLInputElement;
    this.inputs.update(previous=>({...previous,[field]:target.value}));
    this.hasCalculated.set(false);
    this.resultAnnouncement.set('');
    this.shareFeedback.set('');
    if(!this.started){this.started=true;this.analytics.trackToolEvent('web_tool_started');}
  }
  protected calculate():void{
    if(!this.started){this.started=true;this.analytics.trackToolEvent('web_tool_started');}
    this.submitted.set(true);
    this.hasCalculated.set(false);
    const calculation=this.result();
    if(!calculation.ok){
      this.resultAnnouncement.set('Confira os campos destacados antes de calcular.');
      const invalid=this.fields.find(field=>Boolean(calculation.errors[field.key]));
      if(invalid){if(!invalid.required)this.extrasOpen.set(true);setTimeout(()=>this.document.getElementById(invalid.key)?.focus());}
      return;
    }
    this.hasCalculated.set(true);
    this.analytics.trackToolEvent('web_tool_completed');
    if(!this.firstCalculationTracked){
      this.firstCalculationTracked=true;
      this.analytics.trackToolEvent('web_tool_first_completed');
    }
    const metrics=calculation.metrics;
    this.resultAnnouncement.set(
      `Cálculo atualizado: ${this.money(metrics.grossPerKmCents)} por quilômetro, ${this.money(metrics.grossPerHourCents)} por hora.`,
    );
    setTimeout(()=>{const result=this.document.getElementById('resultado-corrida');result?.focus();result?.scrollIntoView({block:'start',behavior:'instant'});});
  }
  protected clearFields():void {
    this.resetAnalysis();this.context.set('');this.analysisGoal.set('general');
    this.inputs.set({fare:'',pickupKm:'',tripKm:'',tripMinutes:'',pickupMinutes:'',costPerKm:''});
    this.submitted.set(false);
    this.hasCalculated.set(false);
    this.extrasOpen.set(false);
    this.shareFeedback.set('');
    this.resultAnnouncement.set('Campos limpos. Informe o valor, a distância e o tempo da corrida.');
    this.fillFeedback.set('Tudo limpo. Pode colocar outra corrida.');
    this.document.getElementById('fare')?.focus();
  }
  protected restoreExample():void {
    this.resetAnalysis();this.context.set('');this.analysisGoal.set('general');
    this.inputs.set({...COMPLETE_EXAMPLE});
    this.submitted.set(false);
    this.hasCalculated.set(false);
    this.extrasOpen.set(true);
    this.shareFeedback.set('');
    this.resultAnnouncement.set('Exemplo de corrida restaurado.');
    this.fillFeedback.set('Exemplo preenchido. Você pode trocar pelos seus valores.');
    this.document.getElementById('fare')?.focus();
  }
  protected trackInstagram():void{this.analytics.trackToolEvent('web_instagram_clicked');}
  protected async share():Promise<void>{
    if(typeof navigator==='undefined')return;
    const result=this.result();
    const text=this.hasCalculated() && result.ok?`Minha simulação: ${this.money(result.metrics.grossPerKmCents)}/km e ${this.money(result.metrics.grossPerHourCents)}/h de receita bruta, em ${this.number(result.metrics.totalMeters/1000)} km e ${result.metrics.totalMinutes} min. Estimativas com os dados informados.`:'Veja quanto uma corrida paga por km e por hora.';
    const data={title:'Calculadora de corrida — CalcMot',text,url:LINK};
    this.shareFeedback.set('');
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare(data))){await navigator.share(data);this.shareFeedback.set('Compartilhamento concluído.');}
      else if(navigator.clipboard){await navigator.clipboard.writeText(`${text}\n${LINK}`);this.shareFeedback.set('Resumo e link copiados. Cole onde quiser compartilhar.');}
      else {this.shareFeedback.set('Copie o endereço desta página para compartilhar.');return;}
      this.analytics.trackToolEvent('web_result_shared');
    }catch(error){if(!(error instanceof DOMException && error.name==='AbortError'))this.shareFeedback.set('Não foi possível compartilhar. Copie o endereço desta página ou tente novamente.');}
  }
}
