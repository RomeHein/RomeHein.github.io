/* =====================================================================
   BOARD — the cube's top face: copper traces, the four push-button
   modules, the core chip, LEDs and the LCD screen.
   ===================================================================== */
/* =====================================================================
   GEOMETRY  (board 560×560, pinwheel layout)
   Topic i lives on edge FACES[i]. Resting angle A = 45 − 90·i puts
   that edge on the lit front-left side: always true isometric.
   ===================================================================== */
const FACES = ["left", "front", "right", "back"];
const EDGE_ROT = [90, 0, -90, 180];
/* module placement, measured on the original illustration (frame 224×64, flip = button first) */
const MODS = [
  { c: [68, 150], flip: false },
  { c: [400, 492], flip: true },
  { c: [510, 280], flip: false },
  { c: [300, 68], flip: true },
];
const CHIP_C = [280, 280]; // the core chip sits dead centre
const ICONS = {
  mobile:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
  proj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 3v18M6 6h7M9 11h10M8 16h8"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 6l7 6-7 6M19 6l-7 6 7 6M5 6v12M19 6v12"/><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="18" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><circle cx="19" cy="6" r="2" fill="currentColor"/><circle cx="19" cy="18" r="2" fill="currentColor"/></svg>',
  soft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="17" rx="1.5"/><path d="M2.5 8h19M9.5 12l-3 2.5 3 2.5M14.5 12l3 2.5-3 2.5"/></svg>',
  elec: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12h4l2-5 3 10 3-10 3 10 2-5h5"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21H9z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>',
};

/* ---------------- board ---------------- */
const board = $("#board");
/* The AI face's three link lines (out of its SOT-23s) used to stop on vias; they now run on to the edge it shares
   with the Software face (x 560), through AC-coupling caps, and continue there into Kubernetes (see SWL.link). */
