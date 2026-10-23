/** Local/default build stays on the currently published DEV backend. */
export const environment = {
  admin: { environment: "DEV", mutationsEnabled: true },
} as const;
