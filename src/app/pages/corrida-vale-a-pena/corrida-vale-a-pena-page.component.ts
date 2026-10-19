import { DOCUMENT } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { calculateRide, type RideField, type RideInputs } from '../../core/calculator/ride-calculator';
import { PageMetaService } from '../../core/services/page-meta.service';
import { SiteAnalyticsService } from '../../core/services/site-analytics.service';
import { rideCalculatorWebAppJsonLd, webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { FaqListComponent } from '../../shared/components/faq-list/faq-list.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';

const PATH = '/ferramentas/corrida-vale-a-pena';
const TITLE = 'Calculadora de Corrida Uber e 99: Vale a Pena? | CalcMot';
const DESCRIPTION = 'Simule uma corrida da Uber ou 99 grátis. Calcule ganhos por km e hora, inclua o deslocamento até o passageiro e estime os custos do carro.';
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
  protected readonly essentialFields = this.fields.filter(field => field.required);
  protected readonly optionalFields = this.fields.filter(field => !field.required);
  protected readonly inputs=signal<RideInputs>({...DEFAULT});
  protected readonly submitted=signal(false);
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
    this.pageMeta.apply({title:TITLE,description:DESCRIPTION,path:PATH,structuredData:[webSiteJsonLd(),webPageJsonLd(PATH,TITLE,DESCRIPTION),rideCalculatorWebAppJsonLd(PATH,DESCRIPTION)]});
  }
  protected update(field:RideField,event:Event):void{
    const target=event.target as HTMLInputElement;
    this.inputs.update(previous=>({...previous,[field]:target.value}));
    this.resultAnnouncement.set('');
    this.shareFeedback.set('');
    if(!this.started){this.started=true;this.analytics.trackToolEvent('web_tool_started');}
  }
  protected calculate():void{
    if(!this.started){this.started=true;this.analytics.trackToolEvent('web_tool_started');}
    this.submitted.set(true);
    const calculation=this.result();
    if(!calculation.ok){
      this.resultAnnouncement.set('Confira os campos destacados antes de calcular.');
      const invalid=this.fields.find(field=>Boolean(calculation.errors[field.key]));
      if(invalid)this.document.getElementById(invalid.key)?.focus();
      return;
    }
    this.analytics.trackToolEvent('web_tool_completed');
    if(!this.firstCalculationTracked){
      this.firstCalculationTracked=true;
      this.analytics.trackToolEvent('web_tool_first_completed');
    }
    const metrics=calculation.metrics;
    this.resultAnnouncement.set(
      `Cálculo atualizado: ${this.money(metrics.grossPerKmCents)} por quilômetro, ${this.money(metrics.grossPerHourCents)} por hora.`,
    );
    this.document.getElementById('resultado-corrida')?.focus();
  }
  protected clearFields():void {
    this.inputs.set({fare:'',pickupKm:'',tripKm:'',tripMinutes:'',pickupMinutes:'',costPerKm:''});
    this.submitted.set(false);
    this.shareFeedback.set('');
    this.resultAnnouncement.set('Campos limpos. Informe o valor, a distância e o tempo da corrida.');
    this.document.getElementById('fare')?.focus();
  }
  protected restoreExample():void {
    this.inputs.set({...DEFAULT});
    this.submitted.set(false);
    this.shareFeedback.set('');
    this.resultAnnouncement.set('Exemplo de corrida restaurado.');
    this.document.getElementById('fare')?.focus();
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