const AI_LINK = []; // Software-face line k → index of the AI-face trace it continues
PCB.faces.front.forEach((n, i) => {
  const e = n.p[n.p.length - 1],
    k = [350, 322, 266].indexOf(e[1]);
  if (n.ve && e[0] === 518 && k >= 0) {
    n.p.push([560, e[1]]);
    n.ve = 0;
    AI_LINK[k] = i;
  }
});
PCB.aiParts.cer.push([528, 266, 542, 266], [528, 322, 542, 322], [528, 350, 542, 350]);
const WAVE = []; // every copper path, oriented from the chip outward
const pathD = p => "M" + p.map(q => q.join(" ")).join("L");
/* traces that start / end on a via stop on its ring (r = 5.5), not at its centre */
function trimVia(p, vs, ve, r = 5.5) {
  if (!vs && !ve) return p;
  const q = p.map(v => v.slice()),
    cut = (a, b) => {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        L = Math.hypot(dx, dy);
      return L <= r ? a : [+(a[0] + (dx * r) / L).toFixed(2), +(a[1] + (dy * r) / L).toFixed(2)];
    };
  if (vs && q.length > 1) q[0] = cut(q[0], q[1]);
  if (ve && q.length > 1) q[q.length - 1] = cut(q[q.length - 1], q[q.length - 2]);
  return q;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function buildTraces() {
  const NS = "http://www.w3.org/2000/svg";
  let pads = "",
    base = "",
    feeds = ["", "", "", ""],
    vias = "",
    pulses = [];
  // chip pads: 9 per side, pink on the west/north, teal on the east/south (as in the original)
  for (let k = 0; k < 7; k++) {
    const c = 238 + 14 * k;
    pads += `<rect class="pad-chip-p" x="213" y="${c - 3.5}" width="15" height="7"/><rect class="pad-chip-t" x="332" y="${c - 3.5}" width="15" height="7"/>`;
    pads += `<rect class="pad-chip-p" x="${c - 3.5}" y="213" width="7" height="15"/><rect class="pad-chip-t" x="${c - 3.5}" y="332" width="7" height="15"/>`;
  }
  PCB.board.forEach(n => {
    (n.sp || []).forEach(([x, y, d]) => {
      pads +=
        d === 0 || d === 4
          ? `<rect class="pad-scr" x="${d === 0 ? x - 3 : x - 7}" y="${y - 3.5}" width="10" height="7"/>`
          : `<rect class="pad-scr" x="${x - 3.5}" y="${d === 2 ? y - 3 : y - 7}" width="7" height="10"/>`;
    });
    const tp = trimVia(n.p, n.vs, n.ve);
    const el = `<path class="tr" d="${pathD(tp)}"/>`;
    if (n.f) feeds[n.t] += el + `<path class="flow" d="${pathD(tp)}"/>`;
    else base += el;
    if (n.vs) vias += `<circle class="via" cx="${n.p[0][0]}" cy="${n.p[0][1]}" r="5.5"/>`;
    if (n.ve) {
      const q = n.p[n.p.length - 1];
      vias += `<circle class="via" cx="${q[0]}" cy="${q[1]}" r="5.5"/>`;
    }
    const o = dist(tp[tp.length - 1], CHIP_C) < dist(tp[0], CHIP_C) ? [...tp].reverse() : tp;
    pulses.push({ d: pathD(o), d0: Math.max(0, dist(o[0], CHIP_C) - 70) });
  });
  const reg = '<path class="tr" d="M490 101V114M504 101V114M518 101V114"/>';
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 560 560");
  s.setAttribute("class", "board-svg");
  s.innerHTML =
    pads +
    reg +
    base +
    feeds.map((g, t) => `<g class="feed" id="feed${t}">${g}</g>`).join("") +
    vias +
    `<g class="pulses">${pulses.map(q => `<path class="pulse" d="${q.d}"/>`).join("")}</g>`;
  board.appendChild(s);
  TOPICS.forEach((t, i) => s.querySelector("#feed" + i).style.setProperty("--c", t.color));
  s.querySelectorAll(".pulse").forEach((el, k) => WAVE.push({ el, d0: pulses[k].d0, face: "top" }));
  // copper on the four sides of the cube: the wave continues over the edge
  const exitPt = {
    front: fx => [fx, 560],
    right: fx => [560, 560 - fx],
    back: fx => [560 - fx, 0],
    left: fx => [0, fx],
  };
  ["front", "right", "back", "left"].forEach(k => {
    const f = document.querySelector(`.cube .side[data-face="${k}"]`);
    let h = "",
      pl = "",
      pp = [];
    PCB.faces[k].forEach(n => {
      const tp = trimVia(n.p, n.vs, n.ve);
      h += `<path class="fx-tr" d="${pathD(tp)}"/>`;
      if (n.vs) h += `<circle class="fx-via" cx="${n.p[0][0]}" cy="${n.p[0][1]}" r="5.5"/>`;
      if (n.ve) {
        const q = n.p[n.p.length - 1];
        h += `<circle class="fx-via" cx="${q[0]}" cy="${q[1]}" r="5.5"/>`;
      }
      pp.push(Math.max(0, dist(exitPt[k](n.p[0][0]), CHIP_C) - 70 + n.p[0][1]));
      pl += `<path class="fx-pulse" d="${pathD(tp)}"/>`;
    });
    f.insertAdjacentHTML(
      "afterbegin",
      `<svg class="face-svg" viewBox="0 0 560 588">${h}<g class="fx-pulses">${pl}</g></svg>`,
    );
    f.querySelectorAll(".fx-pulse").forEach((el, j) => WAVE.push({ el, d0: pp[j], face: k }));
  });
  WAVE.forEach(w => {
    w.len = w.el.getTotalLength();
    w.el.style.strokeDasharray = `${SEG} ${w.len + SEG}`;
    w.el.style.strokeDashoffset = SEG;
  });
}
const SEG = 64;
/* the core chip fires: a pulse runs along every track in the module's colour */
function wave(color, faces = null) {
  document.documentElement.style.setProperty("--wave", color);
  const v = reduce ? 1e6 : 0.62; // px per ms
  WAVE.forEach(w => {
    if (faces && !faces.includes(w.face)) return; // only the faces that matter for this move
    w.el.getAnimations().forEach(a => a.cancel());
    w.el.style.stroke = color;
    if (reduce) return;
    w.el.animate([{ strokeDashoffset: SEG }, { strokeDashoffset: -w.len }], {
      duration: (w.len + SEG) / v,
      delay: w.d0 / v,
      easing: "linear",
    });
  });
}

/* each topic owns one side of the cube: this is where its own content will live */
function buildFaceContent() {
  TOPICS.forEach((t, i) => {
    const f = document.querySelector(`.cube .side[data-face="${FACES[i]}"]`);
    f.style.setProperty("--c", t.color);
    const w = div("fwrap", f);
    w.dataset.topic = i;
    const c = div("fcontent", w);
    c.innerHTML = `<div class="fc-part">${t.part}</div><div class="fc-title">${t.name}</div><p class="fc-tag">${t.tagline}</p>
      <div class="fc-slot" data-topic="${t.id}" data-label="${t.code} · CONTENT"></div>`;
  });
}
/* shrink text until it fits its box; wrap to two lines as a last resort */
function fitText(el, max, min = 7, widthOnly = false) {
  let s = max;
  el.style.whiteSpace = "nowrap";
  el.style.fontSize = s + "px";
  // tall display fonts (Michroma) overflow their own line box vertically, so single lines are fitted on width only
  const over = () => el.scrollWidth > el.clientWidth + 0.5 || (!widthOnly && el.scrollHeight > el.clientHeight + 0.5);
  while (over() && s > min) el.style.fontSize = (s -= 0.5) + "px";
  if (over()) {
    el.style.whiteSpace = "normal";
    s = max;
    el.style.fontSize = s + "px";
    while (over() && s > min) el.style.fontSize = (s -= 0.5) + "px";
  }
}
/* Chip lettering, sized by measurement (not by overflow tests, which tall fonts like Michroma break):
   the name and ENGINEER each span the full inner width; V2X takes what height is left. */
function fitChip(box) {
  const W = 88,
    H = box.clientHeight - 6,
    gap = 4;
  const natural = el => {
    // text width at 100px, measured on an auto-width inline box
    const st = el.style,
      prev = [st.display, st.width, st.fontSize];
    st.display = "inline-block";
    st.width = "auto";
    st.fontSize = "100px";
    const w = el.getBoundingClientRect ? el.offsetWidth : 0;
    [st.display, st.width, st.fontSize] = prev;
    return w || 1;
  };
  const [name, title, rev] = box.children;
  let sN = (W / natural(name)) * 100,
    sT = (W / natural(title)) * 100,
    sR = Math.min(sT * 0.9, (W / natural(rev)) * 100 * 0.45);
  const lh = 1.12,
    used = () => (sN + sT + sR) * lh + gap * 2;
  if (used() > H) sR = Math.max(6, (H - gap * 2) / lh - sN - sT); // V2X gives way first
  if (used() > H) {
    const f = H / used();
    sN *= f;
    sT *= f;
    sR *= f;
  } // then everything, together
  [
    [name, sN],
    [title, sT],
    [rev, sR],
  ].forEach(([el, sz]) => {
    el.style.fontSize = Math.floor(sz * 4) / 4 + "px";
    el.style.whiteSpace = "nowrap";
  });
}
function fitAll() {
  document.querySelectorAll(".lcd-win").forEach(el => fitText(el, 14, 8));
  document.querySelectorAll(".chip-txt").forEach(fitChip);
  document.querySelectorAll(".fc-title").forEach(el => fitText(el, 26, 14));
}
/* press a knob: its cap comes down `depth` px and springs back */
/* knob cap position: 0 = up, depth = pressed (the foot stays on the plate) */
function knobSet(k, dd) {
  if (!k || !k.h) return;
  const hh = k.h - dd;
  k.body.style.height = px(hh);
  k.body.style.top = px(k.d / 2 - hh);
  if (k.t) k.t.style.transform = `translateZ(${hh}px)`;
}
/* quick press, for keyboard / panel activation */
function pressKnob(k, depth = 5, hold = 150) {
  if (!k || !k.h) return;
  knobSet(k, depth);
  clearTimeout(k._pt);
  k._pt = setTimeout(() => knobSet(k, 0), hold);
}
/* real push-button behaviour: down while held, up when the pointer slides off, action only on release over the button */
function pushButton(els, k, depth, onRelease) {
  let down = false;
  const over = e => {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    return !!t && els.some(el => el.contains(t));
  };
  els.forEach(el => {
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      down = true;
      el.setPointerCapture(e.pointerId);
      knobSet(k, depth);
      e.stopPropagation();
    });
    el.addEventListener("pointermove", e => {
      if (down) knobSet(k, over(e) ? depth : 0);
    });
    el.addEventListener("pointerup", e => {
      if (!down) return;
      down = false;
      knobSet(k, 0);
      if (onRelease && over(e)) onRelease(e);
    });
    el.addEventListener("pointercancel", () => {
      down = false;
      knobSet(k, 0);
    });
    el.addEventListener("click", e => e.stopPropagation());
  });
}
const modules = [];
function buildModules() {
  TOPICS.forEach((t, i) => {
    const {
        c: [cx, cy],
        flip,
      } = MODS[i],
      rot = EDGE_ROT[i];
    const m = div("module", board, { left: px(cx - 112), top: px(cy - 32), transform: `rotate(${rot}deg)` });
    m.style.setProperty("--c", t.color);
    m.style.setProperty("--R", rot + "deg");
    const lx = flip ? 74 : 0,
      bx = flip ? 0 : 160;
    [lx + 38, lx + 70].forEach(x => div("pad", m, { left: px(x), top: "70px", width: "22px", height: "7px" }));
    const lcd = box(m, lx, 9, 150, 46, 10, "lcd");
    div("lcd-win", lcd.t).textContent = t.label;
    div("lcd-led", lcd.t);
    const zb = buttonBase(m, bx, 0, 64);
    const k = cyl(m, bx + 32, 32, 50, 20, "knob", zb);
    m._knob = k;
    m.style.setProperty("--hd", i * 0.7 + "s");
    k.t.innerHTML = `<span style="display:grid;transform:rotate(${90}deg)">${ICONS[t.icon]}</span>`;
    pushButton([m], k, 6, () => select(i, false));
    modules.push(m);
  });
}

