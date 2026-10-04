/* =====================================================================
   TOWER — the column left of the cube: WELCOME in nixie tubes on its
   left wall, a 14-segment display on its front, social buttons on top.
   ===================================================================== */
/* WELCOME in nixie tubes, each on a bracket jutting out of the tower's left wall */
const NIXIE = [];
function buildNixie() {
  const tower = $("#tower"),
    wall = $("#towerLeft");
  const word = "WELCOME",
    Z = 112; // tubes line up where the name used to be
  [...word].forEach((ch, k) => {
    const fy = 108 + 66 * k; // position on the wall, from the tower top
    // plane lying on the wall: local x → along the wall, y → down, z → out of the wall
    const plane = div("nx nx-tube", tower, {
      transform: `translate3d(-168px, ${-700 + fy}px, ${Z}px) rotateY(-90deg)`,
    });
    box(plane, 3, 3, 54, 54, 4, "nx-plate"); // mounting plate screwed to the wall
    cyl(plane, 30, 30, 46, 8, "nx-sock", 4); // socket, base against the wall
    div("nx-anode", plane, { transform: "translateZ(24px)" });
    const g = div("nx-glyph", plane, { transform: "translateZ(29px)" }); // parallel to the wall: reads upright
    g.innerHTML = `<span class="off">8</span><span class="off">O</span><span class="lit">${ch}</span>`;
    const gl = glass(k, fy, Z);
    const halo = div("nx-halo", wall, { left: `${Z + 168}px`, top: `${fy}px` });
    NIXIE.push({ plane, lit: g.querySelector(".lit"), halo, gl, ch });
  });
  wall.setAttribute("aria-label", "Welcome");
  // warm-up, one tube after the other
}
function nixieWarmUp() {
  NIXIE.forEach((t, k) =>
    setTimeout(
      () => {
        t.plane.classList.add("warm");
        t.halo.style.setProperty("--on", 1);
        t.gl.classList.add("warm");
        flick(t);
      },
      reduce ? 0 : 400 + 180 * k,
    ),
  );
  setTimeout(() => NIXIE.forEach(t => t.plane.classList.add("hum")), 2000);
  if (!reduce) {
    setTimeout(randomFlicker, 3500);
    setTimeout(scramble, 9000);
  }
}
/* The tube's axis points straight out of the wall. For the tower's camera that axis
   shows on screen at 150°, foreshortened to 0.8165, and its end circles become
   ellipses squashed to 0.5774. The outline is therefore a capsule: straight
   sides, half-ellipse at the socket, round dome at the tip. */
const TUBE = { r: 20, base: 12, len: 42 };
/* project a point of the tower (its own coordinates) onto the 1440×900 world:
   tower camera at (175, 625), rig = rotateX(−35.264°) · rotateY(45°) */
