/* =====================================================================
   MAKER FACE — a rocket factory that deploys out of the cube. The 3D printer
   prints the rocket section by section; the PCB fab etches, populates and
   solders a board for each one. Two arms put them on belts that meet at the
   assembly machine, which fits the board inside its section; a tower crane
   stacks the sections on the pad. Once complete, the rocket launches and
   the next one starts.
   All coordinates are in the stage frame (the face turned upright).
   ===================================================================== */
const MK = { open: false, gen: 0, arms: [], belts: [], items: null, n: 1, st: {}, stack: [], fx: [], sparks: [] };
/* One layout for the whole face (stage frame: the face turned upright; on screen +x runs down-right,
   +y down-left, the far corner (56, 56) is at the top). Printer on the left, PCB fab on the right, each
   with its arm and belt; the belts meet in a V at the assembly machine; the crane and the pad are behind. */
const MKL = {
  printer: [125, 410],
  fab: [410, 125],
  asm: [205, 205],
  pad: [95, 95],
  crane: [200, 96],
  holo: [400, 400],
  arms: [
    [210, 458],
    [458, 210],
  ],
  L1: 70,
  L2: 66,
  belts: [
    { axis: "y", at: 205, from: 368, door: 263, slot: "part" },
    { axis: "x", at: 205, from: 368, door: 263, slot: "pcb" },
  ],
  asmH: 56,
  padH: 6,
  jib: 150,
  carry: 128,
  beltV: 40,
};
/* the rocket: three printed sections, each with its own board inside */
const MK_SECS = [
  { id: "ENGINE", h: 30, pcb: "IGNITION" },
  { id: "AVIONICS", h: 30, pcb: "FLIGHT CPU" },
  { id: "NOSE", h: 32, pcb: "TELEMETRY" },
];
const mkG = (parent, x = 0, y = 0, tr = "") => div("mk-g", parent, { left: px(x), top: px(y), transform: tr });
/* promise-based tween, cancelled when the factory is torn down (generation changes) */
function mkAnim(gen, dur, fn, ease = eio) {
  return new Promise(res => {
    if (reduce) {
      fn(1);
      return res();
    }
    const t0 = performance.now();
    const step = now => {
      if (gen !== MK.gen) return res();
      const t = Math.min(1, (now - t0) / dur);
      fn(ease(t));
      t < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
const mkWait = (gen, ms) => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const mkOK = gen => gen === MK.gen;
async function mkUntil(gen, cond) {
  while (mkOK(gen) && !cond()) await new Promise(r => setTimeout(r, 60));
  return mkOK(gen);
}
/* where a loose item sits (stage frame); sz < 1 squashes it in height (a print in progress) */
function mkPlace(it, x, y, z, sz = 1) {
  it.at = [x, y, z];
  it.g.style.transform =
    `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px)` +
    (sz < 1 ? ` scale3d(1,1,${Math.max(0.01, sz).toFixed(3)})` : "");
}
/* a hatch: a pit with two striped doors that swing down into the cube */
function mkHatch(parent, cx, cy, w, d, z = 0) {
  div("mk-pit", parent, {
    left: px(cx - w / 2),
    top: px(cy - d / 2),
    width: px(w),
    height: px(d),
    transform: `translateZ(${z + 0.3}px)`,
  });
  return [0, 1].map(i => {
    const el = div("mk-door stripe", parent, {
      left: px(cx - w / 2 + (i * w) / 2),
      top: px(cy - d / 2),
      width: px(w / 2),
      height: px(d),
      transformOrigin: i ? "100% 50%" : "0 50%",
    });
    el._z = z + 0.6;
    el.style.transform = `translateZ(${el._z}px)`;
    return el;
  });
}
const mkDoors = (ds, open) =>
  ds.forEach((d, i) => (d.style.transform = `translateZ(${d._z}px)` + (open ? ` rotateY(${i ? -100 : 100}deg)` : "")));
const mkSt = (r, k) => (MK.st[r] = MK.st[r] || MK_SECS.map(() => ({ s: 0, p: 0, pcb: "" })))[k];

function buildMaker() {
  const root = $("#makGroup"),
    st = div("mk-stage", root);
  MK.stage = st;
  const [px0, py0] = MKL.printer,
    [fx0, fy0] = MKL.fab,
    [ax0, ay0] = MKL.asm,
    [cx0, cy0] = MKL.crane,
    [pdx, pdy] = MKL.pad,
    H = MKL.asmH;
  // ---- hatches: every machine rises out of the cube through its own
  MK.hatch = {
    printer: mkHatch(st, px0, py0, 132, 132),
    fab: mkHatch(st, fx0, fy0, 120, 112),
    asm: mkHatch(st, ax0, ay0, 74, 74),
    crane: mkHatch(st, cx0, cy0, 40, 40),
  };
  MKL.arms.forEach(([x, y]) =>
    div("mk-pit", st, { left: px(x - 17), top: px(y - 17), width: "34px", height: "34px", borderRadius: "50%" }),
  );

  // ---- the printer, Prusa MINI style: sliding bed, one Z column, cantilever X arm
  const pr = mkG(st, px0, py0, "translateZ(-170px)");
  MK.pr = pr;
  box(pr, -58, -60, 116, 120, 10, "mk-dark"); // base
  box(pr, -10, -54, 20, 108, 2, "mk-metal", 10); // Y rail under the bed
  MK.bedY = mkG(pr, 0, 0); // the bed slides along Y
  box(MK.bedY, -42, -42, 84, 84, 4, "mk-bed", 12);
  box(pr, -58, -12, 14, 24, 124, "mk-frame", 10); // Z column (left)
  box(pr, -60, -14, 18, 28, 6, "mk-amber", 134); // column cap
  MK.gantry = mkG(pr, 0, 0, "translateZ(110px)"); // the X arm climbs the column
  box(MK.gantry, -46, -5, 94, 10, 8, "mk-metal");
  box(MK.gantry, -50, -9, 10, 18, 14, "mk-amber", -3); // Z carriage on the column
  MK.head = mkG(MK.gantry, 0, 0);
  box(MK.head, -9, -8, 18, 16, 16, "mk-amber", -14);
  box(MK.head, -2, -2, 4, 4, 5, "mk-metal", -19);
  const lcd = box(pr, -26, 46, 52, 12, 3, "mk-lcd", 10);
  swFit(div("", lcd.t), "PRINT", 44, 9, { fam: SW_MONO, wt: 400, ls: 0.12 });

  // ---- PCB fab: a magazine of blank boards, a sliding bed, and a gantry whose head etches, places and solders
  const fb = mkG(st, fx0, fy0, "translateZ(-80px)");
  MK.fab = fb;
  const fbase = box(fb, -56, -52, 112, 104, 12, "mk-fab");
  nameOnFace(fbase.r.querySelector(".bx-front"), "PCB FAB", "#63e6be", 70, 9.5);
  box(fb, -4, -46, 8, 92, 2, "mk-metal", 12); // Y rail
  const mag = box(fb, -24, -52, 48, 18, 20, "mk-mag", 12); // magazine of blanks (back)
  div("mk-slot", mag.r.querySelector(".bx-front"));
  MK.fbed = mkG(fb, 0, -14);
  box(MK.fbed, -26, -20, 52, 40, 4, "mk-bed", 14);
  [-54, 46].forEach(x => box(fb, x, -4, 8, 8, 50, "mk-frame", 12)); // gantry columns
  box(fb, -54, -4, 108, 8, 6, "mk-metal", 62); // beam (along x)
  MK.fhead = mkG(fb, 0, 0);
  box(MK.fhead, -7, -7, 14, 14, 14, "mk-amber", 52); // carriage riding the beam
  MK.ftool = mkG(MK.fhead, 0, 0);
  box(MK.ftool, -1.5, -1.5, 3, 3, 18, "mk-metal", 40); // plunger
  box(MK.ftool, -4, -4, 8, 8, 8, "mk-dark", 32); // tool body
  box(MK.ftool, -1.5, -1.5, 3, 3, 3, "sw-tip", 29); // tip
  const flcd = box(fb, 29, 27, 24, 15, 3, "mk-lcd", 12);
  MK.flcd = div("", flcd.t);
  swFit(MK.flcd, "SOLDER", 20, 8.5, { fam: SW_MONO, wt: 400, ls: 0.06 });
  MK.flcd.textContent = "IDLE";
  MK.fpose = { x: 0, y: -14, d: 0 };
  mkFabPose(MK.fpose);

  // ---- the two belts, from each arm to the assembly machine
  MKL.belts.forEach((b, k) => {
    const len = b.from + 14 - (ay0 + 36),
      alongY = b.axis === "y";
    const g = mkG(st, alongY ? b.at : ax0 + 36, alongY ? ay0 + 36 : b.at, "translateZ(-14px) scale3d(.01,.01,1)");
    g.style.transformOrigin = "0 0";
    const belt = alongY ? box(g, -13, 0, 26, len, 10, "mk-belt ay") : box(g, 0, -13, len, 26, 10, "mk-belt ax");
    if (alongY) {
      box(g, -16, 0, 3, len, 12, "mk-frame");
      box(g, 13, 0, 3, len, 12, "mk-frame");
    } else {
      box(g, 0, -16, len, 3, 12, "mk-frame");
      box(g, 0, 13, len, 3, 12, "mk-frame");
    }
    MK.belts.push({ ...b, k, g, belt: belt.r, busy: false, run: on => belt.r.classList.toggle("run", on) });
  });

  // ---- assembly machine: two doorways (one per belt), a hatch on top the finished section rises through
  const as = mkG(st, ax0, ay0, `translateZ(${-H - 8}px)`);
  MK.asmG = as;
  const ab = box(as, -36, -36, 72, 72, H, "mk-asm");
  const fr = ab.r.querySelector(".bx-front"),
    rt = ab.r.querySelector(".bx-right");
  // a doorway per belt, each closed by a roll-up shutter (on the right face the div's "up" is its -x)
  MK.shutters = {
    part: div("mk-shutter h", div("mk-intake", fr, { left: "13px", width: "46px", bottom: "0", height: "44px" })),
    pcb: div("mk-shutter v", div("mk-intake", rt, { top: "13px", height: "46px", right: "0", width: "44px" })),
  };
  const an = nameOnFace(fr, "ASSEMBLY", "#ffb3ef", 60, 9.5);
  an.style.inset = "0 0 auto 0";
  an.style.height = "12px";
  MK.asmDoors = mkHatch(as, 0, 0, 46, 46, H);
  MK.lift = mkG(as, 0, 0, `translateZ(${H - 40}px)`);
  box(MK.lift, -17, -17, 34, 34, 3, "mk-metal");
  MK.lamps = {
    part: div("mk-lamp", ab.t, { left: "5px", bottom: "5px" }),
    pcb: div("mk-lamp", ab.t, { right: "5px", top: "5px" }),
  };
  const gear = cyl(as, 29, 29, 11, 3, "mk-gear", H);
  MK.asmGear = div("gear", gear.t);

  // ---- launch pad (always on the face) and the rocket built on it
  const pad = box(st, pdx - 30, pdy - 30, 60, 60, MKL.padH, "mk-pad");
  MK.padLights = [
    [5, 5],
    [49, 5],
    [5, 49],
    [49, 49],
  ].map(([x, y]) => div("mk-padl", pad.t, { left: px(x), top: px(y) }));
  MK.rocket = div("mk-g mk-rocket", st);
  MK.rocket.style.transform = `translate3d(${pdx}px,${pdy}px,${MKL.padH}px)`;

  // ---- tower crane: mast, slewing jib with trolley, cable and a magnet hook (the jib folds down to retract)
  const J = MKL.jib,
    cr = mkG(st, cx0, cy0, "translateZ(-176px)");
  MK.crG = cr;
  box(cr, -12, -12, 24, 24, 6, "mk-dark");
  box(cr, -7, -7, 14, 14, J - 6, "mk-mast", 6);
  const slew = mkG(cr, 0, 0, `translateZ(${J}px)`);
  cyl(slew, 0, 0, 20, 4, "mk-gear", 0);
  box(slew, -7, 7, 12, 11, 10, "mk-cab", 2); // operator cab
  box(slew, -4, -4, 8, 8, 22, "mk-mast", 4); // apex
  const jibF = mkG(slew, 0, 0),
    cjF = mkG(slew, 0, 0); // fold pivots at the mast edges (x = ±7, see mkCraneFold)
  box(jibF, 0, -4, 118, 8, 6, "mk-jib", 4);
  box(cjF, -40, -4, 40, 8, 6, "mk-jib", 4);
  box(cjF, -40, -7, 14, 14, 12, "mk-cw", -6);
  const trolley = mkG(jibF, 0, 0);
  box(trolley, -6, -6, 12, 12, 4, "mk-amber", 0);
  const cable = mkG(jibF, 0, 0);
  box(cable, -0.8, -0.8, 1.6, 1.6, 100, "mk-cable");
  const hook = mkG(jibF, 0, 0);
  box(hook, -6, -6, 12, 12, 7, "mk-amber", 2);
  box(hook, -8, -8, 16, 16, 2, "mk-magnet", 0);
  MK.cr = { g: cr, slew, jibF, cjF, trolley, cable, hook, th: -0.6, r: 40, z: J - 20, hold: null };
  mkCraneFold(1);
  mkCraneSet(MK.cr.th, MK.cr.r, MK.cr.z);

  MK.items = div("mk-g mk-items", st);

  // ---- robot arms (unfold out of their pits): gear-driven base, clevis joints with pins
  MKL.arms.forEach(([x, y], k) => {
    const ar = mkG(st, x, y, "translateZ(-160px)");
    cyl(ar, 0, 0, 42, 6, "mk-dark", 0);
    const ring = cyl(ar, 0, 0, 36, 5, "mk-gear", 6);
    const rg = div("gear", ring.t);
    box(ar, -8, -31, 16, 14, 9, "mk-dark");
    const pin = cyl(ar, 0, -23, 12, 4, "mk-gear", 9);
    const pg = div("gear", pin.t);
    const tt = mkG(ar, 0, 0, "translateZ(11px)");
    box(tt, -13, -13, 26, 26, 4, "mk-amber");
    box(tt, -8, -13, 16, 4, 32, "mk-frame", 4);
    box(tt, -8, 9, 16, 4, 32, "mk-frame", 4);
    box(tt, -6, -19, 12, 6, 12, "mk-dark", 22);
    const sh = mkG(tt, 0, 0, "translateZ(28px)");
    box(sh, -4, -12, 8, 24, 8, "mk-metal", -4);
    box(sh, -5, -5, 10, 10, MKL.L1 + 6, "mk-metal", -3);
    box(sh, -7, -9, 14, 4, 16, "mk-frame", MKL.L1 - 8);
    box(sh, -7, 5, 14, 4, 16, "mk-frame", MKL.L1 - 8);
    const el = mkG(sh, 0, 0, `translateZ(${MKL.L1}px)`);
    box(el, -3, -10, 6, 20, 6, "mk-amber", -3);
    box(el, -4, -4, 8, 8, MKL.L2 + 2, "mk-metal", -2);
    const wr = mkG(el, 0, 0, `translateZ(${MKL.L2}px)`);
    box(wr, -6, -6, 12, 12, 8, "mk-amber", -4);
    box(wr, -9, -5, 18, 10, 4, "mk-dark", 4);
    const f1 = box(wr, -9, -2, 3, 4, 12, "mk-amber", 8),
      f2 = box(wr, 6, -2, 3, 4, 12, "mk-amber", 8);
    const arm = {
      x,
      y,
      ar,
      tt,
      sh,
      el,
      wr,
      fingers: [f1.r, f2.r],
      P: null,
      k,
      rg,
      pg,
      hold: null,
      rest: [x - 46, y - 46, 92],
    };
    MK.arms.push(arm);
    mkArmAngles(arm, 0, 0, 0, 0);
  });

  // ---- hologram projector: it shows the rocket's blueprint and how far each section has got
  const [HX, HY] = MKL.holo;
  box(st, HX - 18, HY - 18, 36, 36, 8, "mk-dark");
  box(st, HX - 14, HY - 14, 28, 28, 3, "mk-frame", 8);
  cyl(st, HX, HY, 18, 5, "mk-lens", 11);

  // ---- copper on the face: passives and the hologram's driver
  const MP = PCB.makParts;
  const pads = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pads.setAttribute("viewBox", "0 0 560 560");
  pads.setAttribute("class", "mob-pads");
  pads.innerHTML = [...MP.res, ...MP.cer]
    .map(([x1, y1, x2, y2]) =>
      x1 === x2
        ? `<rect class="fx-pad" x="${x1 - 5}" y="${y1 - 1}" width="10" height="5"/><rect class="fx-pad" x="${x1 - 5}" y="${y2 - 4}" width="10" height="5"/>`
        : `<rect class="fx-pad" x="${x1 - 1}" y="${y1 - 5}" width="5" height="10"/><rect class="fx-pad" x="${x2 - 4}" y="${y1 - 5}" width="5" height="10"/>`,
    )
    .join("");
  root.insertBefore(pads, st);
  MP.res.forEach(r => smdR(root, ...r));
  MP.cer.forEach(r => smdC(root, ...r));
  MP.ic.forEach(o => {
    const c = box(root, o.x, o.y, o.w, o.h, 4, "ic-body");
    div("ic-dot", c.t);
    const t = div("", c.t, {
      position: "absolute",
      left: "9px",
      top: "50%",
      transform: "translateY(-50%)",
      font: "7px var(--f-label)",
      color: "#7f88d8",
      letterSpacing: ".1em",
    });
    t.textContent = o.label;
    for (let yy = o.y + 8; yy < o.y + o.h - 4; yy += 14) {
      box(root, o.x - 5, yy - 2, 6, 4, 1.5, "ic-pin");
      box(root, o.x + o.w - 1, yy - 2, 6, 4, 1.5, "ic-pin");
    }
    for (let xx = o.x + 10; xx < o.x + o.w - 4; xx += 14) {
      box(root, xx - 2, o.y - 5, 4, 6, 1.5, "ic-pin");
      box(root, xx - 2, o.y + o.h - 1, 4, 6, 1.5, "ic-pin");
    }
  });

  // ---- 2D overlays: the hologram (moves with its lens) and the effects (sparks, laser, flame, smoke)
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const hc = document.createElement("canvas");
  hc.className = "holo-overlay";
  hc.width = hc.height = Math.round(300 * dpr);
  $("#world").appendChild(hc);
  const oc = document.createElement("canvas");
  oc.className = "mk-overlay";
  oc.width = Math.round(900 * dpr);
  oc.height = Math.round(720 * dpr);
  $("#world").appendChild(oc);
  MK.holoCv = hc;
  MK.holoCtx = hc.getContext("2d");
  MK.ov = oc;
  MK.ovCtx = oc.getContext("2d");
  MK.holoDpr = dpr;
}
/* a name printed on a machine face, sized to fit (see swFit) */
function nameOnFace(face, text, color, w, max) {
  const n = div("sw-name", face);
  swFit(n, text, w, max, { ls: 0.1 });
  n.style.setProperty("--c", color);
  return n;
}

/* ---------------- robot arms (inverse kinematics) ---------------- */
/* joint angles → transforms (θ turntable, a shoulder, b elbow, c wrist; radians) */
function mkArmAngles(arm, th, a, b, c) {
  arm.ang = [th, a, b, c];
  arm.tt.style.transform = `translateZ(11px) rotateZ(${th}rad)`;
  arm.tt.style.setProperty("--R", (270 + (th * 180) / Math.PI).toFixed(1) + "deg");
  const deg = (th * 180) / Math.PI;
  if (arm.rg) {
    arm.rg.style.setProperty("--ga", deg.toFixed(1) + "deg");
    arm.pg.style.setProperty("--ga", (-deg * 3).toFixed(1) + "deg");
  }
  arm.sh.style.transform = `translateZ(28px) rotateY(${a}rad)`;
  arm.el.style.transform = `translateZ(${MKL.L1}px) rotateY(${b}rad)`;
  arm.wr.style.transform = `translateZ(${MKL.L2}px) rotateY(${c}rad)`;
}
/* put the wrist at P = [x, y, z] (stage frame), gripper pointing straight down */
function mkArmTo(arm, P) {
  arm.P = P;
  const dx = P[0] - arm.x,
    dy = P[1] - arm.y,
    th = Math.atan2(dy, dx),
    r = Math.hypot(dx, dy),
    hz = P[2] - 39;
  const L1 = MKL.L1,
    L2 = MKL.L2,
    d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, Math.hypot(r, hz)));
  const phi = Math.atan2(r, hz),
    k = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const a = phi - k,
    ex = L1 * Math.sin(a),
    ez = L1 * Math.cos(a),
    a2 = Math.atan2(r - ex, hz - ez);
  mkArmAngles(arm, th, a, a2 - a, Math.PI - a2);
  if (arm.hold) mkPlace(arm.hold, P[0], P[1], P[2] - 16 - arm.hold.h);
}
function mkArmMove(gen, arm, to, dur) {
  const from = arm.P || [arm.x + 40, arm.y, 120];
  return mkAnim(gen, dur, t =>
    mkArmTo(
      arm,
      from.map((v, i) => v + (to[i] - v) * t),
    ),
  );
}
function mkGrip(arm, closed) {
  arm.fingers.forEach((f, i) => (f.style.transform = closed ? `translateX(${i ? -3 : 3}px)` : ""));
}
/* pick an item at src (its base, stage frame) and set it down at dst; onLifted fires once it is off its source */
async function mkArmTransfer(gen, arm, it, src, dst, onPick, onLifted) {
  const up = (p, h) => [p[0], p[1], p[2] + it.h + h];
  await mkArmMove(gen, arm, up(src, 60), 800);
  mkGrip(arm, false);
  await mkArmMove(gen, arm, up(src, 16), 420);
  if (!mkOK(gen)) return false;
  mkGrip(arm, true);
  onPick();
  arm.hold = it;
  mkArmTo(arm, arm.P);
  await mkArmMove(gen, arm, up(src, 60), 420);
  onLifted();
  await mkArmMove(gen, arm, up(dst, 60), 850);
  await mkArmMove(gen, arm, up(dst, 16), 380);
  if (!mkOK(gen)) return false;
  mkGrip(arm, false);
  arm.hold = null;
  mkPlace(it, ...dst);
  return true;
}

/* ---------------- 3D printer: prints the rocket's sections ---------------- */
/* a section of the rocket: lavender printed shell, navy bands, pink trim, an open bay for its board.
   The bay, the porthole and the bands sit on the camera-facing body, so they always face the viewer. On that
   body the rim of a disc (seen at the iso angle) curves 9.2 px below its level: bands and seams are drawn as
   arcs of that size, and nothing is placed in the top 9.2 px, which the section's own top covers. The whole
   section floats 0.6 px above what it stands on, so its rounded bottom never shares a plane with it. */
const MK_RIM = 9.2;
function mkSection(k) {
  const S = MK_SECS[k],
    g = div("mk-g mk-sec mk-sec" + k, MK.items),
    in0 = mkG(g, 0, 0, "translateZ(.6px)"),
    shell = "mk-shell";
  const bay = body => {
    const b = div("mk-bay", body);
    b.innerHTML = '<i class="pcb"></i><i class="led"></i>';
    return b;
  };
  const arc = (body, fromTop, cls) => div("mk-arc " + cls, body, { top: px(fromTop - MK_RIM) }); // a band / seam that follows the rim
  let tops = [],
    bays = [],
    bots = [],
    ant = null;
  if (k === 0) {
    cyl(in0, 0, 0, 13, 6, "mk-nozzle", 0, { noTop: true });
    const c = cyl(in0, 0, 0, 26, 24, shell, 6);
    tops.push(c.t);
    bays.push(bay(c.body));
    arc(c.body, 0, "seam");
    arc(c.body, 2, "band");
    // four fins: lavender root, pink tip, swept top (separate pieces, so no two faces share a plane)
    const fin = (c, sn, r0, r1, z, h, cls) =>
      c
        ? box(in0, c > 0 ? r0 : -r1, -1.25, r1 - r0, 2.5, h, cls, z)
        : box(in0, -1.25, sn > 0 ? r0 : -r1, 2.5, r1 - r0, h, cls, z);
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([c, sn]) => {
      fin(c, sn, 11, 16, 0, 15, "mk-hull");
      fin(c, sn, 16, 21, 0, 12, "mk-trim");
      fin(c, sn, 11, 16, 15, 7, "mk-hull");
    });
  } else if (k === 1) {
    const c = cyl(in0, 0, 0, 26, 30, shell, 0);
    tops.push(c.t);
    bots.push(c.r.querySelector(".cyl-bot"));
    div("mk-port", c.body);
    bays.push(bay(c.body));
    arc(c.body, 0, "seam");
  } else {
    const c = cyl(in0, 0, 0, 26, 8, shell, 0, { noTop: true });
    bots.push(c.r.querySelector(".cyl-bot"));
    bays.push(bay(c.body));
    arc(c.body, 0, "seam");
    cyl(in0, 0, 0, 26, 24, shell + " mk-cone", 8, { noTop: true, noBot: true });
    ant = mkG(in0, 0, 0, "scale3d(1,1,.01)");
    box(ant, -0.7, -0.7, 1.4, 1.4, 9, "mk-metal", 31);
    box(ant, -1.4, -1.4, 2.8, 2.8, 2, "mk-antled", 40);
  }
  return { g, h: S.h, k, tops, bays, bots, ant };
}
/* the assembly machine has fitted the board: it shows in the bay, its LED runs, the nose gets its antenna */
function mkFitted(it) {
  it.bays.forEach(b => b.classList.add("on"));
  if (it.ant) it.ant.style.transform = "";
}
function mkSetPose(q) {
  MK.pose = q;
  MK.gantry.style.transform = `translateZ(${q.z.toFixed(1)}px)`;
  MK.head.style.transform = `translateX(${q.x.toFixed(1)}px)`;
  MK.bedPos = q.y;
  MK.bedY.style.transform = `translateY(${q.y.toFixed(1)}px)`;
  const p = MK.onBed;
  if (p) mkPlace(p, MKL.printer[0], MKL.printer[1] + q.y, 16, p.sz);
}
async function mkPrint(gen, part, st) {
  // glide from the parked / deployed pose to the start of the first layer (no jump)
  const from = MK.pose || { z: 110, x: 0, y: 0 },
    start = { z: 35, x: 0, y: 10 };
  await mkAnim(gen, 700, t =>
    mkSetPose({
      z: from.z + (start.z - from.z) * t,
      x: from.x + (start.x - from.x) * t,
      y: from.y + (start.y - from.y) * t,
    }),
  );
  st.s = 1;
  await mkAnim(
    gen,
    5400,
    t => {
      st.p = t;
      part.sz = t;
      mkSetPose({ z: 16 + part.h * t + 19, x: Math.sin(t * 90) * 11, y: Math.cos(t * 57) * 10 });
    },
    t => t,
  );
  st.s = 2;
  part.sz = 1;
  // park: the arm climbs out of the way, the head goes to the column, the bed slides forward to present the part
  const p0 = { ...MK.pose };
  await mkAnim(gen, 600, t =>
    mkSetPose({ z: p0.z + (118 - p0.z) * t, x: p0.x + (-26 - p0.x) * t, y: p0.y + (28 - p0.y) * t }),
  );
}
/* sections 0, 1, 2 of each rocket; the next rocket starts once this one is complete on the pad */
async function mkPrinterLoop(gen) {
  for (let r = MK.n; ; r++) {
    for (let k = 0; k < 3; k++) {
      const part = mkSection(k);
      part.r = r;
      part.sz = 0.01;
      MK.onBed = part;
      mkSetPose(MK.pose || { z: 110, x: 0, y: 0 });
      await mkPrint(gen, part, mkSt(r, k));
      if (!mkOK(gen)) return;
      MK.printed = part;
      if (!(await mkUntil(gen, () => MK.printed !== part))) return; // the arm has lifted it off the bed
    }
    if (!(await mkUntil(gen, () => MK.done >= r))) return;
    if (reduce) return;
  }
}

/* ---------------- PCB fab: etch, place, solder ---------------- */
function mkFabPose(q) {
  MK.fpose = q;
  MK.fbed.style.transform = `translateY(${(q.y + 14).toFixed(1)}px)`;
  MK.fhead.style.transform = `translateX(${q.x.toFixed(1)}px)`;
  MK.ftool.style.transform = `translateZ(${(-q.d).toFixed(1)}px)`;
  MK.fabTip = [MKL.fab[0] + q.x, MKL.fab[1], 29 - q.d];
}
const mkFabMove = (gen, to, dur, ease) => {
  const f = { ...MK.fpose };
  return mkAnim(
    gen,
    dur,
    t =>
      mkFabPose({
        x: f.x + ((to.x ?? f.x) - f.x) * t,
        y: f.y + ((to.y ?? f.y) - f.y) * t,
        d: f.d + ((to.d ?? f.d) - f.d) * t,
      }),
    ease,
  );
};
const mkLcd = text => {
  MK.flcd.textContent = text;
};
/* a board: substrate with its copper (drawn as it is etched) and the parts placed on it */
const MK_BOARD = {
  traces: [
    "M14 13H20V8H26",
    "M14 15H22V14H30",
    "M14 17H24V20H30",
    "M6 13H3V22H7",
    "M8 17V24",
    "M11 17V24",
    "M14 19H16V24",
    "M28 8H35V20H31",
    "M5 8V4H10",
  ],
  pads: [
    [26, 8],
    [30, 14],
    [30, 20],
    [7, 22],
    [8, 24],
    [11, 24],
    [16, 24],
    [35, 8],
    [10, 4],
  ],
  parts: [
    { x: -10, y: -4, w: 11, d: 8, h: 2.6, c: "mk-chip" },
    { x: 8, y: -7, w: 6, d: 3, h: 2, c: "mk-res" },
    { x: 10, y: -1, w: 6, d: 3, h: 2, c: "mk-res" },
    { x: 10, y: 5, w: 5, d: 4, h: 2.4, c: "smdc-body" },
    { x: -14, y: 7, w: 3, d: 3, h: 2.2, c: "mk-ledp" },
  ],
};
function mkBoard() {
  const g = mkG(MK.fbed, 0, 0, "translate3d(0,-26px,18px)"),
    b = box(g, -20, -15, 40, 30, 2, "mk-pcb");
  b.t.innerHTML = `<svg class="mk-pcbart" viewBox="0 0 40 30"><path class="fing" d="M12 30V27M16 30V27M20 30V27M24 30V27M28 30V27"/>
    ${MK_BOARD.traces.map(d => `<path class="et" pathLength="1" d="${d}"/>`).join("")}${MK_BOARD.pads.map(([x, y]) => `<rect class="pd" x="${x - 0.9}" y="${y - 0.9}" width="1.8" height="1.8"/>`).join("")}</svg>`;
  const parts = MK_BOARD.parts.map(p => {
    const el = mkG(g, p.x, p.y, "translateZ(8px) scale3d(.01,.01,.01)");
    box(el, -p.w / 2, -p.d / 2, p.w, p.d, p.h, p.c, 2);
    el.style.opacity = 0;
    return { ...p, el };
  });
  const etch = [...b.t.querySelectorAll(".et")];
  etch.forEach(e => {
    e.style.strokeDasharray = "1 1";
    e.style.strokeDashoffset = 1;
  });
  return { g, h: 4.6, etch, parts, led: parts[4].el };
}
async function mkFabLoop(gen) {
  for (let r = MK.n; ; r++) {
    for (let k = 0; k < 3; k++) {
      const st = mkSt(r, k);
      st.pcb = "LOAD";
      mkLcd("LOAD");
      await mkFabMove(gen, { y: -14, x: 0, d: 0 }, 350);
      if (!mkOK(gen)) return;
      const bd = mkBoard();
      bd.r = r;
      await mkAnim(gen, 400, t => (bd.g.style.transform = `translate3d(0,${(-26 + 26 * t).toFixed(1)}px,18px)`), eout); // out of the magazine
      // etch: the bed steps under a scanning laser, the copper appears line by line
      st.pcb = "ETCH";
      mkLcd("ETCH");
      MK.fabTool = "laser";
      await mkFabMove(gen, { y: -12, x: -16 }, 300);
      await mkAnim(
        gen,
        1200,
        t => {
          mkFabPose({ x: -16 * Math.cos(t * Math.PI * 9), y: -12 + 24 * t, d: 0 });
          bd.etch.forEach(
            (e, i) => (e.style.strokeDashoffset = Math.max(0, Math.min(1, 1 - (t * bd.etch.length - i))).toFixed(3)),
          );
        },
        t => t,
      );
      MK.fabTool = null;
      if (!mkOK(gen)) return;
      // place: the head drops each part on its pads
      st.pcb = "PLACE";
      mkLcd("PLACE");
      for (const p of bd.parts) {
        await mkFabMove(gen, { x: p.x, y: -p.y }, 180);
        if (!mkOK(gen)) return;
        await mkFabMove(gen, { d: 4 }, 80);
        p.el.style.opacity = 1;
        await mkAnim(
          gen,
          140,
          t =>
            (p.el.style.transform = `translateZ(${(6 * (1 - t)).toFixed(1)}px) scale3d(${(0.4 + 0.6 * t).toFixed(3)},${(0.4 + 0.6 * t).toFixed(3)},${(0.4 + 0.6 * t).toFixed(3)})`),
          eout,
        );
        await mkFabMove(gen, { d: 0 }, 80);
      }
      // solder: the iron touches every part, sparks fly
      st.pcb = "SOLDER";
      mkLcd("SOLDER");
      const [chip, r1, , c1] = bd.parts;
      for (const [x, y] of [
        [chip.x - chip.w / 2 + 1, chip.y],
        [chip.x + chip.w / 2 - 1, chip.y],
        [c1.x, (r1.y + c1.y) / 2],
      ]) {
        await mkFabMove(gen, { x, y: -y }, 180);
        if (!mkOK(gen)) return;
        await mkFabMove(gen, { d: 6 }, 80);
        MK.fabTool = "iron";
        await mkWait(gen, 260);
        MK.fabTool = null;
        await mkFabMove(gen, { d: 0 }, 80);
      }
      bd.led.classList.add("on");
      st.pcb = "READY";
      mkLcd("READY");
      await mkFabMove(gen, { x: 0, y: 30, d: 0 }, 500);
      if (!mkOK(gen)) return;
      MK.boardOut = bd;
      if (!(await mkUntil(gen, () => MK.boardOut !== bd))) return; // the arm has lifted it off the bed
    }
    mkLcd("IDLE");
    if (!(await mkUntil(gen, () => MK.done >= r))) return;
    if (reduce) return;
  }
}

/* ---------------- arms and belts ---------------- */
async function mkArmLoop(gen, arm, belt, ready, srcOf, take) {
  for (;;) {
    if (!(await mkUntil(gen, () => ready() && !belt.busy))) return;
    const it = ready();
    belt.busy = true;
    const drop = belt.axis === "y" ? [belt.at, belt.from, 10] : [belt.from, belt.at, 10];
    if (
      !(await mkArmTransfer(
        gen,
        arm,
        it,
        srcOf(it),
        drop,
        () => take(it, "pick"),
        () => take(it, "lifted"),
      ))
    )
      return;
    belt.wait = it; // it departs with its partner (mkPairLoop)
    await mkArmMove(gen, arm, arm.rest, 650);
  }
}
/* the belt runs only while it carries something: to the doorway, then (once the machine is free) inside */
async function mkRide(gen, b, it) {
  const at = s => (b.axis === "y" ? mkPlace(it, b.at, s, 10) : mkPlace(it, s, b.at, 10)),
    v = MKL.beltV / 1000;
  const face = MKL.asm[0] + 36,
    sh = MK.shutters[b.slot];
  let up = false,
    down = false;
  b.run(true);
  await mkAnim(
    gen,
    (b.from - MKL.asm[0]) / v,
    t => {
      const x = b.from + (MKL.asm[0] - b.from) * t;
      at(x);
      if (!up && x < face + 50) {
        up = true;
        sh.classList.add("open");
      } // open before the item gets there
      if (!down && x < face - 24) {
        down = true;
        sh.classList.remove("open");
      }
    },
    t => t,
  ); // close once it is in
  b.run(false);
  if (!mkOK(gen)) return;
  it.g.style.visibility = "hidden";
  MK.asm[b.slot] = it;
  MK.lamps[b.slot].classList.add("on");
  b.busy = false;
}
/* the section and its board leave together (same belt length, same speed): they reach their doors at the
   same moment and the assembly starts straight away. The first one ready waits at the start of its belt. */
async function mkPairLoop(gen) {
  const [b1, b2] = MK.belts;
  for (;;) {
    if (!(await mkUntil(gen, () => b1.wait && b2.wait && !MK.asm.part && !MK.asm.pcb))) return;
    const p1 = b1.wait,
      p2 = b2.wait;
    b1.wait = b2.wait = null;
    await Promise.all([mkRide(gen, b1, p1), mkRide(gen, b2, p2)]);
  }
}

/* ---------------- assembly: the board goes into its section, the section rises out on top ---------------- */
async function mkAsmLoop(gen) {
  const [ax, ay] = MKL.asm,
    H = MKL.asmH;
  for (;;) {
    if (!(await mkUntil(gen, () => MK.asm.part && MK.asm.pcb && !MK.asm.out))) return;
    const part = MK.asm.part,
      pcb = MK.asm.pcb;
    MK.asmGear.classList.add("spin");
    await mkWait(gen, 1300);
    if (!mkOK(gen)) return;
    pcb.g.remove();
    mkFitted(part);
    mkSt(part.r, part.k).s = 3;
    mkSt(part.r, part.k).pcb = "IN";
    MK.asmGear.classList.remove("spin");
    Object.values(MK.lamps).forEach(l => l.classList.remove("on"));
    mkDoors(MK.asmDoors, true);
    await mkWait(gen, 380);
    const z0 = H - part.h - 6;
    part.g.style.visibility = "";
    MK.asm.part = MK.asm.pcb = null; // the doorways are free again
    const zTop = H + 0.3; // the platform stops just proud of the top (never level with it)
    await mkAnim(
      gen,
      900,
      t => {
        const z = z0 + (zTop - z0) * t;
        mkPlace(part, ax, ay, z);
        MK.lift.style.transform = `translateZ(${(z - 3).toFixed(1)}px)`;
      },
      eout,
    );
    if (!mkOK(gen)) return;
    MK.asm.out = part;
    if (!(await mkUntil(gen, () => MK.asm.out !== part))) return; // the crane has it
    await mkWait(gen, 300);
    await mkAnim(gen, 450, t => (MK.lift.style.transform = `translateZ(${(H - 3 - 37 * t).toFixed(1)}px)`));
    mkDoors(MK.asmDoors, false);
  }
}

/* ---------------- crane: stacks the sections on the pad ---------------- */
function mkCraneFold(f) {
  // 0 = jib out, 1 = folded down along the mast
  MK.cr.fold = f;
  MK.cr.jibF.style.transform = `translateX(7px) rotateY(${(f * 90).toFixed(2)}deg)`;
  MK.cr.cjF.style.transform = `translateX(-7px) rotateY(${(-f * 90).toFixed(2)}deg)`;
  [MK.cr.hook, MK.cr.cable, MK.cr.trolley].forEach(e => (e.style.opacity = f > 0.02 ? 0 : 1));
}
function mkCraneSet(th, r, z) {
  const C = MK.cr,
    J = MKL.jib,
    [mx, my] = MKL.crane;
  C.th = th;
  C.r = r;
  C.z = z;
  C.slew.style.transform = `translateZ(${J}px) rotateZ(${th.toFixed(4)}rad)`;
  C.slew.style.setProperty("--R", (270 + (th * 180) / Math.PI).toFixed(1) + "deg");
  const x = r - 7; // jib groups start at the mast edge (x = 7)
  C.trolley.style.transform = `translateX(${x.toFixed(1)}px)`;
  C.hook.style.transform = `translate3d(${x.toFixed(1)}px,0,${(z - J).toFixed(1)}px)`;
  const len = Math.max(1, J + 4 - (z + 9));
  C.cable.style.transform = `translate3d(${x.toFixed(1)}px,0,${(z + 9 - J).toFixed(1)}px) scale3d(1,1,${(len / 100).toFixed(3)})`;
  if (C.hold) mkPlace(C.hold, mx + r * Math.cos(th), my + r * Math.sin(th), z - C.hold.h);
}
/* swing (shortest way round), run the trolley and set the hook height together */
function mkCraneGo(gen, x, y, z, dur) {
  const C = MK.cr,
    [mx, my] = MKL.crane,
    th0 = C.th,
    r0 = C.r,
    z0 = C.z;
  let th1 = Math.atan2(y - my, x - mx);
  while (th1 - th0 > Math.PI) th1 -= 2 * Math.PI;
  while (th1 - th0 < -Math.PI) th1 += 2 * Math.PI;
  const r1 = Math.hypot(x - mx, y - my);
  return mkAnim(gen, dur, t => mkCraneSet(th0 + (th1 - th0) * t, r0 + (r1 - r0) * t, z0 + (z - z0) * t));
}
const mkHook = (gen, z, dur) => {
  const C = MK.cr,
    z0 = C.z;
  return mkAnim(gen, dur, t => mkCraneSet(C.th, C.r, z0 + (z - z0) * t));
};
async function mkCraneLoop(gen) {
  const [ax, ay] = MKL.asm,
    [pdx, pdy] = MKL.pad,
    H = MKL.asmH,
    CZ = MKL.carry;
  for (;;) {
    if (!(await mkUntil(gen, () => MK.asm.out))) return;
    const it = MK.asm.out;
    await mkCraneGo(gen, ax, ay, CZ, 1300);
    await mkHook(gen, H + 0.3 + it.h, 650);
    if (!mkOK(gen)) return;
    MK.cr.hold = it;
    MK.asm.out = null;
    mkCraneSet(MK.cr.th, MK.cr.r, MK.cr.z);
    await mkHook(gen, CZ, 600);
    const top = MKL.padH + MK.stack.reduce((a, s) => a + s.h, 0);
    await mkCraneGo(gen, pdx, pdy, CZ, 1300);
    await mkHook(gen, top + it.h, 800);
    if (!mkOK(gen)) return;
    MK.cr.hold = null;
    MK.rocket.appendChild(it.g);
    mkPlace(it, 0, 0, top - MKL.padH - (MK.stack.length ? 0.6 : 0));
    const below = MK.stack[MK.stack.length - 1]; // one continuous shell: no discs left inside the joint, just its seam
    if (below) {
      below.tops.forEach(t => (t.style.visibility = "hidden"));
      it.bots.forEach(t => (t.style.visibility = "hidden"));
    }
    MK.stack.push(it);
    mkSt(it.r, it.k).s = 4;
    await mkHook(gen, CZ, 500);
    if (MK.stack.length === MK_SECS.length) {
      MK.done = it.r;
      await mkCraneGo(gen, MKL.crane[0] + 40, MKL.crane[1] - 26, MKL.jib - 20, 1100); // swing clear of the rocket
      if (reduce) return;
      await mkLaunch(gen, it.r);
      if (!mkOK(gen)) return;
    }
  }
}

/* ---------------- launch: countdown, ignition, liftoff; then the next rocket ---------------- */
function mkRocketZ(z, jx = 0, jy = 0) {
  MK.rz = z;
  MK.rocket.style.transform = `translate3d(${(MKL.pad[0] + jx).toFixed(1)}px,${(MKL.pad[1] + jy).toFixed(1)}px,${(MKL.padH + z).toFixed(1)}px)`;
}
async function mkLaunch(gen, r) {
  MK.launchR = r;
  for (const c of [3, 2, 1]) {
    MK.count = c;
    MK.padLights.forEach(l => l.classList.add("on"));
    await mkWait(gen, 380);
    MK.padLights.forEach(l => l.classList.remove("on"));
    await mkWait(gen, 380);
    if (!mkOK(gen)) return;
  }
  MK.count = 0;
  MK.burn = 1;
  MK.padLights.forEach(l => l.classList.add("on"));
  await mkAnim(
    gen,
    1000,
    () => mkRocketZ(0, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2),
    t => t,
  ); // engines spool up
  if (!mkOK(gen)) return;
  await mkAnim(
    gen,
    2600,
    t => {
      const s = t * 2.6;
      mkRocketZ(8 * s + 62 * s * s);
    },
    t => t,
  );
  if (!mkOK(gen)) return;
  MK.burn = 0;
  MK.padLights.forEach(l => l.classList.remove("on"));
  MK.stack.forEach(s => s.g.remove());
  MK.stack = [];
  mkRocketZ(0);
  delete MK.st[r];
  MK.n = r + 1;
  MK.count = null;
  MK.launchR = 0;
  await mkWait(gen, 500);
}

/* ---------------- deploy / retract ---------------- */
async function makOpen() {
  if (MK.open) return;
  MK.open = true;
  const gen = ++MK.gen;
  Object.assign(MK, {
    asm: { part: null, pcb: null, out: null },
    printed: null,
    boardOut: null,
    onBed: null,
    done: MK.n - 1,
    stack: [],
    burn: 0,
    count: null,
    launchR: 0,
    fabTool: null,
  });
  MK.belts.forEach(b => {
    b.busy = false;
    b.wait = null;
    b.run(false);
  });
  Object.values(MK.shutters).forEach(e => e.classList.remove("open"));
  const rise = (g, from, dur) =>
    mkAnim(gen, dur, t => (g.style.transform = `translateZ(${(from * (1 - t)).toFixed(1)}px)`), eout);
  mkDoors(MK.hatch.printer, true);
  mkDoors(MK.hatch.fab, true);
  const printer = rise(MK.pr, -170, 1100),
    fab = rise(MK.fab, -80, 900);
  await mkWait(gen, 300);
  mkDoors(MK.hatch.asm, true);
  mkDoors(MK.hatch.crane, true);
  rise(MK.asmG, -MKL.asmH - 8, 900);
  const crane = rise(MK.crG, -176, 1100).then(() => mkAnim(gen, 700, t => mkCraneFold(1 - t), eout));
  await mkWait(gen, 300);
  MK.belts.forEach(b =>
    mkAnim(
      gen,
      800,
      t =>
        (b.g.style.transform = `translateZ(${(-14 + 14 * Math.min(1, t * 3)).toFixed(1)}px) scale3d(${b.axis === "x" ? Math.max(0.01, t).toFixed(3) : 1},${b.axis === "y" ? Math.max(0.01, t).toFixed(3) : 1},1)`),
      eout,
    ),
  );
  await mkWait(gen, 200);
  await Promise.all(
    MK.arms.map(arm =>
      mkAnim(
        gen,
        700,
        t => {
          arm.ar.style.transform = `translateZ(${(-160 + 160 * t).toFixed(1)}px)`;
          mkArmAngles(arm, 0, 0, 0, 0);
        },
        eout,
      ),
    ),
  );
  await Promise.all(
    MK.arms.map(arm => {
      arm.P = [arm.x, arm.y, 39 + MKL.L1 + MKL.L2];
      return mkArmMove(gen, arm, arm.rest, 600);
    }),
  );
  await Promise.all([printer, fab, crane]);
  if (!mkOK(gen)) return;
  holoFade(1, 900);
  const [a1, a2] = MK.arms,
    [b1, b2] = MK.belts,
    [px0, py0] = MKL.printer,
    [fx0, fy0] = MKL.fab;
  mkPrinterLoop(gen);
  mkFabLoop(gen);
  mkPairLoop(gen);
  mkAsmLoop(gen);
  mkCraneLoop(gen);
  mkArmLoop(
    gen,
    a1,
    b1,
    () => MK.printed,
    () => [px0, py0 + (MK.bedPos || 0), 16],
    (it, ev) => {
      if (ev === "pick") MK.onBed = null;
      else MK.printed = null;
    },
  );
  mkArmLoop(
    gen,
    a2,
    b2,
    () => MK.boardOut,
    () => [fx0, fy0 + 30, 18],
    (it, ev) => {
      if (ev === "pick") {
        MK.items.appendChild(it.g);
        mkPlace(it, fx0, fy0 + 30, 18);
      } else MK.boardOut = null;
    },
  );
}
/* Exit in two phases. Phase 1 (in view, the cube waits for it): arms glide back to standing straight,
   the machines go home, loose parts and the rocket fade, the hologram collapses. Phase 2 (during the
   roll): everything sinks back into the cube and the hatches close. Returns once phase 1 is done. */
function makClose() {
  if (!MK.open) return Promise.resolve();
  MK.open = false;
  const gen = ++MK.gen;
  holoFade(0, 450);
  const leftovers = [
    ...MK.items.children,
    ...MK.rocket.children,
    ...[...MK.fbed.children].filter(n => !n.classList.contains("box")),
  ];
  leftovers.forEach(n => {
    n.style.transition = "opacity .3s";
    n.style.opacity = 0;
  });
  setTimeout(() => leftovers.forEach(n => n.remove()), 330);
  MK.onBed = MK.printed = MK.boardOut = null;
  MK.stack = [];
  MK.st = {};
  MK.burn = 0;
  MK.count = null;
  MK.fabTool = null;
  MK.cr.hold = null;
  MK.fx.length = MK.sparks.length = 0;
  MK.arms.forEach(arm => {
    arm.hold = null;
    mkGrip(arm, false);
  });
  MK.belts.forEach(b => {
    b.run(false);
    b.wait = null;
  });
  Object.values(MK.shutters).forEach(e => e.classList.remove("open"));
  Object.values(MK.lamps).forEach(l => l.classList.remove("on"));
  MK.asmGear.classList.remove("spin");
  MK.padLights.forEach(l => l.classList.remove("on"));
  const home = { z: 110, x: 0, y: 0 },
    from = MK.pose || home,
    f0 = { ...MK.fpose },
    C = MK.cr,
    c0 = [C.th, C.r, C.z];
  const lift0 = MK.lift.style.transform;
  const phase1 = Promise.all([
    ...MK.arms.map(arm => {
      const a0 = arm.ang || [0, 0, 0, 0];
      return mkAnim(gen, 550, t => mkArmAngles(arm, ...a0.map(v => v * (1 - t))));
    }),
    mkAnim(gen, 550, t =>
      mkSetPose({
        z: from.z + (home.z - from.z) * t,
        x: from.x + (home.x - from.x) * t,
        y: from.y + (home.y - from.y) * t,
      }),
    ),
    mkAnim(gen, 550, t => mkFabPose({ x: f0.x * (1 - t), y: f0.y + (-14 - f0.y) * t, d: f0.d * (1 - t) })),
    mkAnim(gen, 550, t => {
      mkCraneSet(c0[0] + (-0.6 - c0[0]) * t, c0[1] + (40 - c0[1]) * t, c0[2] + (MKL.jib - 20 - c0[2]) * t);
      mkRocketZ(MK.rz * (1 - t));
    }),
  ]);
  phase1.then(async () => {
    if (!mkOK(gen)) return;
    MK.pose = null;
    MK.lift.style.transform = `translateZ(${MKL.asmH - 40}px)`;
    mkDoors(MK.asmDoors, false);
    mkRocketZ(0);
    MK.arms.forEach(arm => mkAnim(gen, 500, t => (arm.ar.style.transform = `translateZ(${(-160 * t).toFixed(1)}px)`)));
    MK.belts.forEach(b =>
      mkAnim(
        gen,
        500,
        t =>
          (b.g.style.transform = `translateZ(${(-14 * t).toFixed(1)}px) scale3d(${b.axis === "x" ? Math.max(0.01, 1 - t).toFixed(3) : 1},${b.axis === "y" ? Math.max(0.01, 1 - t).toFixed(3) : 1},1)`),
      ),
    );
    mkAnim(gen, 400, t => mkCraneFold(t)).then(() =>
      mkAnim(gen, 600, t => (MK.crG.style.transform = `translateZ(${(-176 * t).toFixed(1)}px)`)),
    );
    mkAnim(gen, 600, t => {
      MK.asmG.style.transform = `translateZ(${(-(MKL.asmH + 8) * t).toFixed(1)}px)`;
      MK.fab.style.transform = `translateZ(${(-80 * t).toFixed(1)}px)`;
    });
    await mkAnim(gen, 700, t => (MK.pr.style.transform = `translateZ(${(-170 * t).toFixed(1)}px)`));
    if (mkOK(gen)) Object.values(MK.hatch).forEach(ds => mkDoors(ds, false));
  });
  return phase1;
}

/* ---------------- overlays: the hologram, and the factory's light (laser, sparks, flame, smoke) ---------------- */
/* stage point → screen (world) coordinates: stage turned 270° and scaled ×1.25 on the back face */
function mkProject(M, sx, sy, sz) {
  const dx = sx - 280,
    dy = sy - 280,
    fx = 280 + 1.25 * dy,
    fy = 280 - 1.25 * dx,
    fz = 1.25 * sz;
  const w = rx(ry(mv(M, [-(fx - 280), fy - 280, -(280.5 + fz)]), YAW), ISO);
  return [600 + w[0], 634 + w[1], w[2]];
}
/* the hologram boots up out of the lens and collapses back into it */
function holoFade(to, dur) {
  const from = MK.holoOn || 0,
    t0 = performance.now();
  cancelAnimationFrame(MK.hf);
  const step = now => {
    const t = Math.min(1, (now - t0) / dur);
    MK.holoOn = from + (to - from) * (to > from ? eout(t) : t * t);
    if (t < 1) MK.hf = requestAnimationFrame(step);
  };
  MK.hf = requestAnimationFrame(step);
  if (!MK.holoRAF) MK.holoRAF = requestAnimationFrame(holoTick);
}
function holoTick(now) {
  const ctx = MK.holoCtx,
    oc = MK.ovCtx,
    dpr = MK.holoDpr,
    t = now / 1000,
    dt = Math.min(0.05, (now - (MK.tPrev || now)) / 1000);
  MK.tPrev = now;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, MK.holoCv.width, MK.holoCv.height);
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.clearRect(0, 0, MK.ov.width, MK.ov.height);
  if (!MK.open && (MK.holoOn || 0) <= 0.001 && !MK.fx.length) {
    MK.holoRAF = 0;
    MK.tPrev = 0;
    return;
  }
  MK.holoRAF = requestAnimationFrame(holoTick);
  const M = qMat(Q),
    vis = rx(ry(mv(M, [0, 0, -1]), YAW), ISO)[2] > 0.02;
  if (!vis || (ROLL.active && !ROLL.keep.has("back"))) return;
  oc.setTransform(dpr, 0, 0, dpr, -150 * dpr, 0);
  mkDrawFx(oc, M, t, dt);
  const fade = Math.min(1, MK.holoOn || 0);
  if (fade <= 0) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mkDrawHolo(ctx, M, t, fade);
}
/* laser and sparks at the PCB fab, then the rocket's flame and its smoke */
function mkDrawFx(ctx, M, t, dt) {
  const P = (x, y, z) => mkProject(M, x, y, z),
    FX = MK.fx;
  if (MK.fabTool && MK.fabTip && !reduce) {
    const [x, y, z] = MK.fabTip,
      a = P(x, y, z),
      b = P(x, y, 20);
    if (MK.fabTool === "laser") {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(127,243,255,.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      const g = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], 9);
      g.addColorStop(0, "rgba(230,255,255,.95)");
      g.addColorStop(1, "rgba(127,243,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b[0], b[1], 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else
      for (let k = 0; k < 2; k++) {
        const an = Math.random() * Math.PI * 2,
          v = 30 + Math.random() * 60;
        MK.sparks.push({
          p: [x, y, z],
          v: [Math.cos(an) * v, Math.sin(an) * v, 50 + Math.random() * 80],
          life: 0,
          max: 0.2 + Math.random() * 0.3,
        });
      }
    if (MK.fabTool === "iron") {
      const g = ctx.createRadialGradient(a[0], a[1], 0, a[0], a[1], 13);
      g.addColorStop(0, "rgba(255,240,200,.9)");
      g.addColorStop(0.3, "rgba(255,181,71,.5)");
      g.addColorStop(1, "rgba(255,181,71,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(a[0], a[1], 13, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.lineCap = "round";
  ctx.lineWidth = 1.3;
  for (let i = MK.sparks.length - 1; i >= 0; i--) {
    const s = MK.sparks[i];
    s.life += dt;
    if (s.life > s.max) {
      MK.sparks.splice(i, 1);
      continue;
    }
    const a = P(...s.p);
    s.v[2] -= 420 * dt;
    for (let j = 0; j < 3; j++) s.p[j] += s.v[j] * dt;
    const b = P(...s.p),
      u = s.life / s.max;
    ctx.strokeStyle = `rgba(255,${Math.round(235 - 90 * u)},${Math.round(190 - 150 * u)},${(1 - u).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  // smoke: billows out over the pad at ignition, then a trail behind the rocket
  const [pdx, pdy] = MKL.pad,
    nz = MKL.padH + (MK.rz || 0);
  if (MK.burn && !reduce) {
    // puffs per second (not per frame, so the cloud is the same at any frame rate)
    const ground = (MK.rz || 0) < 40;
    MK.puff = (MK.puff || 0) + dt * (ground ? 34 : 20);
    for (; MK.puff >= 1; MK.puff--) {
      if (FX.length > 70) continue;
      const an = Math.random() * Math.PI * 2,
        sp = ground ? 35 + Math.random() * 45 : 4 + Math.random() * 8;
      FX.push({
        p: [pdx + (Math.random() - 0.5) * 6, pdy + (Math.random() - 0.5) * 6, ground ? MKL.padH + 2 : nz - 6],
        v: [Math.cos(an) * sp, Math.sin(an) * sp, ground ? 4 + Math.random() * 10 : -8 - Math.random() * 10],
        r: ground ? 4 : 3,
        g: ground ? 11 : 7,
        life: 0,
        max: ground ? 1.5 + Math.random() * 0.8 : 1 + Math.random() * 0.6,
      });
    }
  }
  for (let i = FX.length - 1; i >= 0; i--) {
    const s = FX[i];
    s.life += dt;
    if (s.life > s.max) {
      FX.splice(i, 1);
      continue;
    }
    const damp = Math.pow(0.25, dt);
    s.v[0] *= damp;
    s.v[1] *= damp;
    s.v[2] = s.v[2] * damp + 6 * dt;
    for (let j = 0; j < 3; j++) s.p[j] += s.v[j] * dt;
    s.r += s.g * dt;
  }
  FX.slice()
    .sort((a, b) => a.p[0] + a.p[1] - b.p[0] - b.p[1])
    .forEach(s => {
      const q = P(...s.p),
        u = s.life / s.max,
        r = s.r * 1.25,
        a = (u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88) * 0.42;
      const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
      g.addColorStop(0, `rgba(226,222,255,${a.toFixed(3)})`);
      g.addColorStop(0.6, `rgba(180,172,232,${(a * 0.55).toFixed(3)})`);
      g.addColorStop(1, "rgba(160,150,220,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
      ctx.fill();
    });
  if (MK.burn) {
    const n = P(pdx, pdy, nz),
      flick = 0.85 + 0.3 * Math.random(),
      L = ((MK.rz || 0) > 4 ? 64 : 34) * flick,
      W = 9 * flick;
    ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createRadialGradient(n[0], n[1], 0, n[0], n[1], 70);
    gl.addColorStop(0, "rgba(255,190,90,.55)");
    gl.addColorStop(1, "rgba(255,120,60,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(n[0], n[1], 70, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(n[0], n[1], n[0], n[1] + L);
    g.addColorStop(0, "rgba(255,255,240,1)");
    g.addColorStop(0.25, "rgba(255,214,120,.95)");
    g.addColorStop(0.6, "rgba(255,111,80,.6)");
    g.addColorStop(1, "rgba(255,80,160,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(n[0] - W, n[1]);
    ctx.quadraticCurveTo(n[0] - W * 0.7, n[1] + L * 0.5, n[0], n[1] + L);
    ctx.quadraticCurveTo(n[0] + W * 0.7, n[1] + L * 0.5, n[0] + W, n[1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
}
/* the rocket's blueprint: one wireframe per section, lit by how far it has got */
function mkDrawHolo(ctx, M, t, fade) {
  const [HX, HY] = MKL.holo,
    base = mkProject(M, HX, HY, 16);
  MK.holoCv.style.transform = `translate(${(base[0] - 150).toFixed(1)}px,${(base[1] - 230).toFixed(1)}px)`;
  ctx.translate(150 - base[0], 230 - base[1]);
  const r = MK.launchR || (MK.stack.length === MK_SECS.length ? MK.done : MK.done + 1),
    sts = MK_SECS.map((_, k) => mkSt(r, k)); // a finished rocket stays on show until it leaves
  const grow = fade,
    S = 0.95 * (0.25 + 0.75 * grow),
    z0 = 20 + 18 * grow,
    yaw = t * 0.6,
    cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const glitch = fade < 1 ? (Math.random() < 0.35 ? 0.3 + Math.random() * 0.7 : 1) : 1,
    flick = (0.82 + 0.18 * Math.sin(t * 37) * Math.sin(t * 11)) * glitch;
  const P = (x, y, z) => mkProject(M, HX + S * (x * cy - y * sy), HY + S * (x * sy + y * cy), z0 + S * z);
  ctx.globalAlpha = fade * flick;
  ctx.globalCompositeOperation = "lighter";
  // projection cone
  const top = mkProject(M, HX, HY, z0 + S * 98),
    l = mkProject(M, HX - 30 * grow, HY, z0),
    rr = mkProject(M, HX + 30 * grow, HY, z0);
  const cg = ctx.createLinearGradient(base[0], base[1], top[0], top[1]);
  cg.addColorStop(0, "rgba(127,243,255,.32)");
  cg.addColorStop(1, "rgba(127,243,255,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(base[0], base[1]);
  ctx.lineTo(l[0], l[1] - 50);
  ctx.lineTo(rr[0], rr[1] - 50);
  ctx.closePath();
  ctx.fill();
  const line = (pts, col, w = 1.2) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.stroke();
  };
  const ring = (rad, z, col, w) =>
    line(
      Array.from({ length: 25 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return P(rad * Math.cos(a), rad * Math.sin(a), z);
      }),
      col,
      w,
    );
  const DIM = "rgba(127,243,255,.2)",
    LIT = "rgba(127,243,255,.95)",
    DONE = "rgba(220,252,255,1)",
    PCBC = "rgba(255,143,217,.95)";
  let zb = 0;
  MK_SECS.forEach((S0, k) => {
    const s = sts[k],
      z1 = zb + S0.h,
      cut = s.s === 1 ? zb + s.p * S0.h : s.s >= 2 ? z1 : zb;
    const col = z => (s.s >= 4 ? DONE : z <= cut + 0.01 ? LIT : DIM);
    const silhouette = (rad0, rad1, za, zc) =>
      [0, 1, 2, 3].forEach(i => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        line([P(rad0 * Math.cos(a), rad0 * Math.sin(a), za), P(rad1 * Math.cos(a), rad1 * Math.sin(a), zc)], col(zc));
      });
    if (k === 0) {
      ring(6, zb, col(zb));
      ring(13, zb + 6, col(zb + 6));
      ring(13, z1, col(z1));
      silhouette(13, 13, zb + 6, z1);
      [0, 1, 2, 3].forEach(i => {
        const a = (i * Math.PI) / 2,
          c = Math.cos(a),
          sn = Math.sin(a);
        line(
          [
            P(11 * c, 11 * sn, zb),
            P(21 * c, 21 * sn, zb),
            P(21 * c, 21 * sn, zb + 15),
            P(16 * c, 16 * sn, zb + 22),
            P(11 * c, 11 * sn, zb + 22),
          ],
          col(zb + 15),
        );
      });
    } else if (k === 1) {
      ring(13, zb, col(zb));
      ring(13, zb + 15, col(zb + 15));
      ring(13, z1, col(z1));
      silhouette(13, 13, zb, z1);
    } else {
      ring(13, zb, col(zb));
      ring(13, zb + 8, col(zb + 8));
      ring(8, zb + 20, col(zb + 20));
      silhouette(13, 13, zb, zb + 8);
      silhouette(13, 0, zb + 8, z1);
    }
    if (s.s === 1)
      ring(k === 2 && cut > zb + 8 ? 13 * (1 - (cut - zb - 8) / 24) : 13, cut, "rgba(255,181,71,.95)", 1.6);
    if (s.s >= 3) ring(14.5, zb + (k === 0 ? 21 : k === 1 ? 9 : 4), PCBC, 1.6);
    zb = z1;
  });
  // labels
  const tl = P(0, 0, 104);
  ctx.globalCompositeOperation = "source-over";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(127,243,255,.95)";
  ctx.font = "9px 'Share Tech Mono', monospace";
  ctx.fillText(`ROCKET ${String(r).padStart(2, "0")}`, tl[0], tl[1] - 22);
  const busy = sts.findIndex(s => s.s === 1),
    pk = sts.findIndex(s => s.pcb && s.pcb !== "IN" && s.pcb !== "READY");
  const l1 =
    MK.count != null
      ? MK.count
        ? `T-${MK.count}`
        : "LIFTOFF"
      : busy >= 0
        ? `PRINT ${MK_SECS[busy].id} ${Math.round(sts[busy].p * 100)}%`
        : sts.every(s => s.s >= 4)
          ? "READY"
          : "ASSEMBLY";
  const l2 = MK.count != null ? "" : pk >= 0 ? `PCB ${MK_SECS[pk].pcb} · ${sts[pk].pcb}` : "";
  ctx.font = (MK.count != null ? "13px" : "8px") + " 'Share Tech Mono', monospace";
  ctx.fillStyle = MK.count != null ? "#ffd6f4" : "rgba(127,243,255,.85)";
  ctx.fillText(l1, tl[0], tl[1] - 10);
  if (l2) {
    ctx.font = "8px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(255,179,239,.85)";
    ctx.fillText(l2, tl[0], tl[1]);
  }
  ctx.textAlign = "start";
  ctx.globalAlpha = fade * 0.12;
  ctx.fillStyle = "#7ff3ff";
  for (let yy = -120 + ((t * 40) % 6); yy < 10; yy += 6) ctx.fillRect(base[0] - 60, base[1] + yy, 120, 1);
  if (fade < 1) {
    // boot / shutdown glitch bands
    ctx.globalAlpha = (1 - fade) * 0.8;
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 3; k++) {
      const yy = base[1] - Math.random() * 110 * grow,
        w = 30 + Math.random() * 80;
      ctx.fillRect(base[0] - w / 2 + (Math.random() - 0.5) * 20, yy, w, 1.5);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