let displayEl,
  dispTitle,
  dispLines,
  dispCode,
  dispRot,
  sleds = [];
function buildScreen() {
  // rectangular display where the grey panel was in the original, three status LEDs on its front side
  const s = box(board, 44, 344, 140, 196, 16, "scr");
  displayEl = div("display", s.t);
  dispRot = div("disp-rot", displayEl);
  const inner = div("disp-inner", dispRot);
  inner.innerHTML = `<div class="disp-head"><span id="dispCode">RC-BOARD</span><span>V2X</span></div><div class="disp-title" id="dispTitle"></div><div class="disp-lines" id="dispLines"></div>`;
  div("scan", displayEl);
  dispTitle = inner.querySelector("#dispTitle");
  dispLines = inner.querySelector("#dispLines");
  dispCode = inner.querySelector("#dispCode");
  const front = s.r.querySelector(".bx-front");
  sleds = [8, 17, 26].map(x => div("sled", front, { left: px(x) }));
}
function blinkScreenLeds(color) {
  sleds.forEach((l, k) => {
    l.style.setProperty("--sc", color);
    setTimeout(() => l.classList.add("on"), 120 * k);
    setTimeout(() => l.classList.remove("on"), 700 + 120 * k);
  });
  setTimeout(() => {
    sleds[0].style.setProperty("--sc", "#fff");
    sleds[0].classList.add("on");
  }, 1200);
}

