export * from "./admin.contracts";
import type {
  ClaimState,
  DecisionInput,
  EvidenceInput,
  IssuanceInput,
} from "./admin.contracts";
export const STATE_LABELS: Record<ClaimState, string> = {
  UNDER_REVIEW: "Em análise",
  GRANTED: "Direito emitido",
  REJECTED: "Recusado",
};
export interface MutationIntent<T> {
  readonly body: T;
  readonly revision: number;
  readonly key: string;
}
export type PendingOperation =
  | { kind: "decision"; claimId: string; intent: MutationIntent<DecisionInput> }
  | { kind: "evidence"; claimId: string; intent: MutationIntent<EvidenceInput> }
  | {
      kind: "issuance";
      claimId: string;
      intent: MutationIntent<IssuanceInput>;
    };
export const DECISION_LABELS: Record<DecisionInput["outcome"], string> = {
  APPROVE: "Aprovar para emissão",
  REJECT: "Recusar solicitação",
  REQUEST_MORE: "Solicitar complementação",
  OWNERSHIP_CONFLICT: "Registrar conflito de titularidade",
};
export const EVENT_LABELS: Record<string, string> = {
  APPROVE: "Aprovação registrada",
  REJECT: "Solicitação recusada",
  REQUEST_MORE: "Complementação solicitada",
  OWNERSHIP_CONFLICT: "Conflito de titularidade",
  GRANT_ISSUED: "Direito emitido",
  EVIDENCE_ADDED: "Evidência registrada",
  CLAIM_OPENED: "Solicitação aberta",
};
