import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { AdminPolicyBootstrap } from "./admin-policy-bootstrap.service";

@Component({
  selector: "admin-policy-bootstrap",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="policy-title" [attr.aria-busy]="flow.busy()">
      <p>CONFIGURAÇÃO PRIVADA · PROD</p>
      <h1 id="policy-title">Registrar a política aprovada</h1>
      <p>Esta ação registra somente a política de recuperação
        <strong>legacy-through-3.5-vc12</strong> no ambiente PROD.
        Nenhum direito será emitido e as permissões comerciais não serão alteradas.</p>
      @switch (flow.state()) {
        @case ("idle") {
          <p>Abra a ferramenta privada neste computador. O navegador poderá pedir permissão
            para conectar ao próprio computador. Não envie senhas ou códigos.</p>
          <button (click)="flow.connect()">Conectar à ferramenta privada</button>
        }
        @case ("connecting") { <p role="status">Validando conexão privada…</p> }
        @case ("confirmed") {
          <p role="status">Ferramenta privada conectada. Confirme a ação para continuar.</p>
          <label><input type="checkbox" #confirmation (change)="consented = confirmation.checked" />
            Confirmo o registro desta política em PROD, sem emissão de direitos.</label>
          <button [disabled]="!consented" (click)="flow.register(consented)">
            Confirmar identidade com Google e registrar política
          </button>
        }
        @case ("sending") {
          <p role="status">Confirme sua identidade no Google. Depois aguarde o recibo do registro.
            Não feche esta aba.</p>
        }
        @case ("done") {
          <p role="status">Política registrada e confirmada. Nenhum direito emitido.</p>
          @if (flow.receipt(); as receipt) {
            <dl><dt>Referência</dt><dd>{{ receipt.operationId }}</dd>
              <dt>Política</dt><dd>{{ receipt.policyVersion }}</dd>
              <dt>Registro confirmado em</dt><dd>{{ receipt.policyRecordedAt }}</dd></dl>
          }
        }
        @case ("error") { <p role="alert">{{ flow.message() }}</p> }
      }
      <button [disabled]="flow.busy()" (click)="flow.cancel()">Voltar ao painel</button>
    </section>
  `,
  styles: `section { max-width: 680px; padding: 28px; border: 1px solid var(--color-border-strong);
    border-radius: 16px; background: var(--color-surface); }
    p { line-height: 1.7; } label { display: flex; gap: 12px; margin: 24px 0; }
    button { display: block; margin-top: 18px; padding: 12px 18px; border-radius: 10px;
      background: var(--color-brand-green); color: #07160e; font: inherit; cursor: pointer; }
    button:disabled { opacity: .55; cursor: default; } button:focus-visible, input:focus-visible {
      outline: 3px solid var(--color-brand-green); outline-offset: 4px; } dd { overflow-wrap: anywhere; margin: 4px 0 16px; }
    @media(max-width: 600px) { section { padding: 18px; } button { width: 100%; } }`,
})
export class PolicyBootstrapPanelComponent {
  readonly flow = inject(AdminPolicyBootstrap);
  consented = false;
}