function towerToScreen([x, y, z]) {
  const c = Math.SQRT1_2,
    s1 = Math.sin((-35.264 * Math.PI) / 180),
    c1 = Math.cos((-35.264 * Math.PI) / 180);
  const X = x * c + z * c,
    Z = -x * c + z * c; // rotateY(45°)
  return [175 + X, 625 + y * c1 - Z * s1]; // rotateX(−35.264°), keep screen x/y
}
let nxOverlay;
function glass(k, fy, Z) {
  if (!nxOverlay) {
    nxOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    nxOverlay.setAttribute("class", "nx-overlay");
    nxOverlay.setAttribute("viewBox", "0 0 1440 900");
    $("#world").appendChild(nxOverlay);
  }
  const { r, base, len } = TUBE,
    Lp = (len - r) * 0.8165,
    e = r * 0.5774,
    id = "g" + k;
  const [sx, sy] = towerToScreen([-168 - base, -700 + fy, Z]); // centre of the tube where the glass meets the socket
  const cap = `M0 ${-r}H${Lp}A${r} ${r} 0 0 1 ${Lp} ${r}H0A${e} ${r} 0 0 1 0 ${-r}Z`;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "nx-glass");
  g.setAttribute("transform", `translate(${sx.toFixed(2)} ${sy.toFixed(2)}) rotate(150)`);
  g.innerHTML = `<defs>
      <linearGradient id="${id}f" gradientUnits="userSpaceOnUse" x1="0" y1="${-r}" x2="0" y2="${r}">
        <stop offset="0" stop-color="rgb(255,236,220)" stop-opacity=".22"/><stop offset=".3" stop-color="rgb(255,200,160)" stop-opacity=".06"/>
        <stop offset=".62" stop-color="rgb(255,180,130)" stop-opacity=".05"/><stop offset=".9" stop-color="rgb(255,226,205)" stop-opacity=".2"/>
        <stop offset="1" stop-color="rgb(255,255,255)" stop-opacity=".08"/></linearGradient>
      <radialGradient id="${id}g" cx="${(29 - base) * 0.8165}" cy="0" r="${r * 0.82}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff9a3c" stop-opacity=".32"/><stop offset=".45" stop-color="#ff7a1a" stop-opacity=".14"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}b" cx="${(29 - base) * 0.8165}" cy="0" r="${r * 1.35}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff8a24" stop-opacity=".26"/><stop offset=".5" stop-color="#ff6a10" stop-opacity=".08"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}c"><path d="${cap}"/></clipPath></defs>
    <circle class="bloom" cx="${(29 - base) * 0.8165}" cy="0" r="${r * 1.35}" fill="url(#${id}b)"/>
    <path d="${cap}" fill="url(#${id}f)"/>
    <g clip-path="url(#${id}c)">
      <rect class="glow" x="${-r}" y="${-r}" width="${Lp + 2 * r}" height="${2 * r}" fill="url(#${id}g)"/>
      <path d="M0 ${-r}A${e} ${r} 0 0 1 0 ${r}" fill="none" stroke="rgba(255,225,205,.3)" stroke-width="1"/>
      <path d="M${Lp * 0.2} ${-r * 0.8}H${Lp + 3}" stroke="rgba(255,255,255,.4)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${Lp + r * 0.35} ${-r * 0.72}A${r * 0.8} ${r * 0.8} 0 0 1 ${Lp + r * 0.78} ${-r * 0.15}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M${Lp * 0.3} ${r * 0.82}H${Lp + 2}" stroke="rgba(255,210,180,.16)" stroke-width="1.8" stroke-linecap="round"/>
    </g>
    <path d="M0 ${-r}H${Lp}A${r} ${r} 0 0 1 ${Lp} ${r}H0" fill="none" stroke="rgba(255,226,206,.42)" stroke-width="1.3"/>
    <rect x="${Lp + r - 1}" y="-2.5" width="5" height="5" rx="2" fill="rgba(255,230,210,.4)"/>`;
  nxOverlay.appendChild(g);
  return g;
}

/* nixie driver: vertical DIP beside the tubes, 8 pins per side (inputs left, outputs right) */
function nixieDriver(parent, o) {
  for (let y = o.y + 14; y <= o.y + o.h - 12; y += 14) {
    box(parent, o.x - 6, y - 2, 7, 4, 1.5, "ic-pin");
    box(parent, o.x + o.w - 1, y - 2, 7, 4, 1.5, "ic-pin");
  }
  const b = box(parent, o.x, o.y, o.w, o.h, 5, "ic-body");
  div("ic-dot", b.t);
  div("", b.t, {
    position: "absolute",
    left: "9px",
    top: "24px",
    width: "2px",
    height: "48px",
    background: "#4c55a8",
    borderRadius: "1px",
  });
  div("", b.t, {
    position: "absolute",
    left: "15px",
    top: "24px",
    width: "2px",
    height: "30px",
    background: "#4c55a8",
    borderRadius: "1px",
  });
  const t = div("", b.t, {
    position: "absolute",
    left: "50%",
    bottom: "30px",
    font: "8px var(--f-label)",
    color: "#7f88d8",
    letterSpacing: ".1em",
    whiteSpace: "nowrap",
    transform: "translateX(-50%) rotate(90deg)",
  });
  t.textContent = "NX-DRV";
}
function buildTowerParts() {
  const TP = PCB.towerParts;
  TP.top.res.forEach(r => smdR($("#towerTop"), ...r));
  const front = document.querySelector(".dsp-plane");
  TP.front.res.forEach(r => smdR(front, ...r));
  const wall = div("wall-plane", $("#tower"), { transform: "translate3d(-168px, -700px, -168px) rotateY(-90deg)" });
  TP.left.res.forEach(r => smdR(wall, ...r));
  nixieDriver(wall, TP.left.ic); // the driver chip, next to the tubes it drives
  (TP.left.sot || []).forEach(([x, y]) => sot23(wall, x, y));
}