const leds = {};
function buildParts() {
  // the core chip, where the original read "SOFTWARE ENGINEER V1X"
  const chip = chamferBox(board, 224, 224, 112, 112, 14, 12, "chip");
  CHIPBOX = chip;
  const ci = div("chip-in", chip.t);
  ci.innerHTML = `<div class="chip-txt"><span>ROMAIN CAYZAC</span><b>ENGINEER</b><i>V2X</i></div>`;
  chip.r.title = "Overview";
  chip.r.addEventListener("click", () => select(-1));
  chipEl = chip.r;

  capacitor(board, 150, 110);
  resistor(board, 392, 140, 446, 140);
  resistor(board, 392, 168, 446, 168);
  resistor(board, 224, 460, 224, 514);
  resistor(board, 252, 460, 252, 514); // in front of the LEDs
  smd(board, 416, 380, 46, 26, [
    ["N", 430, "pink"],
    ["N", 444, "pink"],
    ["S", 434, "teal"],
    ["S", 448, "teal"],
  ]);
  regulator(board, 364, 48);
  [
    ["blue", 224, 400, "#4fb8f0"],
    ["pink", 252, 400, "#e064c8"],
  ].forEach(([k, x, y, c]) => {
    const g = div("glow", board, { left: px(x - 50), top: px(y - 50), width: "100px", height: "100px" });
    g.style.setProperty("--lc", c);
    leds[k] = { el: led(board, x, y, c), g };
  });
}
let chipEl;
let CHIPBOX = null;
function chipFlash(color) {
  chipEl.style.setProperty("--flash", color);
  chipEl.classList.remove("flash");
  void chipEl.offsetWidth;
  chipEl.classList.add("flash");
}
const setLed = (k, on) => {
  leds[k].el.classList.toggle("on", on);
  leds[k].g.classList.toggle("on", on);
};

/* ---------------- screen typing ---------------- */
let token = 0;
async function typeScreen(title, code, lines) {
  const my = ++token;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  displayEl.classList.remove("glitch");
  void displayEl.offsetWidth;
  displayEl.classList.add("glitch");
  dispTitle.textContent = title;
  dispCode.textContent = code;
  dispLines.innerHTML = "";
  await wait(500);
  for (const line of lines) {
    if (my !== token) return;
    const row = div("", dispLines),
      cur = document.createElement("span");
    cur.className = "cursor";
    for (let c = 0; c <= line.length; c++) {
      if (my !== token) return;
      row.textContent = line.slice(0, c);
      row.appendChild(cur);
      setLed("blue", c % 3 !== 0);
      await wait(20);
    }
    cur.remove();
    await wait(80);
  }
  if (my !== token) return;
  const cur = document.createElement("span");
  cur.className = "cursor";
  dispLines.lastElementChild && dispLines.lastElementChild.appendChild(cur);
  setLed("blue", false);
}
