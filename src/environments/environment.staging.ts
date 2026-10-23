/** Explicit administrative staging artifact; never selects PROD resources. */
export const environment = {
  admin: { environment: "DEV", mutationsEnabled: true },
} as const;