function flick(t) {
  [t.plane, t.halo, t.gl].forEach(el => {
    el.classList.remove("flick");
    void el.offsetWidth;
    el.classList.add("flick");
  });
  setTimeout(() => [t.plane, t.halo, t.gl].forEach(el => el.classList.remove("flick")), 750);
}
function randomFlicker() {
  if (ROLL.active) {
    setTimeout(randomFlicker, 800);
    return;
  }
  flick(NIXIE[Math.floor(Math.random() * NIXIE.length)]);
  if (Math.random() < 0.25) setTimeout(() => flick(NIXIE[Math.floor(Math.random() * NIXIE.length)]), 220);
  setTimeout(randomFlicker, 1600 + Math.random() * 3800);
}
/* now and then a tube runs through its other cathodes before settling back on its letter */
function scramble() {
  if (ROLL.active) {
    setTimeout(scramble, 1500);
    return;
  }
  const t = NIXIE[Math.floor(Math.random() * NIXIE.length)],
    pool = "0123456789ACEHLMOPW";
  let n = 0;
  const step = () => {
    if (n++ < 9) {
      t.lit.textContent = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(step, 55);
    } else t.lit.textContent = t.ch;
  };
  step();
  setTimeout(scramble, 12000 + Math.random() * 14000);
}

function buildTower() {
  const top = $("#towerTop");
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 336 336");
  s.setAttribute("class", "board-svg");
  s.innerHTML = PCB.towerTop;
  top.appendChild(s);
  PROFILE.links.forEach((l, i) => {
    const x = 52 + i * 92,
      y = 276;
    const zb = buttonBase(top, x - 38, y - 38, 76);
    const k = cyl(top, x, y, 58, 22, "soc", zb, { topTag: "a" });
    pushButton([k.r], k, 5, null);
    k.t.href = l.url;
    k.t.target = "_blank";
    k.t.rel = "noopener";
    k.t.setAttribute("aria-label", l.label);
    k.t.innerHTML = ICONS[l.id];
  });
  document
    .querySelector(".tower .f-left")
    .insertAdjacentHTML(
      "afterbegin",
      `<svg class="face-svg" style="height:1400px" viewBox="0 0 336 1400">${PCB.towerLeft}</svg>`,
    );
  document
    .querySelector(".tower .f-front")
    .insertAdjacentHTML(
      "afterbegin",
      `<svg class="face-svg" style="height:1400px" viewBox="0 0 336 1400">${PCB.towerFront}</svg>`,
    );
  $("#mSocials").innerHTML = PROFILE.links
    .map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
    .join("");
}

/* ---------------- 14-segment display ---------------- */
const GLYPH = {
  A: "a b c e f g1 g2",
  B: "a b c d g2 i l",
  D: "a b c d i l",
  G: "a c d e f g2",
  H: "b c e f g1 g2",
  K: "e f g1 j m",
  M: "b c e f h j",
  N: "b c e f h m",
  U: "b c d e f",
  V: "e f k j",
  W: "b c e f k m",
  X: "h j k m",
  C: "a d e f",
  E: "a d e f g1 g2",
  F: "a e f g1",
  I: "a d i l",
  J: "b c d e",
  L: "d e f",
  O: "a b c d e f",
  P: "a b e f g1 g2",
  R: "a b e f g1 g2 m",
  S: "a c d f g1 g2",
  T: "a i l",
  Y: "h j l",
  Z: "a d j k",
  " ": "",
};
/* The display is a real box standing off the tower's front face (as in the original drawing):
   purple lit end, navy bezel, and chunky bevelled segments — each one a light and a dark facet. */
const NDIG = 8,
  digits = [];
