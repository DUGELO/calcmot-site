import type { AdminSession } from "../data-access/admin.models";
import type { AdminConfig, AdminEnvironment } from "./admin.config";

export function isCompatibleSession(
  value: unknown,
  expected: AdminEnvironment,
): value is AdminSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AdminSession>;
  return (
    (expected === "DEV" || expected === "PROD") &&
    session.environment === expected &&
    ((session.contractVersion === "1.3.0" &&
      typeof session.mutationsEnabled === "boolean") ||
      (expected === "DEV" &&
        session.contractVersion === "1.2.0" &&
        session.mutationsEnabled === undefined)) &&
    session.authenticated === true &&
    typeof session.reauthenticationRequired === "boolean" &&
    typeof session.reauthenticateBy === "string" &&
    typeof session.serverNow === "string"
  );
}

/** PROD is deliberately read-only in this preparation, even if misconfigured true. */
export function adminWritesEnabled(config: AdminConfig): boolean {
  return config.environment === "DEV" && config.mutationsEnabled === true;
}

export function sessionWritesEnabled(
  session: AdminSession,
  config: AdminConfig,
): boolean {
  return (
    isCompatibleSession(session, config.environment) &&
    adminWritesEnabled(config) &&
    (session.contractVersion === "1.2.0" || session.mutationsEnabled === true)
  );
}
