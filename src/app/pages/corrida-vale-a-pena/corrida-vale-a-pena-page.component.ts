import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { calculateRide, type RideField, type RideInputs } from '../../core/calculator/ride-calculator';
import { PageMetaService } from '../../core/services/page-meta.service';
import { SiteAnalyticsService } from '../../core/services/site-analytics.service';
import { webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { FaqListComponent } from '../../shared/components/faq-list/faq-list.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';

const PATH = '/ferramentas/corrida-vale-a-pena';
const TITLE = 'Calculadora de corrida Uber e 99: vale a pena? | CalcMot';
const DESCRIPTION = 'Calcule grátis R$/km, R$/h, custo por km e saldo estimado de uma corrida Uber ou 99. Inclua o trajeto até o passageiro e veja as fórmulas.';
const LINK = `${BRAND_TOKENS.site.url}${PATH}/`;
const DEFAULT: RideInputs = {fare:'18,00',pickupKm:'2',tripKm:'10',tripMinutes:'20',pickupMinutes:'4',costPerKm:''};
const MONEY = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const NUMBER = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});

@Component({
  selector:'app-corrida-vale-a-pena-page',
  imports:[PageHeroComponent,FaqListComponent],
  templateUrl:'./corrida-vale-a-pena-page.component.html',
  styleUrl:'./corrida-vale-a-pena-page.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class CorridaValeAPenaPageComponent {
  protected readonly fields = [
    {key:'fare',label:'Valor da oferta (R$)',hint:'Quanto o aplicativo oferece pela corrida.',required:true},
    {key:'tripKm',label:'Distância da viagem (km)',hint:'Do embarque até o destino.',required:true},
    {key:'tripMinutes',label:'Tempo da viagem (min)',hint:'Duração prevista do trajeto.',required:true},
    {key:'pickupKm',label:'Distância até o passageiro (km)',hint:'Se não souber, deixe zero.',required:false},
    {key:'pickupMinutes',label:'Tempo até o passageiro (min)',hint:'Se não souber, deixe zero.',required:false},
    {key:'costPerKm',label:'Custo do seu veículo por km (R$)',hint:'Opcional. Inclua combustível, manutenção e desgaste.',required:false},
  ] as const;
  protected readonly inputs=signal<RideInputs>({...DEFAULT});
  protected readonly touched=signal(false);
  protected readonly result=computed(()=>calculateRide(this.inputs()));
  protected readonly money=(cents:number)=>MONEY.format(cents/100);
  protected readonly number=(value:number)=>NUMBER.format(value);
  protected readonly playUrl=BRAND_TOKENS.links.playStore;
  protected readonly instagramUrl=BRAND_TOKENS.links.instagram;
  protected readonly faq=[
    {question:'Como saber se uma corrida da Uber ou 99 vale a pena?',answer:'Compare o valor oferecido com todos os quilômetros e minutos envolvidos, incluindo a busca do passageiro. R$/km e R$/h mostram o retorno bruto; custos informados permitem estimar o saldo.'},
    {question:'O cálculo inclui o deslocamento até o passageiro?',answer:'Sim, quando você preenche os quilômetros e minutos de busca. Campos opcionais em zero não significam que o deslocamento não existe.'},
    {question:'R$/km é o mesmo que lucro?',answer:'Não. R$/km é a receita bruta dividida pela distância total. O saldo desconta apenas o custo por quilômetro informado e não inclui despesas ou tempos omitidos.'},
    {question:'Preciso criar conta ou baixar aplicativo para calcular?',answer:'Não. A calculadora funciona gratuitamente neste site, sem cadastro. O aplicativo Android CalcMot é opcional para acompanhar ofertas automaticamente.'},
    {question:'O CalcMot é oficial da Uber ou da 99?',answer:'Não. O CalcMot é independente e não tem vínculo oficial com essas plataformas.'},
  ];
  private readonly pageMeta=inject(PageMetaService);
  private readonly analytics=inject(SiteAnalyticsService);
  private started=false;
  protected readonly shareFeedback=signal('');
  constructor(){
    this.pageMeta.apply({title:TITLE,description:DESCRIPTION,path:PATH,structuredData:[webSiteJsonLd(),webPageJsonLd(PATH,TITLE,DESCRIPTION)]});
  }
  protected update(field:RideField,event:Event):void{
    const target=event.target as HTMLInputElement;
    this.inputs.update(previous=>({...previous,[field]:target.value}));
    this.touched.set(true);
    if(!this.started){this.started=true;this.analytics.trackToolEvent('web_tool_started');}
  }
  protected calculate():void{
    this.touched.set(true);
    if(this.result().ok)this.analytics.trackToolEvent('web_tool_completed');
  }
  protected trackPlay():void{this.analytics.trackToolEvent('web_play_clicked');}
  protected trackInstagram():void{this.analytics.trackToolEvent('web_instagram_clicked');}
  protected async share():Promise<void>{
    if(typeof navigator==='undefined')return;
    const data={title:'Calculadora de corrida — CalcMot',text:'Veja quanto uma corrida paga por km e por hora.',url:LINK};
    try{
      if(navigator.share)await navigator.share(data);
      else if(navigator.clipboard){await navigator.clipboard.writeText(LINK);this.shareFeedback.set('Link copiado.');}
      else {this.shareFeedback.set('Copie o endereço desta página para compartilhar.');return;}
      this.analytics.trackToolEvent('web_result_shared');
    }catch{ /* cancelamento não é compartilhamento */ }
  }
}