function bevelSeg(x1, y1, x2, y2, t) {
  const L = Math.hypot(x2 - x1, y2 - y1),
    ux = (x2 - x1) / L,
    uy = (y2 - y1) / L,
    nx = -uy,
    ny = ux,
    h = t / 2;
  const P = (x, y) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const s1 = P(x1 + ux * h + nx * h, y1 + uy * h + ny * h),
    e1 = P(x2 - ux * h + nx * h, y2 - uy * h + ny * h);
  const s2 = P(x1 + ux * h - nx * h, y1 + uy * h - ny * h),
    e2 = P(x2 - ux * h - nx * h, y2 - uy * h - ny * h);
  const A = `${P(x1, y1)} ${s1} ${e1} ${P(x2, y2)}`,
    B = `${P(x1, y1)} ${P(x2, y2)} ${e2} ${s2}`;
  const aLight = nx + ny < 0; // light comes from the top-left
  return `<polygon class="${aLight ? "l" : "d"}" points="${A}"/><polygon class="${aLight ? "d" : "l"}" points="${B}"/>`;
}
const SEG14 = {
  a: [4, 3, 28, 3, 4.4],
  d: [4, 59, 28, 59, 4.4],
  g1: [4, 31, 15.3, 31, 4.4],
  g2: [16.7, 31, 28, 31, 4.4],
  f: [2.5, 4.5, 2.5, 29.5, 4.4],
  e: [2.5, 32.5, 2.5, 57.5, 4.4],
  b: [29.5, 4.5, 29.5, 29.5, 4.4],
  c: [29.5, 32.5, 29.5, 57.5, 4.4],
  i: [16, 8, 16, 27.5, 3.8],
  l: [16, 34.5, 16, 54, 3.8],
  h: [7.5, 8.5, 13.2, 26.5, 3.5],
  j: [24.5, 8.5, 18.8, 26.5, 3.5],
  k: [13.2, 35.5, 7.5, 53.5, 3.5],
  m: [18.8, 35.5, 24.5, 53.5, 3.5],
};
function buildDisplay() {
  const plane = div("dsp-plane", $("#tower"), { transform: "translate3d(-168px, -700px, 168px)" });
  // pins: the top row runs up over the edge to the buttons, the bottom row feeds the driver chip
  [70, 84, 98, 112, 224, 238, 252, 266].forEach(x => box(plane, x - 2, 76, 4, 8, 3, "dsp-leg"));
  [98, 126, 154, 182, 210, 238].forEach(x => box(plane, x - 2, 156, 4, 8, 3, "dsp-leg"));
  const b = box(plane, 40, 84, 256, 72, 6, "dsp");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 256 72");
  svg.setAttribute("class", "dsp-svg");
  svg.setAttribute("aria-hidden", "true");
  let html = `<rect x="6" y="6" width="244" height="60" rx="2.5" fill="#0a0e3e" stroke="#151a5c" stroke-width="1.5"/>`;
  const pitch = 29,
    sc = 0.7,
    x0 = (256 - (NDIG * pitch - 7)) / 2; // 8 small digits
  for (let d = 0; d < NDIG; d++) {
    html += `<g transform="translate(${x0 + d * pitch + 2} ${36 - 31 * sc}) scale(${sc}) skewX(-6)">`;
    for (const [k, [a, b1, c, e, t]] of Object.entries(SEG14))
      html += `<g class="sg" data-s="${k}">${bevelSeg(a, b1, c, e, t)}</g>`;
    html += "</g>";
  }
  svg.innerHTML = html;
  b.t.appendChild(svg);
  svg.querySelectorAll(":scope > g").forEach(g => {
    const m = {};
    g.querySelectorAll(".sg").forEach(l => (m[l.dataset.s] = l));
    digits.push(m);
  });
  const live = div("sr-only", $("#tower").closest(".stage") || document.body);
  live.setAttribute("aria-live", "polite");
  live.id = "dspText";
}

function showRaw(t) {
  // exactly NDIG characters
  digits.forEach((m, i) => {
    const on = new Set((GLYPH[t[i]] || "").split(" "));
    for (const k in m) m[k].classList.toggle("on", on.has(k));
  });
}
function showSeg(text) {
  const pad = Math.max(0, Math.floor((NDIG - text.length) / 2));
  showRaw((" ".repeat(pad) + text).padEnd(NDIG, " ").slice(0, NDIG).toUpperCase());
}
/* idle message scrolling in, one digit at a time */
const MARQUEE = "CLICK ON BUTTONS TO INTERACT";
let mqPos = 0,
  mqHold = false;
function marqueeTick() {
  if (!mqHold && !ROLL.active) {
    const tape = " ".repeat(NDIG) + MARQUEE + "   ";
    const w = (tape + tape).slice(mqPos, mqPos + NDIG);
    showRaw(w);
    mqPos = (mqPos + 1) % tape.length;
  }
  setTimeout(marqueeTick, reduce ? 600 : 120);
}
let segT;
/* on a click the topic code flickers in, holds, then the message resumes */
function flashSeg(code) {
  clearTimeout(segT);
  mqHold = true;
  let n = 0;
  const live = document.getElementById("dspText");
  if (live) live.textContent = code === "CAYZAC" ? MARQUEE : code;
  const f = setInterval(() => {
    showSeg(n % 2 ? code : "");
    if (++n > 5) {
      clearInterval(f);
      showSeg(code);
      segT = setTimeout(() => {
        mqHold = false;
        mqPos = 0;
      }, 2400);
    }
  }, 70);
}
