/** Test-only telemetry adapter. No network. */
export const telemetry = {
  initialized: 0,
  captured: [] as unknown[],
  handled: [] as unknown[],
};
export function init(_options: unknown) {
  telemetry.initialized++;
}
export function captureException(error: unknown) {
  telemetry.captured.push(error);
}
export function createErrorHandler() {
  return {
    handleError(error: unknown) {
      telemetry.handled.push(error);
    },
  };
}
