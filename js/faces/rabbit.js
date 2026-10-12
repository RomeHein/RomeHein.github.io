/* =====================================================================
   WHITE RABBIT — the mobile face's hidden game. A rabbit icon on the
   phone's home screen opens an old-school endless road, and a console
   rises out of a bay under the Attest button: three mechanical keys
   (SPACE to jump, < and > to steer) and a display. The rabbit, the
   obstacles and the carrots are holograms standing out of the phone's
   screen. Each carrot
   gives the next letter of a number spelled out; once the word is
   complete, the holograms fade out and the word stays on the display.
   ===================================================================== */
const RB_WORD = "SEVEN"; // placeholder: the number this face gives, spelled out
const RBL = { x: 284, y: 464, w: 236, d: 86 }; // the controller bay (face coordinates), under the Attest button
const RB_SCR = { x: 64, y: 104, z: 10.6, w: 164, h: 344 }; // the phone's screen on the face
/* the road, in screen pixels: horizon line, perspective constant (y = hy + k / depth), half width at depth 1,
   the rabbit's depth, how far ahead things appear, and how far the rabbit may run from the centre line */
const RB_ROAD = { hy: 70, k: 274, half: 74, dr: 1.24, far: 13, reach: 0.78 };
const RB_HS = 1.5; // hologram size, relative to the road
const RB_COL = {
  rabbit: [226, 244, 255],
  ear: [255, 150, 214],
  obst: [255, 79, 184],
  carrot: [255, 132, 30],
  leaf: [96, 236, 110],
};
const RB = {
  state: "off",
  active: false,
  s: 0.5,
  p: 0,
  z: 0,
  vz: 0,
  got: 0,
  objs: [],
  travel: 0,
  nextAt: 0,
  v: 0,
  curve: 0,
  curveT: 0,
  phase: 0,
  mat: 0,
  fade: 1,
  vis: 0,
  hit: 0,
  inv: 0,
  keys: { l: 0, r: 0 },
  solved: false,
  raf: 0,
  t: 0,
  runT: 0,
  rowN: 0,
  since: 0,
  flash: null,
  cOpen: false,
  lcd: [],
  cells: null,
};
const rbOff = d => RB.curve * 0.03 * (d - 1) * (d - 1); // the road's centre line drifts sideways with depth (curves)
const rbSX = (x, d) => RB_SCR.w / 2 + ((x + rbOff(d)) * RB_ROAD.half) / d;
const rbSY = d => RB_ROAD.hy + RB_ROAD.k / d;

/* the controller: a bay in the board. Its roller shutter rolls back into the board and a console rises out of the
   cube: three mechanical keys (SPACE to jump, < and > to steer, each with its action written above) and the display */
function rbBuildPad(g) {
  const { x, y, w, d } = RBL;
  // a low housing around the bay (as tall as the LCDs next to it): the console waits inside, under a roller shutter
  const FH = 9,
    FW = 6,
    ox = x - 1 - FW,
    oy = y - 1 - FW,
    ow = w + 2 + 2 * FW,
    od = d + 2 + 2 * FW;
  box(g, ox, oy, ow, FW, FH, "rb-frame");
  box(g, ox, oy + od - FW, ow, FW, FH, "rb-frame");
  box(g, ox, oy + FW, FW, od - 2 * FW, FH, "rb-frame");
  box(g, ox + ow - FW, oy + FW, FW, od - 2 * FW, FH, "rb-frame");
  div("rb-floor", g, { left: px(x - 1), top: px(y - 1), width: px(w + 2), height: px(d + 2) });
  const doors = div("rb-pit", g, {
    left: px(x - 1),
    top: px(y - 1),
    width: px(w + 2),
    height: px(d + 2),
    transform: `translateZ(${FH + 0.3}px)`,
  });
  const con = div("rb-con gone", g, { left: px(x), top: px(y), width: px(w), height: px(d) });
  const cs = box(con, 0, 0, w, d, 6, "rb-case");
  const keys = {};
  [
    ["sp", "SPACE", "JUMP", 12, 112],
    ["l", "<", "LEFT", 134, 40],
    ["r", ">", "RIGHT", 184, 40],
  ].forEach(([id, cap, act, kx, kw]) => {
    box(con, kx, 22, kw, 27, 2, "rb-sw", 6);
    const c = box(con, kx + 2, 23.5, kw - 4, 24, 5.5, "rb-cap" + (id === "sp" ? " sp" : ""), 8);
    c.t.textContent = cap;
    const lb = div("rb-lbl", cs.t, { left: px(kx), top: px(5), width: px(kw) });
    lb.textContent = act;
    keys[id] = c.r;
    c.r.addEventListener("pointerdown", e => {
      if (e.button !== 0 || !RB.active) return;
      e.stopPropagation();
      e.preventDefault();
      c.r.setPointerCapture(e.pointerId);
      rbKeyVis(id, true);
      if (id === "sp") rbAction();
      else RB.keys[id] = 1;
    });
    const up = () => {
      rbKeyVis(id, false);
      if (id !== "sp") RB.keys[id] = 0;
    };
    c.r.addEventListener("pointerup", up);
    c.r.addEventListener("pointercancel", up);
    c.r.style.touchAction = "none";
  });
  box(con, 12, 54, 212, 28, 3, "rb-plate", 6);
  const lcd = box(con, 14, 55.5, 208, 25, 3, "rb-lcd", 9);
  const cells = div("rb-cells", lcd.t);
  RB.cells = cells;
  RB.lcd = [...RB_WORD].map(() => {
    const b = document.createElement("b");
    b.textContent = "_";
    cells.appendChild(b);
    return b;
  });
  const led = div("rb-led", cs.t, { left: px(4), top: px(36) });
  // a roller shutter covers the bay; it rolls back into the board (clipped at the bay's edge)
  doors.innerHTML = `<div class="rb-shutter"></div>`;
  RB.pad = { con, doors, keys, led };
  // markers for the hologram projection: the face's origin and its three axes
  RB.mk = [
    [0, 0, 0],
    [100, 0, 0],
    [0, 100, 0],
    [0, 0, 100],
  ].map(([a, b, c]) => div("rb-mk", g, { transform: `translate3d(${a - 0.5}px,${b - 0.5}px,${c}px)` }));
}
function rbKeyVis(id, down) {
  const k = RB.pad && RB.pad.keys[id];
  if (k) k.classList.toggle("down", down);
}
/* open: the shutter rolls up, then the console rises; close: the console sinks, then the shutter comes down */
function rbConsole(open, instant) {
  const H = RB.pad;
  if (!H || RB.cOpen === open) return;
  RB.cOpen = open;
  clearTimeout(RB.ct1);
  clearTimeout(RB.ct2);
  if (instant || reduce) {
    const els = [H.con, ...H.doors.children];
    els.forEach(e => (e.style.transition = "none"));
    H.con.classList.toggle("gone", !open);
    H.con.classList.toggle("up", open);
    H.doors.classList.toggle("open", open);
    void H.con.offsetWidth;
    els.forEach(e => (e.style.transition = ""));
    return;
  }
  if (open) {
    H.con.classList.remove("gone");
    H.doors.classList.add("open");
    RB.ct1 = setTimeout(() => H.con.classList.add("up"), 620);
  } else {
    H.con.classList.remove("up");
    ["sp", "l", "r"].forEach(k => rbKeyVis(k, false));
    RB.ct1 = setTimeout(() => H.doors.classList.remove("open"), 480);
    RB.ct2 = setTimeout(() => H.con.classList.add("gone"), 1050);
  }
}
function rbCells(word) {
  RB.lcd.forEach((b, i) => {
    const on = i < RB.got || !!word;
    const ch = word ? word[i] : i < RB.got ? RB_WORD[i] : "_";
    if (b.textContent !== ch) b.textContent = ch;
    b.classList.toggle("on", on);
  });
  RB.cells && RB.cells.classList.toggle("win", !!word);
}
function rbCellFx(i, cls) {
  const b = RB.lcd[i];
  if (!b) return;
  b.classList.remove("new", "lost");
  void b.offsetWidth;
  b.classList.add(cls);
}

