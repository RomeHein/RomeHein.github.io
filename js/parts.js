/* =====================================================================
   PARTS — 3D models of the electronic components placed on the faces:
   chip package, push-button base, LED, capacitors, resistors, ICs…
   Each one is built from box() and cyl() (core.js).
   ===================================================================== */
/* box with 45° chamfered vertical corners (chip package) */
function chamferBox(parent, x, y, w, d, h, c, cls, z = 0) {
  const r = div("box " + cls, parent, { left: px(x), top: px(y), width: px(w), height: px(d) });
  r.style.setProperty("--z", px(z));
  div("bx-s bx-back", r, { left: px(c), top: 0, width: px(w - 2 * c), height: px(h) });
  div("bx-s bx-left", r, { left: 0, top: px(c), width: px(h), height: px(d - 2 * c) });
  div("bx-s bx-right", r, { left: px(w - h), top: px(c), width: px(h), height: px(d - 2 * c) });
  div("bx-s bx-front", r, { left: px(c), top: px(d - h), width: px(w - 2 * c), height: px(h) });
  const cw = c * Math.SQRT2;
  [
    [c / 2, c / 2, 225],
    [w - c / 2, c / 2, 135],
    [w - c / 2, d - c / 2, 45],
    [c / 2, d - c / 2, 315],
  ].forEach(([cx, cy, b]) => {
    const f = div("bx-s", r, {
      left: px(cx - cw / 2),
      top: px(cy - h),
      width: px(cw),
      height: px(h),
      transformOrigin: "50% 100%",
      transform: `rotateZ(${-b}deg) rotateX(-90deg)`,
    });
    f.style.setProperty("--b", b + "deg");
  });
  const t = div("bx-top", r, {
    width: px(w),
    height: px(d),
    transform: `translateZ(${h}px)`,
    clipPath: `polygon(${c}px 0,${w - c}px 0,${w}px ${c}px,${w}px ${d - c}px,${w - c}px ${d}px,${c}px ${d}px,0 ${d - c}px,0 ${c}px)`,
  });
  return { r, t };
}

const SCREW =
  '<svg viewBox="0 0 10 10" fill="none" stroke="#3b419c" stroke-width="1.2"><circle cx="5" cy="5" r="4"/><path d="M5 2.2v5.6M2.2 5h5.6"/></svg>';
/* push-button base: a plate standing on four legs, X screws in the corners */
function buttonBase(parent, x, y, s) {
  const L = 10,
    H = 7;
  [
    [3, 3],
    [s - L - 3, 3],
    [3, s - L - 3],
    [s - L - 3, s - L - 3],
  ].forEach(([a, b]) => box(parent, x + a, y + b, L, L, H, "bleg"));
  const b = box(parent, x, y, s, s, 8, "base", H);
  [
    [5, 5],
    [s - 15, 5],
    [5, s - 15],
    [s - 15, s - 15],
  ].forEach(([a, c]) => (div("screw", b.t, { left: px(a), top: px(c) }).innerHTML = SCREW));
  return H + 8;
}

/* ---- component models ---- */
function part(parent, x, y, rot = 0) {
  const w = div("part", parent, { left: px(x), top: px(y), transform: rot ? `rotate(${rot}deg)` : "" });
  if (rot) w.style.setProperty("--R", rot + "deg"); // parts sit on the board (frame 0°)
  return w;
}
function led(parent, x, y, color) {
  const w = part(parent, x, y);
  w.classList.add("led");
  w.style.setProperty("--lc", color);
  [-3, 3].forEach(dx => cyl(w, dx, 0, 2, 5, "leg", 0, { noTop: true, noBot: true }));
  cyl(w, 0, 0, 20, 3, "flange", 4);
  const R0 = 8.5,
    bodyH = 26 - R0; // cylinder, then a hemispherical dome
  const d = cyl(w, 0, 0, 17, bodyH, "dome", 7, { noTop: true, noBot: true });
  d.body.innerHTML = '<i class="lf lf1"></i><i class="lf lf2"></i>';
  const cap = div("led-cap", w, { left: px(-R0), top: px(-R0), width: px(2 * R0), height: px(2 * R0) });
  cap.style.setProperty("--zc", px(7 + bodyH));
  return w;
}
function capacitor(parent, x, y) {
  const w = part(parent, x, y);
  w.classList.add("capc");
  [-8, 8].forEach(dx => cyl(w, dx, 0, 3, 6, "leg", 0, { noTop: true, noBot: true }));
  cyl(w, 0, 0, 48, 13, "cbody", 5);
  cyl(w, 0, 0, 44, 3, "cgroove", 18, { noTop: true, noBot: true });
  const m = cyl(w, 0, 0, 48, 46, "cbody cmain", 21);
  m.t.innerHTML =
    '<div class="cap-face"><svg class="cap-x" viewBox="0 0 40 40"><path d="M20 3V37M3 20H37" stroke="#4f8fd6" stroke-width="5" stroke-linecap="round"/></svg></div>';
}
/* axial resistor between two lead holes (x1,y1)-(x2,y2), horizontal or vertical */
function resistor(parent, x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1),
    rot = x1 === x2 ? 90 : 0;
  const w = part(parent, (x1 + x2) / 2, (y1 + y2) / 2, rot);
  const L = len - 18,
    D = 13,
    zc = 11;
  const body = div("lc-body", w, { left: px(-L / 2), top: px(-D / 2), width: px(L), height: px(D) });
  body.style.setProperty("--zc", px(zc));
  [-L / 2, L / 2].forEach(x => {
    const c = div("lc-cap", w, { left: px(x - D / 2), top: px(-D / 2), width: px(D), height: px(D) });
    c.style.setProperty("--zc", px(zc));
    c.style.setProperty("--ry", x < 0 ? "-90deg" : "90deg");
  });
  const leadLen = (len - L) / 2;
  box(w, -len / 2 - 1.5, -1.5, leadLen + 1.5, 3, 3, "lead", zc - 1.5);
  box(w, L / 2, -1.5, leadLen + 1.5, 3, 3, "lead", zc - 1.5);
  box(w, -len / 2 - 1.5, -1.5, 3, 3, zc + 1.5, "lead");
  box(w, len / 2 - 1.5, -1.5, 3, 3, zc + 1.5, "lead");
}
/* SMD IC with pads: pins = [side, coord, color] */
function smd(parent, x, y, w, d, pins) {
  pins.forEach(([side, c, col]) => {
    const css =
      side === "W"
        ? { left: px(x - 6), top: px(c - 3.5), width: "10px", height: "7px" }
        : side === "E"
          ? { left: px(x + w - 4), top: px(c - 3.5), width: "10px", height: "7px" }
          : side === "N"
            ? { left: px(c - 3.5), top: px(y - 6), width: "7px", height: "10px" }
            : { left: px(c - 3.5), top: px(y + d - 4), width: "7px", height: "10px" };
    div("pad-" + col, parent, css);
  });
  const b = box(parent, x, y, w, d, 8, "smd");
  div("notch", b.t);
  div("bar", b.t, { left: "22%", top: "30%", width: "58%" });
  div("bar", b.t, { left: "34%", top: "58%", width: "42%" });
}
/* TO-220 regulator standing on three legs, metal tab with its hole */
function regulator(parent, ox = 0, oy = 0) {
  [126, 140, 154].forEach(x => box(parent, ox + x - 2.5, oy + 50, 5, 3, 15, "to-leg"));
  const b = box(parent, ox + 122, oy + 44, 36, 12, 32, "to-body", 15);
  b.r.querySelectorAll(".bx-front,.bx-back").forEach(f => {
    div("to-mark", f, { top: "22%", width: "58%" });
    div("to-mark", f, { top: "44%", width: "40%" });
  });
  const t = box(parent, ox + 122, oy + 44, 36, 4, 17, "to-tab", 47); // shorter metal tab
  t.r.querySelectorAll(".bx-front,.bx-back").forEach(f => div("to-hole", f));
}

