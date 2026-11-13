"use client";

/**
 * A full page load, used on purpose after logging in or out: it drops the
 * previous person's diary from memory and lets the server set the new
 * person's theme colour on <html>. A client-side push would keep both.
 */
export function reloadTo(path: "/" | "/login") {
  window.location.assign(path);
}
