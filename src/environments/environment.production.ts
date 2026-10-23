/** Prepared PROD artifact. Commercial writes remain disabled. */
export const environment = {
  admin: { environment: "PROD", mutationsEnabled: false },
} as const;
