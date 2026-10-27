/** PROD capability; actual writes require the backend session flag and authorization. */
export const environment = {
  admin: { environment: "PROD", mutationsEnabled: true },
} as const;