/* 0805 SMD resistor: body and tinned caps */
function smdR(parent, x1, y1, x2, y2) {
  const W = 8,
    C = 4;
  if (x1 === x2) {
    box(parent, x1 - W / 2, y1, W, C, 3.4, "smdr-cap");
    box(parent, x1 - W / 2, y2 - C, W, C, 3.4, "smdr-cap");
    const b = box(parent, x1 - W / 2, y1 + C, W, y2 - y1 - 2 * C, 3, "smdr-body");
    b.t.style.background =
      "linear-gradient(180deg,transparent 40%,rgba(160,150,230,.35) 40% 60%,transparent 60%),var(--t)";
  } else {
    box(parent, x1, y1 - W / 2, C, W, 3.4, "smdr-cap");
    box(parent, x2 - C, y1 - W / 2, C, W, 3.4, "smdr-cap");
    box(parent, x1 + C, y1 - W / 2, x2 - x1 - 2 * C, W, 3, "smdr-body");
  }
}
function smdC(parent, x1, y1, x2, y2) {
  // ceramic capacitor: tan body, tinned ends
  const Wd = 8,
    C = 3;
  if (x1 === x2) {
    box(parent, x1 - Wd / 2, y1, Wd, C, 3.6, "smdr-cap");
    box(parent, x1 - Wd / 2, y2 - C, Wd, C, 3.6, "smdr-cap");
    box(parent, x1 - Wd / 2, y1 + C, Wd, y2 - y1 - 2 * C, 3.4, "smdc-body");
  } else {
    box(parent, x1, y1 - Wd / 2, C, Wd, 3.6, "smdr-cap");
    box(parent, x2 - C, y1 - Wd / 2, C, Wd, 3.6, "smdr-cap");
    box(parent, x1 + C, y1 - Wd / 2, x2 - x1 - 2 * C, Wd, 3.4, "smdc-body");
  }
}
function sot23(parent, x, y) {
  // SOT-23 transistor: base on the left, collector/emitter on the right
  box(parent, x - 4, y + 8, 5, 4, 1.5, "ic-pin");
  box(parent, x + 11, y + 1, 5, 4, 1.5, "ic-pin");
  box(parent, x + 11, y + 15, 5, 4, 1.5, "ic-pin");
  box(parent, x, y, 12, 20, 4, "sot-body");
}
function eCap(parent, cx, cy, d) {
  // small electrolytic capacitor
  const w = part(parent, cx, cy);
  w.classList.add("capc");
  cyl(w, 0, 0, d, d * 0.22, "cbody", 1);
  cyl(w, 0, 0, d - 3, 2, "cgroove", 1 + d * 0.22, { noTop: true, noBot: true });
  const m = cyl(w, 0, 0, d, d * 0.8, "cbody cmain", 3 + d * 0.22);
  m.t.innerHTML =
    '<div class="cap-face" style="inset:3px"><svg class="cap-x" viewBox="0 0 40 40"><path d="M20 3V37M3 20H37" stroke="#4f8fd6" stroke-width="5" stroke-linecap="round"/></svg></div>';
}