/* ---------------- the app: open, close, start ---------------- */
function rbLaunch(ic) {
  if (!MOB_UI.on || MOB_UI.open === "rabbit") return;
  mobClose(true);
  const scr = MOB_UI.screen,
    grid = scr.querySelector(".ps-grid"),
    icon = ic.querySelector("i");
  const ox = icon.offsetLeft + ic.offsetLeft + icon.offsetWidth / 2 + grid.offsetLeft,
    oy = icon.offsetTop + ic.offsetTop + icon.offsetHeight / 2 + grid.offsetTop;
  const v = div("ps-appview closed rb-view", scr, { transformOrigin: `${ox}px ${oy}px` });
  v.innerHTML = `<div class="rb-game"><canvas></canvas></div><div class="pa-home" title="Home"></div>`;
  v.querySelector(".pa-home").addEventListener("click", e => {
    e.stopPropagation();
    mobClose();
  });
  const cv = v.querySelector("canvas");
  cv.addEventListener("click", e => {
    e.stopPropagation();
    if (RB.state === "intro" || RB.state === "done") rbAction();
  });
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove("closed")));
  MOB_UI.view = v;
  MOB_UI.open = "rabbit";
  mobScreen("app");
  mobSetOn(-1);
  if (current === 0) renderPanel(0); // the side panel goes back to the list of apps
  rbStart(cv);
}
function rbStart(cv) {
  const s = $("#world").getBoundingClientRect().width / 1440 || 1;
  RB.cdpr = Math.min(3, Math.max(1.5, (devicePixelRatio || 1) * s * 1.5));
  cv.width = Math.round(RB_SCR.w * RB.cdpr);
  cv.height = Math.round(RB_SCR.h * RB.cdpr);
  RB.cv = cv;
  RB.ctx = cv.getContext("2d");
  RB.active = true;
  RB.state = "intro";
  RB.t = 0;
  RB.t0 = performance.now();
  RB.mat = 0;
  RB.fade = 1;
  RB.objs = [];
  RB.v = 0;
  RB.travel = 0;
  RB.z = 0;
  RB.vz = 0;
  RB.s = 0.5;
  RB.p = 0;
  RB.curve = 0;
  RB.curveT = 0;
  RB.hit = 0;
  RB.inv = 0;
  RB.flash = null;
  RB.keys.l = RB.keys.r = 0;
  if (!RB.solved) {
    RB.got = 0;
    rbCells();
  }
  rbHoloSetup();
  clearTimeout(RB.ht);
  RB.ht = setTimeout(
    () => {
      if (RB.active) rbConsole(true);
    },
    reduce ? 0 : 300,
  );
  RB.pad && RB.pad.led.classList.add("on");
  if (!RB.raf) {
    RB.last = 0;
    RB.raf = requestAnimationFrame(rbLoop);
  }
}
/* the app closes: the holograms collapse, the console goes back into the cube (at once if the face is leaving) */
function rbStop(hard) {
  RB.active = false;
  RB.state = "off";
  RB.keys.l = RB.keys.r = 0;
  clearTimeout(RB.ht);
  rbConsole(false, hard);
  RB.pad && RB.pad.led.classList.remove("on");
  if (hard) {
    RB.vis = 0;
    if (RB.hctx) RB.hctx.clearRect(0, 0, RB.holo.width, RB.holo.height);
  }
}
function rbRun() {
  RB.state = "run";
  RB.runT = 0;
  RB.objs = [];
  RB.rowN = 0;
  RB.since = 0;
  RB.nextAt = RB.travel + 0.6;
  RB.got = 0;
  RB.fade = 1;
  RB.mat = Math.max(RB.mat, 0.6);
  RB.hit = 0;
  RB.inv = 0;
  rbCells();
  RB.flash = { txt: "GO", t: 0.9, col: "#45d6c4" };
}
function rbAction() {
  if (!RB.active) return;
  if (RB.state === "intro" || RB.state === "done") {
    if (performance.now() - RB.t0 > 450) rbRun();
    return;
  }
  if (RB.state === "run" && RB.z <= 0 && RB.vz <= 0) {
    RB.vz = 168;
  }
}
addEventListener(
  "keydown",
  e => {
    if (!RB.active) return;
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") {
      RB.keys.l = 1;
      rbKeyVis("l", true);
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      RB.keys.r = 1;
      rbKeyVis("r", true);
    } else if (k === " " || k === "ArrowUp" || k === "w" || k === "W" || k === "Enter") {
      rbKeyVis("sp", true);
      if (!e.repeat) rbAction();
    } else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);
