import {
  initializeSentry,
  captureBootstrapError,
  createSiteErrorHandler,
} from "../src/app/core/observability/sentry.config";
import { enableProdMode } from "@angular/core";
import { telemetry } from "./sentry.fixture";
import assert from "node:assert/strict";
export async function testTelemetryBoundary() {
  enableProdMode();
  const location = { hostname: "calcmot.com.br", pathname: "/admin" };
  Object.defineProperty(globalThis, "window", {
    value: { location },
    configurable: true,
  });
  initializeSentry();
  captureBootstrapError("synthetic-admin");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(telemetry.initialized, 0);
  assert.equal(telemetry.captured.length, 0);
  location.pathname = "/";
  initializeSentry();
  captureBootstrapError("synthetic-early-public");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(telemetry.initialized, 1);
  assert.deepEqual(telemetry.captured, ["synthetic-early-public"]);
  createSiteErrorHandler().handleError("synthetic-public-runtime");
  assert.deepEqual(telemetry.handled, ["synthetic-public-runtime"]);
  location.pathname = "/admin";
  captureBootstrapError("synthetic-private-error");
  assert.equal(telemetry.captured.length, 1);
  Reflect.deleteProperty(globalThis, "window");
  console.log(
    "OK Public telemetry loads lazily, preserves early errors and stays off admin",
  );
}
