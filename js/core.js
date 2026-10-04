/* =====================================================================
   CORE — DOM helpers and the two 3D primitives (box, cylinder) every
   part of the scene is built from; easing curves; reduced motion.
   ===================================================================== */
const $ = s => document.querySelector(s);
const px = v => v + "px";
function div(cls, parent, css, tag = "div") {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (css) Object.assign(d.style, css);
  parent.appendChild(d);
  return d;
}
function box(parent, x, y, w, d, h, cls = "", z = 0) {
  const r = div("box " + cls, parent, { left: px(x), top: px(y), width: px(w), height: px(d) });
  r.style.setProperty("--z", px(z));
  div("bx-s bx-back", r, { left: 0, top: 0, width: px(w), height: px(h) });
  div("bx-s bx-left", r, { left: 0, top: 0, width: px(h), height: px(d) });
  div("bx-s bx-right", r, { left: px(w - h), top: 0, width: px(h), height: px(d) });
  div("bx-s bx-front", r, { left: 0, top: px(d - h), width: px(w), height: px(h) });
  const t = div("bx-top", r, { width: px(w), height: px(d), transform: `translateZ(${h}px)` });
  return { r, t };
}
/* smooth cylinder: bottom disc, a body that always faces the camera, top disc */
function cyl(parent, cx, cy, dia, h, cls = "", z = 0, opts = {}) {
  const r = div("cyl " + cls, parent, {
    left: px(cx - dia / 2),
    top: px(cy - dia / 2),
    width: px(dia),
    height: px(dia),
  });
  r.style.setProperty("--z", px(z));
  if (!opts.noBot) div("cyl-bot", r);
  const body = div("cyl-body", r, { top: px(dia / 2 - h), width: px(dia), height: px(h) });
  let t = null;
  if (!opts.noTop) t = div("cyl-top", r, { transform: `translateZ(${h}px)` }, opts.topTag || "div");
  return { r, t, body, h, d: dia };
}

/* visitors who ask for less motion get every end state, without the animations */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* easing: in-out cubic, out cubic */
const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  eout = t => 1 - Math.pow(1 - t, 3);
