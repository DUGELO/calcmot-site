import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { PLATFORM_ID, inject } from "@angular/core";
import type { CanMatchFn } from "@angular/router";

/** Cross the public/admin boundary with a fresh document, without public trackers. */
export const adminDocumentBoundary: CanMatchFn = (_route, segments) => {
  const document = inject(DOCUMENT);
  if (
    isPlatformBrowser(inject(PLATFORM_ID)) &&
    !/^\/admin(?:\/|$)/.test(document.location.pathname)
  ) {
    document.defaultView?.location.assign(
      "/" +
        segments.map((segment) => encodeURIComponent(segment.path)).join("/"),
    );
    return false;
  }
  return true;
};