addEventListener(
  "keyup",
  e => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") {
      RB.keys.l = 0;
      rbKeyVis("l", false);
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      RB.keys.r = 0;
      rbKeyVis("r", false);
    } else if (k === " " || k === "ArrowUp" || k === "w" || k === "W" || k === "Enter") rbKeyVis("sp", false);
  },
  true,
);
addEventListener("blur", () => {
  RB.keys.l = RB.keys.r = 0;
  ["sp", "l", "r"].forEach(k => rbKeyVis(k, false));
});
addEventListener("resize", () => {
  if (RB.active) rbHoloSetup();
});

/* ---------------- game ---------------- */
function rbSpawnRow() {
  const R = RB_ROAD,
    lane = () => (Math.random() * 2 - 1) * 0.68,
    d = R.far;
  const O = (kind, x, extra = {}) =>
    RB.objs.push(
      Object.assign(
        {
          kind,
          x,
          d,
          hw: { cone: 0.13, crate: 0.15, hurdle: 0.37, carrot: 0.15 }[kind],
          h: { cone: 12, crate: 11, hurdle: 10, carrot: 0 }[kind],
          seed: Math.random() * 6,
        },
        extra,
      ),
    );
  RB.rowN++;
  const carrotRow = RB.rowN > 1 && (RB.since >= 2 || Math.random() < 0.42);
  if (RB.rowN === 1) O("cone", lane());
  else if (carrotRow) {
    const r = Math.random(),
      x = lane();
    if (r < 0.45) O("carrot", x, { z: 7 });
    else if (r < 0.75) {
      O(Math.random() < 0.5 ? "crate" : "cone", x);
      O("carrot", x, { z: 30 });
    } // a carrot over an obstacle: jump for it
    else {
      O("carrot", x, { z: 7 });
      O("cone", Math.max(-0.7, Math.min(0.7, x + (x > 0 ? -0.48 : 0.48))));
    }
    RB.since = 0;
  } else {
    const r = Math.random();
    if (r < 0.33) O("cone", lane());
    else if (r < 0.62) O("crate", lane());
    else if (r < 0.84) O("hurdle", [-0.45, 0, 0.45][(Math.random() * 3) | 0]);
    else {
      O("cone", -0.52);
      O("cone", 0.52);
    }
    RB.since++;
  }
  RB.nextAt = RB.travel + 2.3 + Math.random() * 0.9;
}
function rbUpdate(dt) {
  const R = RB_ROAD;
  RB.t += dt;
  RB.vis += ((RB.active ? 1 : 0) - RB.vis) * Math.min(1, dt * (RB.active ? 3 : 9));
  if (RB.active) RB.mat = Math.min(1, RB.mat + dt / (reduce ? 0.01 : 1.1));
  // steering: keys move the fader, the rabbit follows the fader
  if (RB.keys.l || RB.keys.r) RB.s = Math.max(0, Math.min(1, RB.s + (RB.keys.r - RB.keys.l) * 1.8 * dt));
  const tp = (RB.s * 2 - 1) * R.reach;
  RB.p += (tp - RB.p) * Math.min(1, dt * 12);
  // jump
  if (RB.z > 0 || RB.vz > 0) {
    RB.vz -= 540 * dt;
    RB.z += RB.vz * dt;
    if (RB.z <= 0) {
      RB.z = 0;
      RB.vz = 0;
    }
  }
  // speed, road curves
  const run = RB.state === "run";
  if (run) RB.runT += dt;
  const vt = run
    ? Math.min(4.3, 2.5 + RB.runT * 0.05)
    : RB.state === "intro"
      ? 1
      : RB.state === "win"
        ? 0.25
        : RB.state === "done"
          ? 0.6
          : 0;
  RB.v += (vt - RB.v) * Math.min(1, dt * 1.4);
  RB.travel += RB.v * dt;
  RB.curveT += dt * RB.v * 0.25;
  const ct = run || RB.state === "intro" ? Math.sin(RB.curveT * 0.55) * Math.sin(RB.curveT * 0.23 + 1.3) * 1.1 : 0;
  RB.curve += (ct - RB.curve) * Math.min(1, dt * 1.5);
  RB.phase += dt * (5 + RB.v * 2.4);
  RB.hit = Math.max(0, RB.hit - dt);
  RB.inv = Math.max(0, RB.inv - dt);
  if (RB.flash) {
    RB.flash.t -= dt;
    if (RB.flash.t <= 0) RB.flash = null;
  }
  // objects come down the road; things are judged as they pass the rabbit
  for (const o of RB.objs) {
    const d0 = o.d;
    o.d -= RB.v * dt;
    if (o.tk != null) o.tk += dt / 0.55;
    if (o.sm != null) o.sm += dt / 0.6;
    if (run && d0 > R.dr && o.d <= R.dr) {
      const dx = Math.abs(o.x - RB.p);
      if (o.kind === "carrot") {
        if (dx < 0.22 && Math.abs(RB.z + 9 - o.z) < 15) rbTake(o);
      } else if (dx < o.hw + 0.12 && RB.z < o.h - 1.5 && RB.inv <= 0) rbHit(o);
    }
  }
  RB.objs = RB.objs.filter(o => o.d > 0.72 && !(o.tk >= 1) && !(o.sm >= 1));
  if (run && RB.travel >= RB.nextAt) rbSpawnRow();
  if (RB.state === "win") {
    RB.winT += dt;
    RB.fade = Math.max(0, 1 - RB.winT / 1.5);
    if (RB.winT > 1.9) RB.state = "done";
  }
}
function rbTake(o) {
  o.tk = 0;
  if (RB.got >= RB_WORD.length) return;
  RB.got++;
  rbCells();
  rbCellFx(RB.got - 1, "new");
  RB.flash = { txt: RB_WORD[RB.got - 1], t: 0.8, col: "#ffb547", big: 1 };
  if (RB.got >= RB_WORD.length) rbWin();
}
function rbHit(o) {
  o.sm = 0;
  RB.hit = 0.55;
  RB.inv = 1.3;
  if (RB.got > 0) {
    RB.got--;
    rbCellFx(RB.got, "lost");
    setTimeout(() => rbCells(), 420);
    RB.flash = { txt: "OUCH  −1", t: 0.8, col: "#ff4fb8" };
  } else RB.flash = { txt: "OUCH", t: 0.6, col: "#ff4fb8" };
}
function rbWin() {
  RB.state = "win";
  RB.winT = 0;
  RB.solved = true;
  secretFound("mobile"); // one more on the board's screen
  setTimeout(() => {
    if (RB.solved) rbCells(RB_WORD);
  }, 500);
}
function rbLoop(now) {
  const dt = Math.min(0.05, (now - (RB.last || now)) / 1000);
  RB.last = now;
  rbUpdate(dt);
  if (RB.active && RB.cv && RB.cv.isConnected) rbScreen();
  rbHolo();
  if (!RB.active && RB.vis < 0.01) {
    RB.vis = 0;
    RB.raf = 0;
    if (RB.hctx) RB.hctx.clearRect(0, 0, RB.holo.width, RB.holo.height);
    return;
  }
  RB.raf = requestAnimationFrame(rbLoop);
}

