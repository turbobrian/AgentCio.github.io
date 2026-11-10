/* agentc.io: theme toggle, phone menu and the background field. The site is complete without this file. */
(function () {
  "use strict";
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const current = root.dataset.theme || (systemDark ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  const menu = document.querySelector(".menu-toggle"), nav = document.getElementById("site-nav");
  if (menu && nav) {
    const setOpen = (open) => { nav.classList.toggle("is-open", open); menu.setAttribute("aria-expanded", String(open)); };
    menu.addEventListener("click", () => setOpen(menu.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".site-header")) setOpen(false); });
  }

  // Background field: faint points drifting slowly, joined when they come
  // close. Decorative and deliberately quiet; it stops
  // when the tab is hidden, and stays still for readers who ask for less motion.
  const canvas = document.querySelector(".field");
  const ctx = canvas && canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;

  const LINK = 165;      // px: points closer than this are joined
  const SPEED = 2.5;       // px per second, at most
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  try { paused = localStorage.getItem("field") === "off"; } catch (e) {}
  let w = 0, h = 0, points = [], last = 0, frame = 0, ink = "";

  function colors() {
    const cs = getComputedStyle(root);
    ink = cs.getPropertyValue("--fg").trim() || "#1c1c1e";
  }

  // Phones fire a resize every time the browser's toolbar slides in or out
  // while scrolling. Re-laying the field out on each of those made it jump, so
  // the layout is redone only when the width changes; a taller viewport just
  // extends the canvas, and a shorter one is ignored.
  function resize() {
    const nw = window.innerWidth, nh = window.innerHeight;
    if (nw === w && nh <= h) return false;
    const widthChanged = nw !== w;
    w = nw; h = widthChanged ? nh : Math.max(h, nh);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (widthChanged) {
      const want = Math.max(14, Math.min(70, Math.round((w * h) / 20000)));
      while (points.length < want) {
        const a = Math.random() * Math.PI * 2, v = SPEED * (0.3 + Math.random() * 0.7);
        points.push({ x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
      }
      points.length = want;
    }
    return true;
  }

  // Points turn back at the edges. They used to reappear on the opposite side,
  // which made their links vanish and pop back in.
  function step(dt) {
    for (const p of points) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); } else if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } else if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const q = points[j], d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d >= LINK) continue;
        ctx.globalAlpha = 0.09 * (1 - d / LINK);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.globalAlpha = 0.13;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    step(dt);
    draw();
    run();
  }

  function run() {
    if (frame || paused || reduce.matches || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }

  colors(); resize(); draw(); run();
  window.addEventListener("resize", () => { if (resize()) draw(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));
  reduce.addEventListener("change", () => (reduce.matches ? stop() : run()));
  new MutationObserver(() => { colors(); draw(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { colors(); draw(); });

  const motion = document.querySelector(".motion-toggle");
  if (motion && !reduce.matches) {
    motion.hidden = false;
    const label = () => { motion.textContent = paused ? "resume background" : "pause background"; };
    label();
    motion.addEventListener("click", () => {
      paused = !paused;
      try { localStorage.setItem("field", paused ? "off" : "on"); } catch (e) {}
      label();
      paused ? stop() : run();
    });
  }
})();
