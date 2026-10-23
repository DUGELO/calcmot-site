/** Build host only. Never imported into the browser or populated from a URL. */
export function adminBuildEnvironment(
  value = process.env.CALCMOT_ADMIN_ENVIRONMENT,
) {
  const target = value === undefined ? "DEV" : value;
  if (target !== "DEV" && target !== "PROD")
    throw new Error("CALCMOT_ADMIN_ENVIRONMENT must be exactly DEV or PROD.");
  return {
    target,
    configuration: `production,admin-${target === "DEV" ? "staging" : "production"}`,
  };
}