/* ---------------- the phone's screen: sky, sun, the road ---------------- */
const RB_STARS = Array.from({ length: 34 }, (_, i) => [(i * 73.13) % 164, 14 + ((i * 37.7) % 46), 0.4 + (i % 3) * 0.3]);
function rbScreen() {
  const c = RB.ctx,
    W = RB_SCR.w,
    H = RB_SCR.h,
    R = RB_ROAD,
    t = RB.t,
    hy = R.hy;
  c.setTransform(RB.cdpr, 0, 0, RB.cdpr, 0, 0);
  // sky
  let g = c.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, "#05061f");
  g.addColorStop(0.6, "#1d0c4d");
  g.addColorStop(1, "#4a1677");
  c.fillStyle = g;
  c.fillRect(0, 0, W, hy + 1);
  RB_STARS.forEach(([x, y, r]) => {
    c.fillStyle = `rgba(220,230,255,${0.35 + 0.3 * Math.sin(t * 2 + x)})`;
    c.fillRect(x, y, r, r);
  });
  // sun, drifting against the curves
  const sx = W / 2 - RB.curve * 26,
    sy = hy - 2;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, hy);
  c.clip();
  g = c.createLinearGradient(0, sy - 30, 0, sy);
  g.addColorStop(0, "#ffd166");
  g.addColorStop(1, "#ff4fb8");
  c.fillStyle = g;
  c.beginPath();
  c.arc(sx, sy, 26, Math.PI, 0);
  c.fill();
  c.fillStyle = "#1d0c4d";
  for (let i = 0; i < 5; i++) {
    const yy = sy - 3 - i * 5.2,
      hh = 2.2 - i * 0.35;
    c.globalAlpha = 0.85;
    c.fillRect(sx - 28, yy, 56, hh);
  }
  c.globalAlpha = 1;
  // mountains
  c.fillStyle = "#120a36";
  c.beginPath();
  c.moveTo(0, hy + 1);
  for (let x = 0; x <= W; x += 6) {
    const u = x + RB.curve * 40;
    c.lineTo(x, hy - 4 - 7 * Math.abs(Math.sin(u * 0.045)) - 4 * Math.abs(Math.sin(u * 0.11 + 1)));
  }
  c.lineTo(W, hy + 1);
  c.fill();
  c.strokeStyle = "rgba(127,243,255,.35)";
  c.lineWidth = 0.6;
  c.stroke();
  c.restore();
  // the road, one scanline at a time (bands scroll towards the viewer)
  for (let y = hy + 1; y < H; y++) {
    const d = R.k / (y + 0.5 - hy),
      band = Math.floor((d + RB.travel) * 1.4) & 1;
    const cx = rbSX(0, d),
      hw = R.half / d,
      cw = hw * 0.13;
    c.fillStyle = band ? "#150a3a" : "#1c0f4b";
    c.fillRect(0, y, W, 1);
    c.fillStyle = band ? "#ff4fb8" : "#efe6ff";
    c.fillRect(cx - hw - cw, y, 2 * (hw + cw), 1);
    c.fillStyle = band ? "#28225e" : "#2d2768";
    c.fillRect(cx - hw, y, 2 * hw, 1);
    if (band) {
      c.fillStyle = "rgba(235,240,255,.75)";
      c.fillRect(cx - hw * 0.025, y, hw * 0.05, 1);
    }
  }
  // haze on the horizon (hides the aliasing of the far bands)
  g = c.createLinearGradient(0, hy - 2, 0, hy + 26);
  g.addColorStop(0, "rgba(74,22,119,1)");
  g.addColorStop(1, "rgba(74,22,119,0)");
  c.fillStyle = g;
  c.fillRect(0, hy - 2, W, 28);
  // the holograms' shadows on the road
  const sh = (x, d, r, a) => {
    const s = 1 / d;
    c.fillStyle = `rgba(4,2,20,${a})`;
    c.beginPath();
    c.ellipse(rbSX(x, d), rbSY(d), r * R.half * s, r * R.half * s * 0.32, 0, 0, Math.PI * 2);
    c.fill();
  };
  const hv = RB.vis * RB.mat * RB.fade;
  if (hv > 0.02) {
    RB.objs.forEach(o => {
      if (o.kind !== "carrot" && o.sm == null) sh(o.x, o.d, o.hw * 1.15, 0.55 * hv);
    });
    sh(RB.p, R.dr, 0.15 * (1 - Math.min(0.6, RB.z / 40)), 0.6 * hv);
  }
  // text
  const F = "Chakra Petch, sans-serif",
    FL = "Michroma, Chakra Petch, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const panel = (y0, h) => {
    c.fillStyle = "rgba(5,6,26,.72)";
    c.fillRect(10, y0, W - 20, h);
    c.strokeStyle = "rgba(127,243,255,.35)";
    c.lineWidth = 0.7;
    c.strokeRect(10.5, y0 + 0.5, W - 21, h - 1);
  };
  if (RB.state === "intro") {
    panel(122, 46);
    c.fillStyle = "#fff";
    c.font = `9.5px ${FL}`;
    c.shadowColor = "#ffb547";
    c.shadowBlur = 6;
    c.fillText("GET THE CARROTS", W / 2, 139);
    c.shadowBlur = 0;
    c.fillStyle = `rgba(69,214,196,${0.55 + 0.45 * Math.sin(t * 5)})`;
    c.font = `600 7.2px ${F}`;
    c.fillText("PRESS SPACE TO START", W / 2, 155);
  } else if (RB.state === "run" || RB.state === "win") {
    c.textAlign = "left";
    c.font = `600 6.8px ${F}`;
    c.fillStyle = "rgba(230,236,255,.85)";
    c.fillText("CARROTS", 14, 34);
    c.fillStyle = "#ffb547";
    c.font = `9px ${FL}`;
    c.fillText(`${RB.got}/${RB_WORD.length}`, 14, 46);
    c.textAlign = "center";
  }
  if (RB.flash && RB.state !== "intro") {
    const f = RB.flash,
      a = Math.min(1, f.t * 3),
      y = 200 - (1 - f.t) * 14;
    c.globalAlpha = a;
    c.fillStyle = f.col;
    c.shadowColor = f.col;
    c.shadowBlur = 8;
    c.font = f.big ? `20px ${FL}` : `600 10px ${F}`;
    c.fillText(f.txt, W / 2, y);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }
  if (RB.state === "done" || (RB.state === "win" && RB.winT > 1.2)) {
    const a = RB.state === "done" ? 1 : Math.min(1, (RB.winT - 1.2) / 0.5);
    c.globalAlpha = a;
    panel(124, 44);
    c.fillStyle = "#fff";
    c.font = `17px ${FL}`;
    c.shadowColor = "#45d6c4";
    c.shadowBlur = 8;
    c.fillText(RB_WORD, W / 2, 147);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }
}

