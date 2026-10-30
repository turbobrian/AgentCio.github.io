/* agentc.io: theme toggle only. The site is complete without this file. */
(function () {
  "use strict";
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = root.dataset.theme || (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
})();