/* ---------------- holograms: little 3D wireframes standing out of the screen ---------------- */
/* the face → world projection is affine (orthographic camera): read it from four markers on the face */
function rbAffine() {
  const wr = $("#world").getBoundingClientRect(),
    s = wr.width / 1440 || 1;
  const pt = el => {
    const r = el.getBoundingClientRect();
    return [((r.left + r.right) / 2 - wr.left) / s, ((r.top + r.bottom) / 2 - wr.top) / s];
  };
  const [o, X, Y, Z] = RB.mk.map(pt),
    dv = p => [(p[0] - o[0]) / 100, (p[1] - o[1]) / 100];
  return { o, ax: dv(X), ay: dv(Y), az: dv(Z), s };
}
function rbHoloSetup() {
  if (!RB.holo) {
    RB.holo = document.createElement("canvas");
    RB.holo.className = "rb-holo";
    $("#world").appendChild(RB.holo);
    RB.hctx = RB.holo.getContext("2d");
  }
  const A = rbAffine();
  RB.aff = A;
  const P = (x, y, z) => [
    A.o[0] + x * A.ax[0] + y * A.ay[0] + z * A.az[0],
    A.o[1] + x * A.ax[1] + y * A.ay[1] + z * A.az[1],
  ];
  const S = RB_SCR,
    pts = [];
  [
    [S.x, S.y],
    [S.x + S.w, S.y],
    [S.x, S.y + S.h],
    [S.x + S.w, S.y + S.h],
  ].forEach(([x, y]) => {
    pts.push(P(x, y, S.z));
    pts.push(P(x, y, S.z + 120));
  });
  const m = 24,
    x0 = Math.floor(Math.min(...pts.map(p => p[0])) - m),
    y0 = Math.floor(Math.min(...pts.map(p => p[1])) - m);
  const x1 = Math.ceil(Math.max(...pts.map(p => p[0])) + m),
    y1 = Math.ceil(Math.max(...pts.map(p => p[1])) + m);
  RB.hdpr = Math.min(3, Math.max(1.5, (devicePixelRatio || 1) * A.s * 1.25));
  RB.hx = x0;
  RB.hy = y0;
  Object.assign(RB.holo.style, { left: x0 + "px", top: y0 + "px", width: x1 - x0 + "px", height: y1 - y0 + "px" });
  RB.holo.width = Math.round((x1 - x0) * RB.hdpr);
  RB.holo.height = Math.round((y1 - y0) * RB.hdpr);
  const pc = document.createElement("canvas");
  pc.width = 4;
  pc.height = Math.max(3, Math.round(3 * RB.hdpr));
  const px2 = pc.getContext("2d");
  px2.fillStyle = "rgba(0,0,0,.32)";
  px2.fillRect(0, 0, 4, Math.max(1, Math.round(RB.hdpr)));
  RB.scan = RB.hctx.createPattern(pc, "repeat");
}
/* shapes, in the hologram's own frame: x across the road, y down the road (away from the viewer), z up */
function rbRot(p, o) {
  let [x, y, z] = p;
  if (o.roll) {
    const c = Math.cos(o.roll),
      s = Math.sin(o.roll);
    [x, z] = [x * c - z * s, x * s + z * c];
  }
  if (o.pitch) {
    const c = Math.cos(o.pitch),
      s = Math.sin(o.pitch);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (o.yaw) {
    const c = Math.cos(o.yaw),
      s = Math.sin(o.yaw);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return [x, y, z];
}
function rbEll(c, r, o = {}, n = 14) {
  const lines = [],
    P = (a, b, cc) => {
      const q = rbRot([a * r[0], b * r[1], cc * r[2]], o);
      return [q[0] + c[0], q[1] + c[1], q[2] + c[2]];
    };
  [-0.62, 0, 0.62].forEach(ph => {
    const cp = Math.cos(ph),
      sp = Math.sin(ph);
    const l = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      l.push(P(Math.cos(a) * cp, Math.sin(a) * cp, sp));
    }
    lines.push(l);
  });
  [0, Math.PI / 2].forEach(th => {
    const l = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      l.push(P(Math.cos(th) * Math.cos(a), Math.sin(th) * Math.cos(a), Math.sin(a)));
    }
    lines.push(l);
  });
  return lines;
}
function rbCone(c, r, h, o = {}, n = 12) {
  const P = (a, b, cc) => {
    const q = rbRot([a, b, cc], o);
    return [q[0] + c[0], q[1] + c[1], q[2] + c[2]];
  };
  const ring = (rr, z) => {
    const l = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      l.push(P(Math.cos(a) * rr, Math.sin(a) * rr, z));
    }
    return l;
  };
  const apex = P(0, 0, h),
    lines = [ring(r, 0), ring(r * 0.55, h * 0.45)];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    lines.push([P(Math.cos(a) * r, Math.sin(a) * r, 0), apex]);
  }
  return lines;
}
/* a turned shape (carrot): rings at each [z, r] of the profile, and a few lines running along it */
function rbLathe(prof, o = {}, n = 12, mer = 6) {
  const P = (a, r, z) => rbRot([Math.cos(a) * r, Math.sin(a) * r, z], o);
  const lines = prof
    .filter(([, r]) => r > 0)
    .map(([z, r]) => {
      const l = [];
      for (let i = 0; i <= n; i++) l.push(P((i / n) * Math.PI * 2, r, z));
      return l;
    });
  for (let j = 0; j < mer; j++) {
    const a = (j / mer) * Math.PI * 2;
    lines.push(prof.map(([z, r]) => P(a, r, z)));
  }
  return lines;
}
function rbBox(c, sx, sy, sz, o = {}) {
  const P = (a, b, cc) => {
    const q = rbRot([(a * sx) / 2, (b * sy) / 2, cc * sz], o);
    return [q[0] + c[0], q[1] + c[1], q[2] + c[2]];
  };
  const q = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];
  const lines = [q.map(([a, b]) => P(a, b, 0)), q.map(([a, b]) => P(a, b, 1))];
  q.slice(0, 4).forEach(([a, b]) => lines.push([P(a, b, 0), P(a, b, 1)]));
  return lines;
}
function rbHull(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [],
    up = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/* draw one part: a soft filled silhouette (its convex hull) and the wireframe on top */
function rbPart(c, M, lines, col, a, fill = 0.13) {
  if (a <= 0.01) return;
  const pts = [],
    pl = lines.map(l =>
      l.map(p => {
        const q = M(p);
        pts.push(q);
        return q;
      }),
    );
  const [r, g, b] = col;
  if (fill > 0) {
    const h = rbHull(pts);
    c.fillStyle = `rgba(${r},${g},${b},${(a * fill).toFixed(3)})`;
    c.beginPath();
    h.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
    c.closePath();
    c.fill();
  }
  c.strokeStyle = `rgba(${r},${g},${b},${Math.min(1, a * 0.85).toFixed(3)})`;
  c.beginPath();
  pl.forEach(l => l.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))));
  c.stroke();
}
/* the white rabbit, running away from the viewer down the road */
function rbRabbitParts(ph, air, idle) {
  const b = air ? 1.5 : idle ? 0.6 * Math.abs(Math.sin(ph * 0.5)) : 2.4 * Math.abs(Math.sin(ph)),
    k = air ? -1.2 : idle ? 0 : Math.sin(ph) * 2.2;
  const ear = air ? -0.55 : idle ? -0.12 + 0.08 * Math.sin(ph * 0.7) : -0.3 - 0.12 * Math.abs(Math.cos(ph));
  const W = RB_COL.rabbit,
    E = RB_COL.ear;
  return [
    [rbEll([0, -1.5, 6.8 + b], [5.6, 7.4, 5.8], { pitch: 0.18 }), W],
    [rbEll([0, 4.6, 9.4 + b], [4.1, 4.2, 4.4]), W],
    [rbEll([0, 7.8, 14.2 + b], [3.6, 4.2, 3.6], { pitch: -0.2 }), W],
    [rbEll([-1.9, 6.6, 21.4 + b], [1.15, 0.75, 5.4], { pitch: ear, roll: -0.16 }, 10), W],
    [rbEll([1.9, 6.6, 21.4 + b], [1.15, 0.75, 5.4], { pitch: ear, roll: 0.16 }, 10), W],
    [
      [
        [
          [-1.9, 6.6, 18 + b],
          [-2.5, 6.6 - 3 * ear, 24.5 + b],
        ],
        [
          [1.9, 6.6, 18 + b],
          [2.5, 6.6 - 3 * ear, 24.5 + b],
        ],
      ],
      E,
    ],
    [rbEll([0, -8.6, 8.2 + b], [2.3, 2.3, 2.3], {}, 10), W],
    [rbEll([-3.3, -3 + k, 1.5], [1.6, 3.8, 1.4], {}, 10), W],
    [rbEll([3.3, -3 + k, 1.5], [1.6, 3.8, 1.4], {}, 10), W],
    [rbEll([-1.9, 7 - k, 1.4 + (air ? 1.5 : 0)], [1.1, 1.9, 1.3], {}, 8), W],
    [rbEll([1.9, 7 - k, 1.4 + (air ? 1.5 : 0)], [1.1, 1.9, 1.3], {}, 8), W],
  ];
}
function rbHolo() {
  const c = RB.hctx;
  if (!c) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, RB.holo.width, RB.holo.height);
  const vis = RB.vis * RB.mat;
  if (vis <= 0.005 || !RB.aff) return;
  const A = RB.aff,
    R = RB_ROAD,
    S = RB_SCR,
    t = RB.t;
  c.setTransform(RB.hdpr, 0, 0, RB.hdpr, -RB.hx * RB.hdpr, -RB.hy * RB.hdpr);
  c.globalCompositeOperation = "lighter";
  c.lineWidth = 0.65;
  c.lineJoin = "round";
  // an object standing on the road at (x, depth): its frame on the face, scaled by the perspective
  const frame = (x, d, lift = 0, sq = 1) => {
    const fx = S.x + rbSX(x, d),
      fy = S.y + rbSY(d),
      sc = (R.dr / d) * RB_HS;
    const o = [
      A.o[0] + fx * A.ax[0] + fy * A.ay[0] + S.z * A.az[0],
      A.o[1] + fx * A.ax[1] + fy * A.ay[1] + S.z * A.az[1],
    ];
    const zz = sc * sq;
    return {
      o,
      sc,
      M: p => [
        o[0] + sc * (p[0] * A.ax[0] - p[1] * A.ay[0]) + zz * (p[2] + lift) * A.az[0],
        o[1] + sc * (p[0] * A.ax[1] - p[1] * A.ay[1]) + zz * (p[2] + lift) * A.az[1],
      ],
    };
  };
  const glow = (F, r, col, a) => {
    // the light pool where the screen projects the hologram
    if (a <= 0.01) return;
    const [cr, cg, cb] = col,
      s = F.sc * r;
    c.save();
    c.transform(A.ax[0] * s, A.ax[1] * s, A.ay[0] * s * 0.9, A.ay[1] * s * 0.9, F.o[0], F.o[1]);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.38 * a).toFixed(3)})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 1, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  const fadeAll = RB.fade,
    sqAll = 0.25 + 0.75 * Math.sqrt(RB.fade),
    mat = RB.mat;
  const items = RB.objs.map(o => ({ d: o.d, o }));
  items.push({ d: R.dr + 0.001, rabbit: true });
  items.sort((a, b) => b.d - a.d);
  c.shadowBlur = 5 * RB.hdpr;
  for (const it of items) {
    if (it.rabbit) {
      const blink = RB.inv > 0 && Math.floor(t * 14) % 2 === 0 ? 0.35 : 1;
      const a = vis * fadeAll * blink * (0.88 + 0.12 * Math.sin(t * 31)),
        jit = RB.hit > 0 ? (Math.random() - 0.5) * 3 * RB.hit : 0;
      const F = frame(RB.p + jit * 0.02, R.dr, RB.z, mat * sqAll);
      glow(F, 9 * (1 - Math.min(0.6, RB.z / 40)), RB_COL.rabbit, a);
      const parts = rbRabbitParts(RB.phase, RB.z > 0, RB.state !== "run");
      parts.forEach(([lines, col]) => {
        const cc = RB.hit > 0 ? [255, 120 + 100 * (1 - RB.hit), 210] : col;
        c.shadowColor = `rgb(${cc})`;
        rbPart(c, F.M, lines, cc, a, col === RB_COL.ear ? 0 : 0.2);
      });
      continue;
    }
    const o = it.o,
      near = Math.min(1, (R.far - o.d) / 1.6); // fade in from the horizon
    let a = vis * fadeAll * near * (0.85 + 0.15 * Math.sin(t * 27 + o.seed * 9));
    let lift = 0,
      sq = mat * sqAll;
    if (o.sm != null) {
      a *= (1 - o.sm) * (Math.floor(t * 20) % 2 ? 1 : 0.3);
      sq *= 1 - o.sm * 0.7;
    }
    if (o.kind === "carrot") {
      let z = o.z + Math.sin(t * 3 + o.seed) * 1.5;
      if (o.tk != null) {
        z += o.tk * 34;
        a *= 1 - o.tk;
      }
      const F = frame(o.x, o.d, z, sq),
        C = RB_COL.carrot,
        L = RB_COL.leaf,
        ro = { roll: 0.38, yaw: t * 1.6 + o.seed },
        K = 1.35;
      glow(frame(o.x, o.d, 0, sq), 9, C, a);
      c.shadowColor = "rgb(255,132,30)";
      rbPart(
        c,
        F.M,
        rbLathe(
          [
            [0, 0],
            [2.2, 1.2],
            [5, 2.2],
            [8, 3],
            [10.6, 3.4],
            [12, 3],
            [12.8, 1.8],
          ].map(([z, r]) => [z * K, r * K]),
          ro,
        ),
        C,
        a,
        0.42,
      );
      c.shadowColor = "rgb(96,236,110)";
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2 + 0.3,
          dx = Math.cos(ang),
          dy = Math.sin(ang),
          wx = -dy * 1.2,
          wy = dx * 1.2;
        const leaf = [
          [0, 0, 12.6],
          [dx * 1.4 + wx, dy * 1.4 + wy, 16.5],
          [dx * 3.4, dy * 3.4, 21 - (k % 2) * 1.5],
          [dx * 1.4 - wx, dy * 1.4 - wy, 16.5],
          [0, 0, 12.6],
        ].map(p =>
          rbRot(
            p.map(v => v * K),
            ro,
          ),
        );
        rbPart(c, F.M, [leaf, [leaf[0], leaf[2]]], L, a, 0.5);
      }
      continue;
    }
    const F = frame(o.x + (o.sm != null ? (Math.random() - 0.5) * 0.03 : 0), o.d, lift, sq),
      C = RB_COL.obst;
    glow(F, o.kind === "hurdle" ? 17 : 8, C, a);
    c.shadowColor = "rgb(255,79,184)";
    if (o.kind === "cone") {
      rbPart(c, F.M, rbBox([0, 0, 0], 11, 11, 0.8), C, a, 0.1);
      rbPart(c, F.M, rbCone([0, 0, 0.8], 4.6, 11.4), C, a, 0.16);
      rbPart(c, F.M, [rbEll([0, 0, 6], [2.9, 2.9, 0.01], {}, 12)[1]], [255, 235, 250], a * 0.9, 0);
    } else if (o.kind === "crate") {
      const L = rbBox([0, 0, 0], 11, 11, 11);
      L.push(
        [
          [-5.5, -5.5, 0],
          [5.5, -5.5, 11],
        ],
        [
          [5.5, -5.5, 0],
          [-5.5, -5.5, 11],
        ],
        [
          [-5.5, -5.5, 11],
          [5.5, 5.5, 11],
        ],
        [
          [-5.5, 5.5, 0],
          [-5.5, -5.5, 11],
        ],
      );
      rbPart(c, F.M, L, C, a, 0.14);
    } else {
      rbPart(c, F.M, rbBox([-13, 0, 0], 1.8, 1.8, 10), C, a, 0.14);
      rbPart(c, F.M, rbBox([13, 0, 0], 1.8, 1.8, 10), C, a, 0.14);
      rbPart(c, F.M, rbBox([-13, 0, 0], 2, 6, 0.8), C, a, 0.1);
      rbPart(c, F.M, rbBox([13, 0, 0], 2, 6, 0.8), C, a, 0.1);
      rbPart(c, F.M, rbBox([0, 0, 6.6], 28, 1.2, 3.2), C, a, 0.22);
      const st = [];
      for (let i = -12; i < 12; i += 4)
        st.push([
          [i, -0.6, 6.6],
          [i + 2.4, -0.6, 9.8],
        ]);
      rbPart(c, F.M, st, [255, 235, 250], a * 0.8, 0);
    }
  }
  // scanlines across the whole hologram layer
  c.shadowBlur = 0;
  c.globalCompositeOperation = "destination-out";
  c.setTransform(1, 0, 0, 1, 0, (Math.floor((t * 24) % 3) * RB.hdpr) / 1.5);
  c.fillStyle = RB.scan;
  c.fillRect(0, -6 * RB.hdpr, RB.holo.width, RB.holo.height + 12 * RB.hdpr);
  c.globalCompositeOperation = "source-over";
}
