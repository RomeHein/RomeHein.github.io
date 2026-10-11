/* =====================================================================
   MECHANICAL RABBIT — the maker face's hidden game, played from a
   control desk either side of the hologram. On the printer's console,
   MODEL goes through the printer's catalogue and PRINT prints the model
   on show. Three models are the parts of a robot rabbit: the crane
   stacks them on the launch pad, legs first, and once whole the rabbit
   takes power from the generator by the pad and wakes up. It is driven
   from its own console (a joystick and a space bar; the arrow keys and
   Space work too). It wants the carrot, which comes out on top of the
   assembly machine and stays there: it isn't magnetic, so the crane
   can't lift it off (on its way there, fences go up along its belt so
   that nobody gets it early). It waits on the machine's lift until the
   next part needs the lift, then sinks back into the machine, so it has
   to be printed last. To climb up there, the rabbit needs steps: a cube
   and a taller block, which the crane sets down wherever the visitor
   clicks (click one to move it). Once it has its carrot, the hologram
   goes out and the nixie tubes on the rabbit's console light up.
   All coordinates are in the stage frame (see maker.js).
   ===================================================================== */
const MR_WORD = "IBM"; // what the nixie tubes spell once the rabbit has its carrot
/* the printer's catalogue, in the order the MODEL button goes through it */
const MR_MODELS = [
  { id: "rocket", name: "ROCKET" },
  { id: "carrot", name: "CARROT", kind: "carrot", h: 27.6 },
  { id: "head", name: "RABBIT · HEAD", kind: "rb", k: 2, pcb: "SENSORS" },
  { id: "cube", name: "CUBE", kind: "blk", h: 22 },
  { id: "legs", name: "RABBIT · LEGS", kind: "rb", k: 0, pcb: "SERVOS" },
  { id: "block", name: "TALL BLOCK", kind: "blk", h: 40 },
  { id: "body", name: "RABBIT · BODY", kind: "rb", k: 1, pcb: "MAIN CPU" },
];
/* the rabbit, bottom to top, as boxes [x0, y0, z0, x1, y1, z1, class] in each part's own frame (x towards the
   nose, z up); h is where the next part sits. The LEDs light up once the part has its board, the eyes too. */
const MR_RB = [
  {
    name: "LEGS",
    h: 8,
    boxes: [
      [-11, -10, 0, -1, -5, 8, "mk-hull"], // haunches
      [-11, 5, 0, -1, 10, 8, "mk-hull"],
      [-1, -10, 0, 4, -5.5, 2.5, "mk-trim"], // hind feet
      [-1, 5.5, 0, 4, 10, 2.5, "mk-trim"],
      [-10, -4.8, 1, 4, 4.8, 7, "mk-dark"], // the chassis between them
      [4, -5, 2.5, 8, -1.5, 8, "mk-hull"], // front legs on pink paws
      [4, 1.5, 2.5, 8, 5, 8, "mk-hull"],
      [4, -5.5, 0, 9, -1, 2.5, "mk-trim"],
      [4, 1, 0, 9, 5.5, 2.5, "mk-trim"],
    ],
    leds: [[4, -0.9, 3.5, 4.6, 0.9, 5.3]],
  },
  {
    name: "BODY",
    h: 13,
    boxes: [
      [-9, -8, 0, 8, 8, 12, "mk-hull"], // torso
      [-8, -7, 12, 7, 7, 13, "mk-hull"],
      [8, -4, 2, 9, 4, 10, "mk-trim"], // chest plate
      [-12, -2.5, 4, -9, 2.5, 9, "mr-tail"],
    ],
    leds: [[9, -1, 5, 9.5, 1, 7]],
  },
  {
    name: "HEAD",
    h: 25,
    boxes: [
      [-4, -5, 0, 4, 5, 1.5, "mk-dark"], // neck
      [-3, -6, 1.5, 9, 6, 11.5, "mk-hull"], // head
      [9, -3, 2.5, 11, 3, 7, "mk-hull"], // snout
      [11, -1.2, 5.5, 11.8, 1.2, 7, "mk-trim"], // nose
    ],
    leds: [
      [9, 1.8, 7.6, 9.6, 4.2, 10], // the eyes
      [9, -4.2, 7.6, 9.6, -1.8, 10],
    ],
    ears: [-1, 3.6, 11.5], // where the ears stand (mirrored across), leaning back and out
  },
];
const MR_EAR = [
  [-1.5, -2, 0, 1.5, 2, 13, "mk-hull"],
  [1.5, -1.2, 2.5, 2.1, 1.2, 11.5, "mk-trim"],
];
/* the rabbit's moves: footprint radius, speed, gravity, take-off speed (a 25.5 high jump), and the highest step
   it walks up without jumping. The jump is tuned to the steps: the cube from the floor, the block from the cube,
   the machine's top from the block, and nothing higher (the belts are too low to reach the block from) */
const MR_PHYS = { r: 8, speed: 90, g: 900, v0: 214, step: 2 };
/* the control desk: two consoles either side of the hologram projector, square with the board like the machines.
   The printer's, on the left, faces +x: the model on show and how far its print has got, MODEL and PRINT. The
   rabbit's, on the right, faces +y: its status, a joystick and a space bar, and the nixie tubes on a shelf at its
   back. Each console has an instrument panel sloping down to a flat ledge (in its own frame: x along the console,
   from the operator's left; y towards the operator; z up). Copper on the board wires each one to its machines. */
const MR_DESK = { w: 84, D: 56, hB: 40, hL: 17, ds: 28 }; // length, depth, back and ledge heights, how far back the slope runs
const MR_SHELF = { d: 24, h: 44 }; // the tubes' shelf, behind the rabbit's console
const MR_AMBER = "#ffb547", // the consoles' lettering (the face's own colours)
  MR_PINK = "#ffb3ef";
// each console's back-left corner on the board, and how far it is turned (the printer's runs along −y)
const MR_CONS = { printer: [288, 480, -90], rabbit: [396, 288, 0] };
/* the generator by the launch pad: a dynamo lying on a plinth, its flywheel at the front, and the coil it charges (a
   little Tesla coil); three traces run from under the coil into the pad (they light up while the rabbit runs on them) */
const MR_GEN = { x: 64, y: 168, w: 64, d: 60, dyn: 80, coil: [114, 186] }; // the plinth; the dynamo's axis (x); the coil
const MR_WIRES_X = [100, 110, 120];
/* a console's footprint on the board, from y0 (its back, or its shelf's) to its front: [x0, y0, x1, y1] */
function mrConsRect([gx, gy, turn], y0 = 0) {
  const { w, D } = MR_DESK;
  return turn ? [gx + y0, gy - w, gx + D, gy] : [gx, gy + y0, gx + w, gy + D];
}
/* what the rabbit can't walk through, or can stand on: [x0, y0, x1, y1, top] */
const MR_FIXED = [
  [169, 169, 241, 241, 56], // assembly machine: the carrot waits on its top
  [65, 65, 125, 125, 6], // launch pad
  [188, 84, 212, 108, 150], // crane
  [67, 350, 183, 480, 140], // printer (its bed slides out towards the arm)
  [354, 73, 466, 177, 70], // PCB fab
  [189, 437, 231, 479, 150], // robot arms
  [437, 189, 479, 231, 150],
  [241, 189, 382, 221, 12], // the PCB fab's belt (the printer's is apart: it can be fenced in)
  [382, 382, 418, 418, 16], // hologram projector
  [...mrConsRect(MR_CONS.printer), MR_DESK.hB], // the consoles, too high to climb
  [...mrConsRect(MR_CONS.rabbit, -MR_SHELF.d), MR_SHELF.h],
  [MR_GEN.x, MR_GEN.y, MR_GEN.x + MR_GEN.w, MR_GEN.y + MR_GEN.d, 44], // the generator (its coil's toroid on top)
  [323, 483, 341, 501, 19], // a filter capacitor by each console
  [483, 323, 501, 341, 19],
];
const MR_BELT = [189, 241, 221, 382, 12], // the printer's belt…
  MR_FENCED = [184, 241, 226, 387, 40]; // …while its fences are up
const MR_REACH = [26, 116]; // how close to its mast, and how far, the crane can set a block down
const MR = {
  sel: 0, // the model on show (the one PRINT prints)
  rbNext: 0, // the next part of the rabbit the printer accepts (they go on the pad from the bottom up)
  rbSt: [],
  pad: null, // what the launch pad is kept for: "rocket" or "rabbit"
  blocks: [], // blocks set down on the face: { it, x, y }
  queued: 0, // blocks printed so far
  carrot: null, // the carrot, while it sits on the assembly machine
  rb: null, // the rabbit, once it is alive
  keys: { l: 0, r: 0, u: 0, d: 0 },
  stick: null, // the joystick, while someone holds it: a direction on screen (x right, y down), 0…1 long
  fence: false, // the printer's belt is fenced in
  placing: null, // the block the crane is holding, waiting for a spot
  aim: null,
  drop: null,
  req: null, // a block the visitor wants moved
  zone: null, // where a block is coming down (nothing may step in)
  msg: null,
  last: {}, // the latest job of each model, for the hologram
  lit: {}, // which machines' copper is lit (see mrDeskTick)
  coilZ: 0, // when the generator started charging the coil (streamers off its toroid, on the overlay)
  zap: 0, // when the rabbit started taking power (the arcs at the pad)
  holoOff: false, // the hologram went out when the rabbit got its carrot
  winT: 0,
  solved: false,
  touched: false, // the visitor has pressed one of the buttons (they stop glowing)
};

/* ---------------- the control desk, the generator, the fences, the drop marker ---------------- */
/* a console: back wall, a front wall the height of the ledge, sides cut to the profile, the sloping panel and the
   ledge (the sides are box sides, so they take the light like everything else) */
function mrDesk(st, [gx, gy, turn]) {
  const { w, D, hB, hL, ds } = MR_DESK,
    g = mkG(st, gx, gy, turn ? `rotateZ(${turn}deg)` : ""),
    r = div("box mr-desk", g, { left: 0, top: 0, width: px(w), height: px(D) }),
    a = Math.atan2(hB - hL, ds);
  g.style.setProperty("--R", 270 + turn + "deg");
  div("bx-s bx-back", r, { left: 0, top: 0, width: px(w), height: px(hB) });
  const front = div("bx-s bx-front", r, { left: 0, top: px(D - hL), width: px(w), height: px(hL) });
  div("bx-s bx-left", r, {
    left: 0,
    top: 0,
    width: px(hB),
    height: px(D),
    clipPath: `polygon(0 0,100% 0,${hL}px ${ds}px,${hL}px 100%,0 100%)`,
  });
  div("bx-s bx-right", r, {
    left: px(w - hB),
    top: 0,
    width: px(hB),
    height: px(D),
    clipPath: `polygon(0 0,100% 0,100% 100%,${hB - hL}px 100%,${hB - hL}px ${ds}px)`,
  });
  const slope = div("bx-top mr-slope", r, {
    width: px(w),
    height: px(Math.hypot(ds, hB - hL)),
    transformOrigin: "50% 0",
    transform: `translateZ(${hB}px) rotateX(${((-a * 180) / Math.PI).toFixed(2)}deg)`,
  });
  const ledge = div("bx-top mr-ledge", r, {
    top: px(ds),
    width: px(w),
    height: px(D - ds),
    transform: `translateZ(${hL}px)`,
  });
  return { r, slope, ledge, front };
}
/* a cylinder lying along its group's x axis, from x0 to x1, its axis zc above the board: a body turned to face the
   camera (see .lc-body) and its two end discs */
function mrLying(p, x0, x1, dia, zc, cls) {
  const at = (el, ry) => {
    el.style.setProperty("--zc", px(zc));
    if (ry) el.style.setProperty("--ry", ry);
    return el;
  };
  const body = at(div("lc-body " + cls, p, { left: px(x0), top: px(-dia / 2), width: px(x1 - x0), height: px(dia) }));
  const caps = [x0, x1].map((x, i) =>
    at(
      div("lc-cap " + cls, p, { left: px(x - dia / 2), top: px(-dia / 2), width: px(dia), height: px(dia) }),
      i ? "90deg" : "-90deg",
    ),
  );
  return { body, caps };
}
function mrBuild(st) {
  const { w, D, hL, ds } = MR_DESK,
    ly = ds + (D - ds) / 2; // the middle of a ledge
  // a name printed on a console in the face's own lettering (see nameOnFace), centred on x; a pilot lamp with its
  // legend under it
  const label = (el, x, y, lw, lh, txt, color) =>
    nameOnFace(
      div("mr-label", el, { left: px(x - lw / 2), top: px(y), width: px(lw), height: px(lh) }),
      txt,
      color,
      lw,
      9.5,
    );
  const pilot = (el, x, y, txt, cls = "") => {
    div("mr-legend", el, { left: px(x - 18), top: px(y + 9), width: "36px" }).textContent = txt;
    return div("mr-pilot " + cls, el, { left: px(x - 4), top: px(y) });
  };

  // the printer's console: the model on show and how far its print has got; MODEL and PRINT
  const P = mrDesk(st, MR_CONS.printer);
  label(P.slope, w / 2, 2, 54, 12, "PRINTER", MR_AMBER);
  MR.vfd = swFit(
    div("", div("mr-vfd", P.slope, { left: "6px", top: "16px", width: px(w - 12), height: "11px" })),
    MR_MODELS[0].name,
    w - 20,
    7.5,
    { fam: SW_MONO, wt: 400, ls: 0.08 },
  );
  MR.bar = div("", div("mr-bar", P.slope, { left: "6px", top: "30.5px", width: px(w - 12), height: "3px" }));
  const btn = (x, cls, title, name, color, fn) => {
    cyl(P.r, x, ly, 21, 1.6, "mr-collar", hL);
    const k = cyl(P.r, x, ly, 16, 4.6, "mk-btn hint " + cls, hL + 1.6);
    k.r.title = title;
    pushButton([k.r], k, 2.2, fn);
    label(P.front, x, 0, 34, hL, name, color);
    return k;
  };
  MR.bNext = btn(w * 0.25, "next", "Next model", "MODEL", MR_AMBER, mrNext);
  MR.bGo = btn(w * 0.75, "go", "Print it", "PRINT", MR_PINK, mrPrint);

  // the rabbit's console: STANDBY / ONLINE; a joystick on its plate, a space bar
  const B = mrDesk(st, MR_CONS.rabbit),
    jx = w * 0.25,
    sx = w * 0.72;
  label(B.slope, w / 2, 2, 54, 12, "RABBIT", MR_PINK);
  MR.lampOff = pilot(B.slope, w * 0.25, 16, "STANDBY", "on");
  MR.lampOn = pilot(B.slope, w * 0.75, 16, "ONLINE", "green");
  const jp = box(B.r, jx - 11, ly - 11, 22, 22, 1.6, "mr-joy-plate", hL);
  [
    [1.4, 1.4],
    [17.2, 1.4],
    [1.4, 17.2],
    [17.2, 17.2],
  ].forEach(
    ([x, y]) => (div("screw", jp.t, { left: px(x), top: px(y), width: "3.4px", height: "3.4px" }).innerHTML = SCREW),
  );
  MR.joyBase = cyl(B.r, jx, ly, 14, 2.6, "mr-joy-boot mr-joy", hL + 1.6);
  MR.tilt = mkG(mkG(B.r, jx, ly, `translateZ(${hL + 4.2}px)`));
  const shaft = cyl(MR.tilt, 0, 0, 2.8, 12, "mr-joy-shaft mr-joy", 0, { noTop: true });
  div("mr-ball mr-joy", shaft.r, { left: "-5.1px", top: "-5.1px", width: "13px", height: "13px" });
  box(B.r, sx - 15, ly - 8, 30, 16, 2, "rb-sw", hL);
  const sp = box(B.r, sx - 14, ly - 7, 28, 14, 3.6, "rb-cap sp", hL + 2);
  sp.t.textContent = "SPACE";
  MR.space = sp.r;
  label(B.front, jx, 0, 34, hL, "MOVE", MR_PINK);
  label(B.front, sx, 0, 34, hL, "JUMP", MR_PINK);
  // fingers get bigger targets: each half of the ledge works its own control
  const hitJ = div("mr-hit", B.ledge, { left: "0", top: "0", width: px(w / 2), height: px(D - ds) }),
    hitS = div("mr-hit", B.ledge, { left: px(w / 2), top: "0", width: px(w / 2), height: px(D - ds) });
  [...B.r.querySelectorAll(".mr-joy"), hitJ].forEach(el => el.addEventListener("pointerdown", mrJoyDown));
  [MR.space, hitS].forEach(el => {
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0 || !mrActive()) return;
      e.stopPropagation();
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      mrJump(true);
    });
    ["pointerup", "pointercancel"].forEach(ev => el.addEventListener(ev, () => mrJump(false)));
  });
  // the nixie tubes, on a shelf at the back of the rabbit's console
  const { d: sd, h: sh } = MR_SHELF,
    shelf = box(B.r, 0, -sd, w, sd, sh, "mr-desk mr-shelf");
  MR.nixHalo = div("mr-nx-halo", shelf.t);
  MR.nixAt = [];
  MR.nixZ = sh + 3 + MR_TUBE.glyph / MR_CE; // the letters' centre, for the blackout
  MR.nix = [...MR_WORD].map((ch, i) => {
    const x = w / 2 + (i - 1) * MR_TUBE.gap;
    MR.nixAt.push([MR_CONS.rabbit[0] + x, MR_CONS.rabbit[1] - sd / 2]);
    cyl(B.r, x, -sd / 2, 2 * MR_TUBE.r + 4, 3, "nx-sock", sh);
    return mrTube(B.r, x, -sd / 2, sh + 3.2, ch, i);
  });

  // the generator by the pad: a plinth, a dynamo lying along y with its flywheel at the front, the coil it charges
  const G = MR_GEN,
    gen = (MR.gen = mkG(st, G.x, G.y)),
    zc = 17; // the dynamo's axis, above the board
  gen.classList.add("mr-gen");
  const base = box(gen, 0, 0, G.w, G.d, 4, "mr-gen-base");
  base.t.innerHTML = '<svg viewBox="0 0 10 16"><path d="M6.4 0 1 9h3.6L3.4 16 9 6.6H5.4Z"/></svg>';
  const dy = mkG(gen, G.dyn - G.x, 0, "rotateZ(90deg)"); // its x runs along the board's +y
  dy.style.setProperty("--R", "0deg");
  [15, 35].forEach(x => box(dy, x, -9, 6, 18, 3, "mr-gen-foot", 4)); // cradle feet
  mrLying(dy, 12, 44, 22, zc, "mr-dyn");
  box(dy, 23, -5, 10, 10, 4, "mr-gen-tb", zc + 10); // terminal box
  mrLying(dy, 44, 50, 5, zc, "mr-shaft");
  MR.fly = div("mr-spokes", mrLying(dy, 50, 54, 26, zc, "mr-fly").caps[1]);
  const [cx, cy] = [G.coil[0] - G.x, G.coil[1] - G.y];
  [cy - 4, cy + 4].forEach(y =>
    box(gen, G.dyn - G.x + 9, y - 1.5, cx - 12 - (G.dyn - G.x + 9), 3, 1.2, "mr-busbar", 4),
  );
  MR.coil = mrCoil(gen, cx, cy, 4.2); // copper rings under a steel toroid: a little Tesla coil
  // its traces, from under the coil into the pad (the current runs up them when the rabbit is powered)
  const NS = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 560 560");
  svg.setAttribute("class", "mr-power");
  const d = MR_WIRES_X.map(x => `M${x} ${G.coil[1]} V${MKL.pad[1] + 29}`);
  svg.innerHTML =
    d.map(p => `<path class="fx-tr" d="${p}"/>`).join("") + d.map(p => `<path class="mr-zap" d="${p}"/>`).join("");
  st.insertBefore(svg, st.firstChild);
  MR.power = svg;
  MR.zaps = [...svg.querySelectorAll(".mr-zap")];
  MR.wires = mrWires();

  // fences along the printer's belt, down in slots in the board until the carrot rides it
  const x = MKL.belts[0].at,
    y0 = MKL.asm[1] + 39,
    y1 = MKL.belts[0].from + 16,
    fg = (MR.fences = mkG(st));
  fg.classList.add("mr-fences");
  const fence = (ax, ay, bx, by) => {
    div("mr-slot", st, {
      left: px(Math.min(ax, bx) - 1.2),
      top: px(Math.min(ay, by) - 1.2),
      width: px(Math.abs(bx - ax) + 2.4),
      height: px(Math.abs(by - ay) + 2.4),
    });
    const n = Math.round(Math.hypot(bx - ax, by - ay) / 13);
    for (let i = 0; i <= n; i++)
      box(fg, ax + ((bx - ax) * i) / n - 0.8, ay + ((by - ay) * i) / n - 0.8, 1.6, 1.6, 28, "mr-post");
    [11, 22].forEach(z =>
      ax === bx
        ? box(fg, ax - 0.5, ay, 1, by - ay, 2, "mr-rail", z)
        : box(fg, ax, ay - 0.5, bx - ax, 1, 2, "mr-rail", z),
    );
  };
  fence(x - 19, y0, x - 19, y1);
  fence(x + 19, y0, x + 19, y1);
  fence(x - 19, y1, x + 19, y1);

  MR.ghost = div("mr-ghost", st);
  MR.ghost.hidden = true;
  MR.catch = div("mr-catch", st);
  MR.catch.addEventListener("pointermove", e => mrAim(e.clientX, e.clientY));
  MR.catch.addEventListener("click", e => {
    e.stopPropagation();
    mrAim(e.clientX, e.clientY);
    mrDrop();
  });
}
/* ---------------- round things drawn on cards: the nixie tubes, the generator's coil ---------------- */
/* A card always faces the camera; what is drawn on it is a picture of a round object as the camera sees it (the
   tower's tubes are drawn the same way). It stands on the object's lowest point on screen, the front of its base
   (fwd in front of the axis, toward the camera), and leans back from there to face the camera: so it projects
   exactly where the object stands, and never cuts into what the object stands on. x, y, z: the base's centre. */
const MR_CE = Math.cos(ISO), // the camera's elevation over the face, once it is open: how a height shows on screen…
  MR_SE = Math.sin(-ISO); // …and how flat a level circle looks
function mrCard(parent, x, y, z, W, H, fwd, cls) {
  const c = div("mr-card " + cls, parent, {
    left: px(x - W / 2),
    top: px(y - H),
    width: px(W),
    height: px(H),
    transformOrigin: "50% 100%",
  });
  c.style.transform = `translateZ(${z}px) rotateZ(var(--bb)) translateY(${fwd}px) rotateX(calc(var(--el) - 90deg))`;
  return c;
}
/* a nixie tube standing in its socket: glass with straight sides, the half-ellipse of its base and a round dome
   with its tip; inside, the mesh anode, the dark digits and the letter; a glow inside the glass and around it once
   it is lit (as the tower's) */
const MR_TUBE = { r: 10, len: 30, gap: 26, glyph: 14 }; // radius, length of the straight part, spacing, letter's centre (on the card, above the base)
function mrTube(parent, x, y, z, ch, k) {
  const { r, len, glyph } = MR_TUBE,
    L = len * MR_CE, // the straight sides, as seen
    b = r * MR_SE, // the base: a half-ellipse
    W = 2 * r + 12,
    top = L + r + 6, // from the base's centre up to the top of the card
    H = top + b + 0.5,
    id = "mrnx" + k,
    vb = `viewBox="${-W / 2} ${-top} ${W} ${H}"`,
    side = `M${-r} 0V${-L}A${r} ${r} 0 0 1 ${r} ${-L}V0A${r} ${b} 0 0 1 ${-r} 0`;
  const t = mrCard(parent, x, y, z, W, H, r, "mr-nx");
  t.innerHTML =
    `<svg ${vb}><defs>` +
    `<linearGradient id="${id}f" x1="${-r}" x2="${r}" y1="0" y2="0" gradientUnits="userSpaceOnUse">` +
    '<stop offset="0" stop-color="#ffecdc" stop-opacity=".24"/><stop offset=".3" stop-color="#ffc8a0" stop-opacity=".06"/>' +
    '<stop offset=".62" stop-color="#ffb482" stop-opacity=".05"/><stop offset=".9" stop-color="#ffe2cd" stop-opacity=".2"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>' +
    `<radialGradient id="${id}g" cx="0" cy="${-glyph}" r="${r * 0.95}" gradientUnits="userSpaceOnUse">` +
    '<stop offset="0" stop-color="#ff9a3c" stop-opacity=".34"/><stop offset=".45" stop-color="#ff7a1a" stop-opacity=".14"/>' +
    '<stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>' +
    `<radialGradient id="${id}b" cx="0" cy="${-glyph}" r="${r * 1.7}" gradientUnits="userSpaceOnUse">` +
    '<stop offset="0" stop-color="#ff8a24" stop-opacity=".26"/><stop offset=".5" stop-color="#ff6a10" stop-opacity=".08"/>' +
    '<stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>' +
    `<clipPath id="${id}c"><path d="${side}Z"/></clipPath></defs>` +
    `<circle class="bloom" cx="0" cy="${-glyph}" r="${r * 1.7}" fill="url(#${id}b)"/>` +
    `<path d="${side}Z" fill="url(#${id}f)"/>` +
    `<g clip-path="url(#${id}c)"><rect class="glow" x="${-r}" y="${-L - r}" width="${2 * r}" height="${L + r + b}" fill="url(#${id}g)"/>` +
    `<path d="M${-r} 0A${r} ${b} 0 0 1 ${r} 0" fill="none" stroke="rgba(255,225,205,.3)" stroke-width=".9"/></g></svg>` +
    `<i class="mesh"></i><span class="off">8</span><span class="lit">${ch}</span>` +
    `<svg ${vb}><path d="${side}" fill="none" stroke="rgba(255,226,206,.45)" stroke-width="1"/>` +
    `<path d="M${-r * 0.58} -2.5V${-L + 1}" stroke="rgba(255,255,255,.4)" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M${-r * 0.64} ${-L - r * 0.4}A${r * 0.78} ${r * 0.78} 0 0 1 ${-r * 0.08} ${-L - r * 0.76}" ` +
    'fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.7" stroke-linecap="round"/>' +
    `<path d="M${r * 0.72} ${-L + 2}V-3" stroke="rgba(255,210,180,.16)" stroke-width="1.4" stroke-linecap="round"/>` +
    `<rect x="-2" y="${-L - r - 2.6}" width="4" height="4" rx="1.6" fill="rgba(255,230,210,.4)"/></svg>`;
  // the anode, from under the dome to the base; the letter, around its centre (on the card: the base's centre is at
  // W/2, top)
  Object.assign(t.querySelector(".mesh").style, {
    left: px(W / 2 - r * 0.62),
    top: px(top - L - 1),
    width: px(r * 1.24),
    height: px(L - 1),
  });
  t.querySelectorAll("span").forEach(s => (s.style.top = px(top - glyph - 8.5)));
  return t;
}
/* the generator's coil, a little Tesla coil: copper rings stacked on a foot, a steel toroid on top. Each ring is a
   torus, which the camera sees as an ellipse R + t wide and R·sin(elevation) + t tall about its centre; drawn
   bottom up, each one hides the top of the one under it, its lit front showing as a band */
const MR_TESLA = { foot: [11, 3], ring: [7, 2.5], rings: 5, gap: 3, torus: [9, 3.6] }; // [radius, height or tube radius]
function mrCoil(parent, x, y, z) {
  const { foot, ring, rings, gap, torus } = MR_TESLA,
    [fr, fh] = foot,
    [R, t] = ring,
    [TR, Tt] = torus,
    hT = fh + 2 * t * rings + gap + Tt, // the toroid's centre, above the foot's base
    W = 2 * (TR + Tt) + 10,
    top = hT * MR_CE + TR * MR_SE + Tt + 5,
    H = top + fr * MR_SE + 0.5,
    e = (h, rx, ry, cls) =>
      `<ellipse class="${cls}" cx="0" cy="${(-h * MR_CE).toFixed(2)}" rx="${rx}" ry="${ry.toFixed(2)}"/>`;
  let s =
    `<svg viewBox="${-W / 2} ${-top} ${W} ${H}"><defs>` +
    '<linearGradient id="mrcu" x1="0" x2="0" y1="0" y2="1">' +
    '<stop offset="0" stop-color="#ffcf94"/><stop offset=".3" stop-color="#e0904a"/><stop offset=".62" stop-color="#9a5420"/>' +
    '<stop offset=".7" stop-color="#ffc07a"/><stop offset=".82" stop-color="#d27a34"/><stop offset=".93" stop-color="#8a4515"/>' +
    '<stop offset="1" stop-color="#3a1806"/></linearGradient>' +
    '<linearGradient id="mrsteel" x1="0" x2="0" y1="0" y2="1">' +
    '<stop offset="0" stop-color="#f4f6ff"/><stop offset=".22" stop-color="#c3c8ea"/><stop offset=".45" stop-color="#8a90b8"/>' +
    '<stop offset=".62" stop-color="#e8ebfa"/><stop offset=".8" stop-color="#9aa1c8"/><stop offset="1" stop-color="#3e4370"/>' +
    "</linearGradient>" +
    '<radialGradient id="mrhot"><stop offset="0" stop-color="#7ff3ff" stop-opacity=".55"/>' +
    '<stop offset=".6" stop-color="#7ff3ff" stop-opacity=".15"/><stop offset="1" stop-color="#7ff3ff" stop-opacity="0"/></radialGradient>' +
    "</defs>";
  // the charge, while it runs: a haze behind it
  s += `<ellipse class="hot" cx="0" cy="${(-(hT * 0.6) * MR_CE).toFixed(2)}" rx="${TR + Tt + 8}" ry="${(hT * MR_CE * 0.8).toFixed(2)}" fill="url(#mrhot)"/>`;
  // the foot: a short cylinder, its top lighter
  s += `<path class="foot" d="M${-fr} ${-fh * MR_CE}V0A${fr} ${fr * MR_SE} 0 0 0 ${fr} 0V${-fh * MR_CE}Z"/>`;
  s += e(fh, fr, fr * MR_SE, "foot-top");
  for (let i = 0; i < rings; i++) s += e(fh + t + 2 * t * i, R + t, R * MR_SE + t, "ring");
  // the toroid: its hole, the light on top of its near side
  s += e(hT, TR + Tt, TR * MR_SE + Tt, "torus");
  s += e(hT, TR - Tt * 0.5, Math.max(0.8, TR * MR_SE - Tt), "hole");
  const yn = -hT * MR_CE + TR * MR_SE - Tt + 1.6; // just under the hole: the top of the near side
  s += `<path class="shine" d="M${-TR * 0.62} ${yn}Q0 ${yn + 2.6} ${TR * 0.62} ${yn}"/>`;
  const c = mrCard(parent, x, y, z, W, H, fr, "mr-coilc");
  c.innerHTML = s + "</svg>";
  return { card: c, top: hT + Tt, torus: [hT, TR + Tt] };
}
/* the copper on the face that wires the consoles to the machines, by machine (PCB.faces.back tags it) */
function mrWires() {
  const paths = document.querySelectorAll('.cube .side[data-face="back"] .face-svg .fx-tr'),
    W = {};
  PCB.faces.back.forEach((n, i) => n.m && paths[i] && (W[n.m] = W[n.m] || []).push(paths[i]));
  return W;
}
/* back to a fresh factory (the face opens or closes); the items themselves go with the factory's leftovers */
function mrReset() {
  Object.assign(MR, {
    sel: 0,
    rbNext: 0,
    rbSt: MR_RB.map(() => ({ s: 0, p: 0, pcb: "" })),
    pad: null,
    blocks: [],
    queued: 0,
    carrot: null,
    rb: null,
    stick: null,
    placing: null,
    aim: null,
    drop: null,
    req: null,
    zone: null,
    msg: null,
    last: {},
    coilZ: 0,
    zap: 0,
    holoOff: false,
    winT: 0,
    switchT: 0,
    barP: -1,
  });
  mrKeysUp();
  mrBlackoutStop();
  mrCatch(false);
  MR.ghost.hidden = true;
  mrFences(false);
  MR.power.classList.remove("live");
  MR.gen.classList.remove("run");
  MR.zaps.forEach(z => z.getAnimations().forEach(a => a.cancel()));
  mrVfd();
  mrDeskTick();
  mrNixie(MR.solved, false); // once the word has been found, it stays on
  mrHint(!MR.touched);
}
const mrHint = on => [MR.bNext, MR.bGo].forEach(b => b.r.classList.toggle("hint", on)); // until the first press
/* the printer's display: the model on show */
function mrVfd() {
  const el = MR.vfd;
  el._fit.text = el.textContent = MR_MODELS[MR.sel].name;
  swRefit(el);
}
/* the desk follows the factory (every frame, while it is in view): the rabbit's lamps, the print's progress, and
   the copper to each machine, lit while that machine is at work */
function mrDeskTick() {
  const alive = !!(MR.rb && MR.rb.alive);
  MR.lampOn.classList.toggle("on", alive);
  MR.lampOff.classList.toggle("on", !alive);
  const job = MK.onBed && MK.onBed.job,
    p = job ? Math.round(job.st.p * 100) : MK.printed ? 100 : 0;
  if (p !== MR.barP) MR.bar.style.width = (MR.barP = p) + "%";
  const on = MK.open, // all dark once the face closes
    busy = {
      printer: on && !!(MK.onBed || MK.printed),
      fab: on && !!MK.flcd && MK.flcd.textContent !== "IDLE",
      arm0: on && !!(MK.arms[0] && MK.arms[0].hold),
      arm1: on && !!(MK.arms[1] && MK.arms[1].hold),
      asm: on && !!MK.asm && (!!MK.asm.part || MK.asmGear.classList.contains("spin")),
      crane: on && !!MK.cr.hold,
      gen: on && MR.gen.classList.contains("run"),
      holo: on && !MR.holoOff,
      launch: on && MK.count != null,
    };
  for (const k in busy)
    if (busy[k] !== MR.lit[k]) (MR.wires[k] || []).forEach(el => el.classList.toggle("mr-on", (MR.lit[k] = busy[k])));
}
/* the tower's display scrolls a hint while this face is open: what to do next */
function mrHintText() {
  if (!MK.open) return "";
  return MR.rb ? "GET THE CARROT" : "BUILD THE RABBIT";
}
/* a line on the hologram, under the model: pink for a refusal or a mishap, teal for news */
function mrSay(txt, tone = "pink", sec = 3.2) {
  MR.msg = { txt, tone, until: performance.now() + sec * 1000 };
}
function mrNo(txt) {
  mrSay(txt);
  const b = MR.bGo.r;
  b.classList.remove("err");
  void b.offsetWidth;
  b.classList.add("err");
}
/* the hologram comes back when the visitor reaches for the buttons again */
function mrHoloBack() {
  if (!MR.holoOff) return;
  MR.holoOff = false;
  holoFade(1, 700);
}
/* the fences come up (the carrot is on its way to the assembly machine) or go back into the board */
function mrFences(on) {
  MR.fence = on;
  MR.fences.classList.toggle("up", on);
}
/* the nixie tubes: on (one after the other, warming up with a flicker) or off */
function mrNixie(on, warm) {
  MR.nixHalo.classList.toggle("on", on);
  MR.nix.forEach((t, k) => {
    clearTimeout(t._t);
    const go = () => {
      t.classList.toggle("on", on);
      t.classList.remove("flick");
      if (on && warm) {
        void t.offsetWidth;
        t.classList.add("flick");
      }
    };
    if (on && warm) t._t = setTimeout(go, reduce ? 0 : 350 + 320 * k);
    else go();
  });
}

/* ---------------- MODEL and PRINT ---------------- */
function mrNext() {
  if (!MK.open) return;
  MR.touched = true;
  mrHint(false);
  mrHoloBack();
  MR.sel = (MR.sel + 1) % MR_MODELS.length;
  MR.switchT = performance.now(); // the hologram glitches over to the next model
  mrVfd();
}
function mrPrint() {
  if (!MK.ready) return;
  MR.touched = true;
  mrHint(false);
  mrHoloBack();
  const m = MR_MODELS[MR.sel];
  if (MK.mode === "auto" && m.id === "rocket") return mrSay("ROCKETS PRINT ON THEIR OWN · PICK A MODEL", "teal");
  // what this model needs first (the launch pad holds one rocket or one rabbit; the rabbit is built bottom up)
  let no = "";
  if (m.id === "rocket")
    no = MR.pad === "rabbit" ? "THE PAD BELONGS TO THE RABBIT NOW" : MR.pad ? "A ROCKET IS ALREADY ON ITS WAY" : "";
  else if (m.kind === "rb")
    no =
      MR.pad === "rocket"
        ? "WAIT FOR THE ROCKET TO LEAVE THE PAD"
        : MR.rbNext >= MR_RB.length
          ? "THE RABBIT IS ALREADY BUILT"
          : m.k < MR.rbNext
            ? `THE ${MR_RB[m.k].name} ARE DONE · NEXT: ${MR_RB[MR.rbNext].name}`
            : m.k > MR.rbNext
              ? `PRINT THE ${MR_RB[MR.rbNext].name} FIRST`
              : "";
  else if (m.kind === "blk" && MR.queued >= 3) no = "NO ROOM FOR MORE BLOCKS";
  // three orders waiting at most (a rocket is one order, for its three sections)
  if (!no && MK.mode === "play" && MK.jobs.filter(j => j.kind !== "sec" || j.k === 0).length >= 3)
    no = "THE QUEUE IS FULL";
  if (no) return mrNo(no);
  if (MK.mode === "auto") mkPlay(); // from now on the factory makes what it is asked for
  if (m.id === "rocket") {
    MR.pad = "rocket";
    mkQueueRocket(MK.n);
    return mrSay("ROCKET QUEUED", "teal", 1.6);
  }
  if (m.kind === "rb") {
    MR.rbNext++;
    MR.pad = "rabbit";
  }
  if (m.kind === "blk") MR.queued++;
  const h = m.h || MR_RB[m.k].h,
    job = {
      kind: m.kind,
      k: m.k,
      id: m.id,
      pcb: m.pcb,
      dur: 2600 + 45 * h,
      st: m.kind === "rb" ? MR.rbSt[m.k] : { s: 0, p: 0, pcb: "" },
    };
  MK.jobs.push(job);
  if (job.pcb) MK.fabJobs.push(job);
  MR.last[m.id] = job;
  mrSay(`${m.name} QUEUED`, "teal", 1.6);
}

/* ---------------- the printed models ---------------- */
const mrBox = (p, [x0, y0, z0, x1, y1, z1, cls]) => box(p, x0, y0, x1 - x0, y1 - y0, z1 - z0, cls, z0);
/* each one floats 0.6 above what it stands on (like the rocket's sections), so no two faces share a plane */
function mrItem(cls, extra) {
  const g = div("mk-g " + cls, MK.items),
    in0 = mkG(g, 0, 0, "translateZ(.6px)");
  return Object.assign({ g, in0, tops: [], bots: [], bays: [] }, extra(in0));
}
function mrMakePart(job) {
  if (job.kind === "rb") {
    const D = MR_RB[job.k];
    const it = mrItem("mr-part", in0 => {
      D.boxes.forEach(b => mrBox(in0, b));
      (D.ears ? [1, -1] : []).forEach(sd => {
        const e = mkG(
          in0,
          0,
          0,
          `translate3d(${D.ears[0]}px,${sd * D.ears[1]}px,${D.ears[2]}px) rotateX(${-sd * 10}deg) rotateY(-12deg)`,
        );
        MR_EAR.forEach(b => mrBox(e, b));
      });
      const led = D.ears ? "mr-led mr-eye" : "mr-led";
      return { h: D.h, bays: D.leds.map(b => mrBox(in0, [...b.slice(0, 6), led]).r) };
    });
    // it travels facing the camera
    it.rot = 45;
    it.g.style.setProperty("--R", "315deg");
    return it;
  }
  if (job.kind === "blk") {
    const H = MR_MODELS.find(m => m.id === job.id).h;
    const it = mrItem("mr-blk", in0 => {
      box(in0, -11, -11, 22, 22, H, "mk-print " + (H > 30 ? "fil-d" : "fil-b"));
      box(in0, -5, -5, 10, 10, 0.8, "mk-metal", H); // the steel plate the crane's magnet takes it by
      return { h: H + 1.4 };
    });
    it.g.addEventListener("click", e => {
      e.stopPropagation();
      const b = MR.blocks.find(q => q.it === it);
      if (b) mrGrab(b);
    });
    return it;
  }
  // the carrot: on a little stand, its leaves on top (no steel anywhere)
  return mrItem("mr-carrot", in0 => {
    cyl(in0, 0, 0, 12, 2, "mr-stand", 0);
    const c = cyl(in0, 0, 0, 11, 17, "mr-root", 2, { noBot: true });
    [0, 120, 240].forEach(a =>
      box(mkG(in0, 0, 0, `translateZ(18.5px) rotateZ(${a}deg) rotateY(24deg)`), -0.8, -1.4, 1.6, 2.8, 8, "mr-leaf"),
    );
    box(mkG(in0, 0, 0, "translateZ(18.5px)"), -0.9, -1.5, 1.8, 3, 9, "mr-leaf");
    return { h: 27.6, tops: [c.t] };
  });
}

/* ---------------- the crane and the blocks ---------------- */
function mrSolids() {
  const S = MR_FIXED.slice(),
    o = MK.asm && MK.asm.out,
    [ax, ay] = MKL.asm;
  S.push(MR.fence ? MR_FENCED : MR_BELT);
  MR.blocks.forEach(b => S.push([b.x - 11, b.y - 11, b.x + 11, b.y + 11, b.it.h]));
  if (o && o.kind !== "carrot") S.push([ax - 12, ay - 12, ax + 12, ay + 12, MKL.asmH + 0.3 + o.h]); // waiting for the crane
  if (MR.zone) S.push([...MR.zone, 999]);
  return S;
}
/* a point on the screen → the spot of the face under it (the camera is orthographic: invert the affine map) */
function mrFloor(cx, cy) {
  const wr = $("#world").getBoundingClientRect(),
    s = wr.width / 1440 || 1,
    M = qMat(Q),
    o = mkProject(M, 280, 280, 0),
    a = mkProject(M, 380, 280, 0),
    b = mkProject(M, 280, 380, 0);
  const A = [a[0] - o[0], a[1] - o[1]],
    B = [b[0] - o[0], b[1] - o[1]],
    det = A[0] * B[1] - A[1] * B[0],
    dx = (cx - wr.left) / s - o[0],
    dy = (cy - wr.top) / s - o[1];
  return [280 + (100 * (dx * B[1] - dy * B[0])) / det, 280 + (100 * (A[0] * dy - A[1] * dx)) / det];
}
function mrDropBad(x, y) {
  const h = 11,
    d = Math.hypot(x - MKL.crane[0], y - MKL.crane[1]),
    R = MR.rb;
  if (x - h < 58 || y - h < 58 || x + h > 502 || y + h > 502) return "TOO CLOSE TO THE EDGE";
  if (d > MR_REACH[1]) return "OUT OF THE CRANE'S REACH";
  if (d < MR_REACH[0]) return "TOO CLOSE TO THE CRANE";
  if (mrSolids().some(s => x + h > s[0] && x - h < s[2] && y + h > s[1] && y - h < s[3]))
    return "SOMETHING IS IN THE WAY";
  if (R && Math.abs(R.x - x) < h + MR_PHYS.r && Math.abs(R.y - y) < h + MR_PHYS.r) return "THE RABBIT IS IN THE WAY";
  return "";
}
const mrCatch = on => {
  MR.catch.classList.toggle("on", on);
  MK.stage.classList.toggle("placing", on);
};
function mrAim(cx, cy) {
  if (!MR.placing || MR.drop) return;
  const [x, y] = mrFloor(cx, cy).map(Math.round);
  MR.aim = [x, y];
  MR.aimBad = mrDropBad(x, y);
  MR.ghost.hidden = false;
  MR.ghost.classList.toggle("bad", !!MR.aimBad);
  MR.ghost.style.transform = `translate3d(${x - 11}px,${y - 11}px,.5px)`;
}
function mrDrop() {
  if (!MR.placing || !MR.aim || MR.drop) return;
  if (MR.aimBad) return mrSay(MR.aimBad);
  MR.drop = MR.aim.slice();
}
/* while it waits for a spot, the crane follows the pointer */
function mrCraneToward(x, y, dt) {
  const C = MK.cr,
    [mx, my] = MKL.crane,
    r1 = Math.min(MR_REACH[1], Math.max(MR_REACH[0], Math.hypot(x - mx, y - my))),
    k = reduce ? 1 : Math.min(1, dt * 5);
  let d = Math.atan2(y - my, x - mx) - C.th;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  mkCraneSet(C.th + d * k, C.r + (r1 - C.r) * k, C.z);
}
/* the crane holds a block: it goes wherever the visitor clicks */
async function mrPlace(gen, it) {
  MR.placing = it; // the hologram asks for a spot meanwhile
  MR.drop = null;
  mrCatch(true);
  let last = performance.now();
  while (mkOK(gen) && !MR.drop) {
    await new Promise(r => requestAnimationFrame(r));
    const now = performance.now();
    if (MR.aim) mrCraneToward(MR.aim[0], MR.aim[1], Math.min(0.05, (now - last) / 1000));
    last = now;
  }
  if (!mkOK(gen)) return false;
  const [x, y] = MR.drop;
  mrCatch(false);
  MR.ghost.classList.remove("bad");
  MR.ghost.style.transform = `translate3d(${x - 11}px,${y - 11}px,.5px)`;
  await mkCraneGo(gen, x, y, MK.cr.z, 350);
  MR.zone = [x - 11, y - 11, x + 11, y + 11]; // nobody steps in while it comes down
  await mkHook(gen, it.h, 900);
  MR.zone = null;
  if (!mkOK(gen)) return false;
  MK.cr.hold = null;
  mkPlace(it, x, y, 0);
  MR.ghost.hidden = true;
  MR.blocks.push({ it, x, y });
  it.g.classList.add("grab");
  it.job.st.s = 4;
  MR.placing = MR.drop = MR.aim = null;
  await mkHook(gen, MKL.carry, 500);
  return mkOK(gen);
}
const mrStandsOn = b => {
  const R = MR.rb,
    q = MR_PHYS.r * 0.55;
  return (
    !!R &&
    Math.abs(R.z - b.it.h) < 1 &&
    R.x + q > b.x - 11 &&
    R.x - q < b.x + 11 &&
    R.y + q > b.y - 11 &&
    R.y - q < b.y + 11
  );
};
/* a click on a block: the crane comes for it (once it is free) */
function mrGrab(b) {
  if (!MK.open || MR.placing || MR.req === b) return;
  if (mrStandsOn(b)) return mrSay("THE RABBIT IS STANDING ON IT");
  MR.req = b;
  mrSay("THE CRANE IS ON ITS WAY", "teal", 1.8);
}
async function mrRepick(gen) {
  const b = MR.req,
    C = MK.cr;
  MR.req = null;
  if (!b || !MR.blocks.includes(b)) return true;
  await mkCraneGo(gen, b.x, b.y, MKL.carry, 1100);
  await mkHook(gen, b.it.h, 700);
  if (!mkOK(gen)) return false;
  if (mrStandsOn(b)) {
    mrSay("THE RABBIT IS STANDING ON IT");
    await mkHook(gen, MKL.carry, 500);
    return mkOK(gen);
  }
  MR.blocks.splice(MR.blocks.indexOf(b), 1);
  b.it.g.classList.remove("grab");
  C.hold = b.it;
  mkCraneSet(C.th, C.r, C.z);
  await mkHook(gen, MKL.carry, 600);
  return mkOK(gen) && mrPlace(gen, b.it);
}

/* ---------------- the carrot ---------------- */
/* the crane's magnet comes down on it and finds nothing to hold on to */
async function mrCarrotTry(gen, it) {
  it.stuck = true;
  it.job.st.s = 4;
  if (!it.eaten) {
    mrSay("THE CARROT ISN'T MAGNETIC · THE CRANE CAN'T LIFT IT");
    it.in0.classList.add("wob");
  }
  await mkWait(gen, 500);
  await mkHook(gen, MKL.carry, 600);
  await mkCraneGo(gen, MKL.crane[0] + 40, MKL.crane[1] - 26, MKL.jib - 20, 900);
  return mkOK(gen);
}
/* the next part needs the lift: it takes the carrot back down into the machine */
function mrCarrotLost(it) {
  if (MR.carrot === it) MR.carrot = null;
  it.job.st.done = "LOST IN THE MACHINE";
  mrSay("THE CARROT FELL BACK INTO THE MACHINE · PRINT IT LAST");
}
/* the rabbit stands on the assembly machine's trap: the lift must not move */
function mrOnHatch() {
  const R = MR.rb,
    q = 23 + MR_PHYS.r * 0.6;
  return !!R && R.z >= MKL.asmH - 3 && Math.abs(R.x - MKL.asm[0]) < q && Math.abs(R.y - MKL.asm[1]) < q;
}

/* ---------------- the rabbit ---------------- */
/* its three parts are on the pad: they become one rabbit, which wakes up */
async function mrBoot(gen) {
  const [pdx, pdy] = MKL.pad,
    parts = MK.stack;
  MK.stack = [];
  const g = div("mk-g mr-rabbit", MK.items),
    body = mkG(g),
    sh = mkG(MK.items);
  div("mr-shadow", sh);
  let z = 0;
  parts.forEach((it, i) => {
    body.appendChild(it.g);
    it.rot = 0;
    it.g.style.removeProperty("--R");
    mkPlace(it, 0, 0, z - (i ? 0.6 : 0));
    z += it.h;
  });
  const R = (MR.rb = {
    g,
    body,
    sh,
    parts,
    x: pdx,
    y: pdy,
    z: MKL.padH,
    vz: 0,
    hd: Math.PI / 4, // facing the camera
    hdT: Math.PI / 4,
    sq: 1,
    ph: 0,
    jb: 0,
    coy: 0,
    alive: false,
  });
  mrDraw(R, R.z, 0);
  // power: the generator spins up and charges its coil, current runs up the traces into the pad, then arcs
  // crackle all over the rabbit
  mrSay("POWERING UP THE RABBIT", "teal", 3.4);
  MR.gen.classList.add("run");
  if (!reduce) {
    MR.coilZ = performance.now();
    MR.zaps.forEach((z, i) => {
      const L = z.getTotalLength();
      z.style.strokeDasharray = `16 ${L + 16}`;
      z.animate([{ strokeDashoffset: 16 }, { strokeDashoffset: -L }], {
        duration: 420,
        delay: 500 + 110 * i,
        iterations: 3,
        easing: "linear",
      });
    });
    await mkWait(gen, 1500);
    MR.zap = performance.now();
    await mkWait(gen, MR_ZAP);
  }
  if (!mkOK(gen)) return;
  MR.power.classList.add("live"); // the traces stay lit while it runs on them
  g.classList.add("live");
  R.alive = true;
  R.jb = 0.1; // a little hop to say hello
  R.dirs = null;
  mrSay("RABBIT ONLINE · JOYSTICK OR ARROW KEYS · SPACE TO JUMP", "teal", 7);
}
const MR_COIL = 1700, // how long the coil sparks while it charges
  MR_ZAP = 1600; // how long the arcs into the rabbit last
/* a jagged bolt between two points of the overlay: the straight line, broken again and again at a random point
   beside its middle; a wide glow under a bright core */
function mrBolt(ctx, from, to, env, n = 5, w = 1) {
  let pts = [from, to];
  for (let d = 0; d < n; d++)
    pts = pts.flatMap((q, j) => {
      if (j === pts.length - 1) return [q];
      const r = pts[j + 1],
        dx = r[0] - q[0],
        dy = r[1] - q[1],
        off = (Math.random() - 0.5) * 0.45;
      return [q, [(q[0] + r[0]) / 2 - dy * off, (q[1] + r[1]) / 2 + dx * off]];
    });
  [
    [5 * w, `rgba(127,243,255,${(0.28 * env).toFixed(3)})`],
    [1.4 * w, `rgba(235,255,255,${(0.95 * env).toFixed(3)})`],
  ].forEach(([lw, col]) => {
    ctx.lineWidth = lw;
    ctx.strokeStyle = col;
    ctx.beginPath();
    pts.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.stroke();
  });
}
/* a soft glow around a point of the overlay */
function mrGlow(ctx, c, r, a) {
  const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  g.addColorStop(0, `rgba(170,240,255,${a.toFixed(3)})`);
  g.addColorStop(1, "rgba(120,200,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c[0], c[1], r, 0, Math.PI * 2);
  ctx.fill();
}
/* the power-up, on the factory's overlay (P projects a point of the board onto it): streamers off the coil's
   toroid while the generator charges it, then bolts from the pad's rim up into the rabbit, the pad's lights
   flashing */
function mrDrawZap(ctx, P, t) {
  const now = performance.now();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if (MR.coilZ) {
    const k = (now - MR.coilZ) / MR_COIL,
      [cx, cy] = MR_GEN.coil,
      [hT, rT] = MR.coil.torus,
      z = 4 + hT; // the toroid's middle, above the board
    if (k >= 1) MR.coilZ = 0;
    else {
      const env = Math.min(1, k * 2.5) * (1 - k ** 4); // it builds up, then hands over to the pad
      mrGlow(ctx, P(cx, cy, z), 30, 0.3 * env);
      // streamers off the toroid's rim, into the air
      for (let i = 0; i < 4; i++) {
        if (Math.random() > 0.25 + 0.6 * env) continue;
        const a = Math.random() * Math.PI * 2,
          b = a + (Math.random() - 0.5) * 0.9,
          d = rT + 7 + Math.random() * 10;
        mrBolt(
          ctx,
          P(cx + rT * Math.cos(a), cy + rT * Math.sin(a), z),
          P(cx + d * Math.cos(b), cy + d * Math.sin(b), z + (Math.random() - 0.4) * 16),
          env,
          3,
          0.7,
        );
      }
    }
  }
  if (MR.zap) {
    const k = (now - MR.zap) / MR_ZAP,
      [px, py] = MKL.pad,
      z0 = MKL.padH;
    if (k >= 1) {
      MR.zap = 0;
      MK.padLights.forEach(l => l.classList.remove("on"));
    } else {
      const env = Math.sin(Math.PI * Math.min(1, k * 1.05)); // in and out
      MK.padLights.forEach((l, i) => l.classList.toggle("on", (Math.floor(t * 14) + i) % 2 === 0));
      mrGlow(ctx, P(px, py, z0 + 22), 64, 0.42 * env);
      for (let i = 0; i < 6; i++) {
        if (Math.random() > 0.2 + 0.7 * env) continue; // they flicker
        const a = Math.random() * Math.PI * 2;
        mrBolt(
          ctx,
          P(px + 27 * Math.cos(a), py + 27 * Math.sin(a), z0),
          P(px + (Math.random() - 0.5) * 16, py + (Math.random() - 0.5) * 16, z0 + 6 + Math.random() * 38),
          env,
        );
      }
    }
  }
  ctx.restore();
}
/* the joystick, held with the mouse or a finger: how far from its centre, on screen, gives the direction */
function mrJoyDown(e) {
  if (e.button !== 0 || !mrActive()) return;
  e.stopPropagation();
  e.preventDefault();
  const el = e.currentTarget,
    r = MR.joyBase.r.getBoundingClientRect(),
    c = [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
    full = 16 * ($("#world").getBoundingClientRect().width / 1440 || 1); // a full push, in screen pixels
  el.setPointerCapture(e.pointerId);
  const move = ev => {
    const dx = ev.clientX - c[0],
      dy = ev.clientY - c[1],
      n = Math.hypot(dx, dy),
      k = n < 1 ? 0 : Math.min(1, n / full) / n;
    MR.stick = { x: dx * k, y: dy * k };
  };
  const up = () => {
    MR.stick = null;
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
  };
  move(e);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
/* the space bar (on the panel, or the keyboard's): down, the rabbit jumps; up, the key comes back */
function mrJump(down) {
  if (!MR.space) return;
  MR.space.classList.toggle("down", down);
  if (down && MR.rb && MR.rb.alive) MR.rb.jb = 0.14;
}
/* the arrow keys, turned into directions on the board: screen right and screen down, as seen right now */
function mrScreenDirs() {
  const M = qMat(Q),
    o = mkProject(M, 280, 280, 0),
    a = mkProject(M, 380, 280, 0),
    b = mkProject(M, 280, 380, 0);
  const A = [a[0] - o[0], a[1] - o[1]],
    B = [b[0] - o[0], b[1] - o[1]],
    det = A[0] * B[1] - A[1] * B[0];
  const inv = (sx, sy) => {
    const u = (sx * B[1] - sy * B[0]) / det,
      v = (A[0] * sy - A[1] * sx) / det,
      n = Math.hypot(u, v);
    return [u / n, v / n];
  };
  return [inv(1, 0), inv(0, 1)];
}
/* walls: whatever is taller than a step pushes the rabbit back out */
function mrCollide(R) {
  const r = MR_PHYS.r;
  for (let pass = 0; pass < 2; pass++)
    for (const s of mrSolids()) {
      if (s[4] <= R.z + MR_PHYS.step) continue;
      const cx = Math.max(s[0], Math.min(R.x, s[2])),
        cy = Math.max(s[1], Math.min(R.y, s[3])),
        dx = R.x - cx,
        dy = R.y - cy,
        d = Math.hypot(dx, dy);
      if (d >= r) continue;
      if (d > 1e-6) {
        R.x = cx + (dx / d) * r;
        R.y = cy + (dy / d) * r;
      } else {
        // the centre got inside: out by the nearest side
        const o = [R.x - s[0], s[2] - R.x, R.y - s[1], s[3] - R.y],
          i = o.indexOf(Math.min(...o));
        if (i === 0) R.x = s[0] - r;
        else if (i === 1) R.x = s[2] + r;
        else if (i === 2) R.y = s[1] - r;
        else R.y = s[3] + r;
      }
    }
  R.x = Math.max(56 + r, Math.min(504 - r, R.x));
  R.y = Math.max(56 + r, Math.min(504 - r, R.y));
}
/* the highest thing under its feet it can stand on */
function mrSupport(x, y, z) {
  const q = MR_PHYS.r * 0.55;
  let top = 0;
  for (const s of mrSolids())
    if (s[4] > top && s[4] <= z + MR_PHYS.step && x + q > s[0] && x - q < s[2] && y + q > s[1] && y - q < s[3])
      top = s[4];
  return top;
}
function mrTick(dt) {
  const R = MR.rb,
    K = MR.keys,
    F = MR_PHYS;
  if (!R.dirs) R.dirs = mrScreenDirs();
  // a direction on screen: the joystick while it is held (as far as it is pushed), else the arrow keys
  const S = MR.stick,
    sx = S ? S.x : K.r - K.l,
    sy = S ? S.y : K.d - K.u,
    push = Math.min(1, Math.hypot(sx, sy)),
    [D0, D1] = R.dirs;
  // that direction, on the board (the joystick leans that way too)
  let mx = sx * D0[0] + sy * D1[0],
    my = sx * D0[1] + sy * D1[1];
  const n = Math.hypot(mx, my) || 1;
  mx *= push / n;
  my *= push / n;
  mrTilt(mx, my, push);
  if (!R.alive || push <= 0.15) mx = my = 0;
  else R.hdT = Math.atan2(my, mx);
  R.x += mx * F.speed * dt;
  R.y += my * F.speed * dt;
  mrCollide(R);
  // falling, landing, jumping (a jump pressed just before landing, or just after a ledge, still counts)
  let sup = mrSupport(R.x, R.y, R.z);
  const grounded = R.z <= sup + 0.01 && R.vz <= 0;
  if (grounded) {
    if (R.z < sup - 0.01 || R.air) R.land = 1;
    R.z = sup;
    R.vz = 0;
    R.coy = 0.09;
    R.air = false;
  } else R.coy = Math.max(0, R.coy - dt);
  R.jb = Math.max(0, R.jb - dt);
  if (R.jb > 0 && R.alive && (grounded || R.coy > 0)) {
    R.vz = F.v0;
    R.jb = R.coy = 0;
  }
  if (R.z > sup + 0.01 || R.vz > 0) {
    const z0 = R.z;
    R.air = true;
    R.vz -= F.g * dt;
    R.z += R.vz * dt;
    sup = mrSupport(R.x, R.y, Math.max(z0, R.z)); // a top it fell past during the frame still catches it (slow frames)
    if (R.z <= sup) {
      R.z = sup;
      R.vz = 0;
    }
  }
  let dh = R.hdT - R.hd;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  R.hd += dh * Math.min(1, dt * 12);
  R.ph = (mx || my) && !R.air ? R.ph + dt * 15 : 0; // little hops while it runs
  const c = MR.carrot;
  if (c && !c.eaten && R.z >= MKL.asmH - 1 && Math.hypot(R.x - MKL.asm[0], R.y - MKL.asm[1]) < 13) mrWin(c);
  mrDraw(R, sup, dt);
}
function mrDraw(R, sup, dt) {
  const hop = R.ph ? Math.abs(Math.sin(R.ph)) * 2.6 : 0,
    deg = Math.round(270 + (R.hd * 180) / Math.PI);
  R.g.style.transform = `translate3d(${R.x.toFixed(1)}px,${R.y.toFixed(1)}px,${(R.z + hop).toFixed(1)}px) rotateZ(${R.hd.toFixed(3)}rad)`;
  if (deg !== R.deg) {
    R.deg = deg;
    R.g.style.setProperty("--R", deg + "deg");
  }
  // stretched on the way up, squashed when it lands
  const want = R.air ? (R.vz > 0 ? 1.1 : 0.98) : 1;
  if (R.land) {
    R.sq = 0.78;
    R.land = 0;
  }
  R.sq += (want - R.sq) * Math.min(1, dt * 16);
  const w = (1 / Math.sqrt(R.sq)).toFixed(3);
  R.body.style.transform = `scale3d(${w},${w},${R.sq.toFixed(3)})`;
  // its shadow on whatever is under it
  const s = Math.max(0.45, 1 - (R.z - sup) / 60);
  R.sh.style.transform = `translate3d(${R.x.toFixed(1)}px,${R.y.toFixed(1)}px,${(sup + 0.4).toFixed(1)}px) rotateZ(${R.hd.toFixed(3)}rad) scale(${s.toFixed(3)})`;
  R.sh.style.opacity = (0.35 + 0.65 * s).toFixed(2);
}
/* the joystick leans the way the rabbit is sent (a direction on the board) */
function mrTilt(x, y, push) {
  const n = Math.hypot(x, y),
    tf = n > 0.01 ? `rotate3d(${(-y / n).toFixed(2)},${(x / n).toFixed(2)},0,${(22 * push).toFixed(1)}deg)` : "";
  if (tf !== MR.tiltTf) MR.tilt.style.transform = MR.tiltTf = tf;
}
/* up on the machine, it gets to the carrot: three bites */
function mrWin(c) {
  const R = MR.rb,
    [ax, ay] = MKL.asm;
  c.eaten = true;
  MR.carrot = null;
  if (MK.asm.out === c) MK.asm.out = null; // the lift is free to go back down
  c.job.st.done = "EATEN";
  [0.62, 0.3, 0].forEach((s, i) =>
    setTimeout(
      () => (c.in0.style.transform = `translateZ(.6px) scale3d(${0.4 + 0.6 * s},${0.4 + 0.6 * s},${s || 0.01})`),
      (i + 1) * 240,
    ),
  );
  setTimeout(() => c.g.remove(), 900);
  for (let k = 0; k < 40; k++) {
    const an = Math.random() * Math.PI * 2,
      v = 25 + Math.random() * 55;
    MK.sparks.push({
      p: [ax, ay, MKL.asmH + 14],
      v: [Math.cos(an) * v, Math.sin(an) * v, 60 + Math.random() * 90],
      life: 0,
      max: 0.4 + Math.random() * 0.5,
    });
  }
  R.jb = 0.15; // a happy jump
  MR.winT = performance.now();
  MR.solved = true;
  mrSay("THE RABBIT GOT ITS CARROT", "teal", 8);
  mrBlackout(); // then the power fails: the tubes have the last word
}

/* ---------------- the win: a blackout ---------------- */
/* the power fails: every light on the page goes out, the nixie tubes warm up in the dark one after the other, then
   the power comes back (a surge runs through the copper) and the hologram boots up again. The dark is a canvas over
   the whole page; it lets each tube's glow through once the tube is lit (the tubes are the real ones, under it). */
const MR_DARK = 0.8, // how dark it gets: everything still shows, dimly
  // ms since the win: the lights fail, the tubes start warming up, the lights come back, all done
  MR_BO = { out: 1000, nix: 2300, back: 4900, end: 5300 },
  MR_BO_CALM = { out: 600, nix: 1500, back: 3300, end: 4200 }, // reduced motion: slow fades, no flicker
  MR_OUT = [
    [0, 0.85],
    [80, 0.25],
    [150, 1],
    [270, 0.6],
    [340, 1],
  ], // the lights failing (ms, darkness: a share of MR_DARK)…
  MR_BACK = [
    [0, 0.3],
    [90, 1],
    [200, 0.1],
    [300, 0],
  ], // …and coming back
  MR_FLICK = [
    [0, 1],
    [0.08, 0.25],
    [0.14, 1],
    [0.22, 0.5],
    [0.3, 0.08],
    [0.38, 0.9],
    [0.46, 0.35],
    [0.54, 1],
  ]; // a tube warming up: its brightness through @keyframes flick (0.7 s, steps)
const mrStep = (keys, t) => keys.reduce((v, [k, a]) => (t >= k ? a : v), keys[0][1]);
function mrBlackout() {
  if (!MR.dark) {
    MR.dark = div("mr-dark", document.body, {}, "canvas");
    MR.dark.hidden = true;
  }
  cancelAnimationFrame(MR.bo && MR.bo.raf);
  MR.bo = { t0: performance.now(), T: reduce ? MR_BO_CALM : MR_BO, did: {}, lit: [] };
  MR.bo.raf = requestAnimationFrame(mrDarkTick);
}
/* the power is back in a hurry (the face closes): no more dark */
function mrBlackoutStop() {
  if (!MR.bo) return;
  cancelAnimationFrame(MR.bo.raf);
  MR.bo = null;
  MR.dark.hidden = true;
}
function mrDarkTick(now) {
  const B = MR.bo,
    T = B.T,
    t = now - B.t0,
    once = (k, fn) => !B.did[k] && (B.did[k] = true) && fn();
  if (t >= T.end) return mrBlackoutStop();
  B.raf = requestAnimationFrame(mrDarkTick);
  // the story: lights out (the hologram collapses, the tubes go dark), the tubes warm up, the power comes back
  if (t >= T.out)
    once("out", () => {
      MR.holoOff = true;
      holoFade(0, 300);
      mrNixie(false, false);
    });
  if (t >= T.nix) once("nix", () => mrNixie(true, !reduce));
  if (t >= T.back)
    once("back", () => {
      MR.holoOff = false;
      holoFade(1, 900);
      if (!reduce) wave(TOPICS.find(tp => tp.id === "maker").color); // a surge through every track
    });
  // how dark: stuttering out and back in (or fading, with reduced motion)
  const calm = (a, b, k) => a + (b - a) * eio(Math.max(0, Math.min(1, k))),
    dark = reduce
      ? t < T.back
        ? calm(0, MR_DARK, (t - T.out) / 700)
        : calm(MR_DARK, 0, (t - T.back) / 900)
      : t < T.out
        ? 0
        : t < T.back
          ? MR_DARK * mrStep(MR_OUT, t - T.out)
          : MR_DARK * mrStep(MR_BACK, t - T.back);
  const cv = MR.dark,
    dpr = Math.min(2, devicePixelRatio || 1),
    W = innerWidth,
    H = innerHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  cv.hidden = dark <= 0;
  if (dark <= 0) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(2,3,16,${dark.toFixed(3)})`; // a night blue
  ctx.fillRect(0, 0, W, H);
  // each lit tube shows through the dark, and its glow spills around it
  const M = qMat(Q),
    wr = $("#world").getBoundingClientRect(),
    s = wr.width / 1440,
    at = (x, y, z) => {
      const p = mkProject(M, x, y, z);
      return [wr.left + p[0] * s, wr.top + p[1] * s];
    };
  MR.nix.forEach((tube, k) => {
    if (!tube.classList.contains("on")) return (B.lit[k] = 0);
    const since = now - (B.lit[k] = B.lit[k] || now),
      I = reduce ? Math.min(1, since / 600) : since < 700 ? mrStep(MR_FLICK, since / 700) : 1;
    const [x, y] = MR.nixAt[k],
      c = at(x, y, MR.nixZ),
      r = at(x + Math.SQRT1_2, y - Math.SQRT1_2, MR.nixZ),
      ph = Math.hypot(r[0] - c[0], r[1] - c[1]); // px per unit, across the screen (the tubes' cards face it)
    mrDarkSpot(ctx, c, 15 * ph, 22 * ph, "destination-out", `rgba(0,0,0,${(0.96 * I).toFixed(3)})`);
    mrDarkSpot(ctx, c, 46 * ph, 46 * ph, "lighter", `rgba(255,110,30,${(0.2 * I * dark).toFixed(3)})`);
  });
}
/* a soft elliptic spot on the dark (rx × ry around c), drawn with a composite operation */
function mrDarkSpot(ctx, c, rx, ry, op, col) {
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.translate(c[0], c[1]);
  ctx.scale(rx / ry, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
  g.addColorStop(0, col);
  g.addColorStop(0.45, col);
  g.addColorStop(1, col.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, ry, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------- keys ---------------- */
const mrActive = () => !!(MK.open && MR.rb && MR.rb.alive && !ROLL.active);
const MR_KEYS = {
  ArrowLeft: "l",
  a: "l",
  A: "l",
  ArrowRight: "r",
  d: "r",
  D: "r",
  ArrowUp: "u",
  w: "u",
  W: "u",
  ArrowDown: "d",
  s: "d",
  S: "d",
};
function mrKeysUp() {
  MR.keys.l = MR.keys.r = MR.keys.u = MR.keys.d = 0;
}
addEventListener(
  "keydown",
  e => {
    if (!mrActive() || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = MR_KEYS[e.key];
    if (k) MR.keys[k] = 1;
    else if (e.key === " ") {
      if (!e.repeat) mrJump(true); // the panel's space bar goes down with it
    } else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);
addEventListener(
  "keyup",
  e => {
    const k = MR_KEYS[e.key];
    if (k) MR.keys[k] = 0;
    else if (e.key === " ") mrJump(false);
  },
  true,
);
addEventListener("blur", () => {
  mrKeysUp();
  mrJump(false);
});

/* ---------------- the hologram, for every model but the rocket ---------------- */
const MR_DIM = "rgba(127,243,255,.2)",
  MR_LIT = "rgba(127,243,255,.95)",
  MR_DONE = "rgba(220,252,255,1)",
  MR_CUT = "rgba(255,181,71,.95)";
/* a box's edges, as polylines (tf moves its corners) */
function mrWire([x0, y0, z0, x1, y1, z1], tf = p => p) {
  const c = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    L = [z0, z1].map(z => [...c, c[0]].map(([x, y]) => tf([x, y, z])));
  c.forEach(([x, y]) => L.push([tf([x, y, z0]), tf([x, y, z1])]));
  return L;
}
const mrRotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)],
  mrRotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
/* the wireframe of each part of the rabbit (computed once) */
const MR_WIRES = MR_RB.map(D => {
  const L = [...D.boxes, ...D.leds].flatMap(b => mrWire(b));
  if (D.ears)
    [1, -1].forEach(sd =>
      MR_EAR.forEach(b =>
        L.push(
          ...mrWire(b, p => {
            const q = mrRotX(mrRotY(p, (-12 * Math.PI) / 180), (-sd * 10 * Math.PI) / 180);
            return [q[0] + D.ears[0], q[1] + sd * D.ears[1], q[2] + D.ears[2]];
          }),
        ),
      ),
    );
  return L;
});
/* H: the hologram's projection (PS(scale) → P), its line helper, the anchor of the labels, and time */
function mrHolo(ctx, H) {
  const { PS, line, t } = H,
    m = MR_MODELS[MR.sel],
    pulse = 0.35 + 0.3 * Math.sin(t * 5),
    SEL = `rgba(127,243,255,${pulse.toFixed(2)})`;
  const draw = (P, lines, zb, col, w) =>
    lines.forEach(l =>
      line(
        l.map(p => P(p[0], p[1], p[2] + zb)),
        col(zb + Math.max(...l.map(p => p[2]))),
        w,
      ),
    );
  const cut = (P, z, [x0, y0, x1, y1]) =>
    line([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z), P(x0, y0, z)], MR_CUT, 1.6);
  const prog = st => (st.s === 1 ? st.p : st.s >= 2 ? 1 : 0);
  let l1 = "PRESS PRINT",
    l2 = "";
  if (m.kind === "rb") {
    // while it is being built, the rabbit is shown exploded into its three parts, each one named: the part on show
    // stands out (amber), the others are ghosts until they are printed
    const apart = !MR.rb,
      P = PS(apart ? 1.38 : 1.8),
      HOT = `rgba(255,205,120,${(0.72 + 0.28 * Math.sin(t * 5)).toFixed(2)})`,
      GHOST = "rgba(127,243,255,.13)",
      tags = [];
    let zb = 0;
    MR_RB.forEach((D, k) => {
      const st = MR.rbSt[k],
        on = apart && k === m.k,
        c = zb + prog(st) * D.h;
      draw(
        P,
        MR_WIRES[k],
        zb,
        z => (MR.rb || st.s >= 4 ? MR_DONE : st.s && z <= c + 0.01 ? MR_LIT : on ? HOT : GHOST),
        on ? 1.6 : 1.1,
      );
      if (st.s === 1) cut(P, c, [-12, -10, 12, 10]);
      if (apart) tags.push([P(0, 0, zb + D.h / 2), `${k + 1}/3 ${D.name}`, on, st.s >= 4]);
      zb += D.h + (apart ? 10 : 0);
    });
    // the parts' names, to the right of them, a leader line to each
    ctx.font = "8px 'Share Tech Mono', monospace";
    ctx.textAlign = "left";
    tags.forEach(([[x, y], txt, on, done]) => {
      const col = on ? HOT : done ? MR_DONE : "rgba(127,243,255,.45)";
      line(
        [
          [x + 20, y],
          [x + 34, y],
        ],
        col,
        on ? 1.4 : 1,
      );
      if (on) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x + 18, y);
        ctx.lineTo(x + 23, y - 3);
        ctx.lineTo(x + 23, y + 3);
        ctx.fill();
      }
      ctx.fillStyle = col;
      ctx.fillText(txt, x + 37, y + 3);
    });
    ctx.textAlign = "center";
    const st = MR.rbSt[m.k];
    l1 = MR.rb
      ? "ONLINE"
      : m.k > MR.rbNext
        ? `PRINT THE ${MR_RB[MR.rbNext].name} FIRST`
        : mrStatus(st, m.k < MR.rbNext, "ON THE PAD");
    if (st.pcb && st.pcb !== "IN" && !MR.rb) l2 = `PCB ${m.pcb} · ${st.pcb}`;
  } else if (m.kind === "blk") {
    const P = PS(m.h > 30 ? 1.9 : 2.6),
      job = MR.last[m.id],
      st = job && job.st,
      c = st ? prog(st) * m.h : 0;
    draw(P, mrWire([-11, -11, 0, 11, 11, m.h]).concat(mrWire([-5, -5, m.h, 5, 5, m.h + 0.8])), 0, z =>
      st && st.s >= 4 ? MR_DONE : st && st.s && z <= c + 0.01 ? MR_LIT : st ? MR_DIM : SEL,
    );
    if (st && st.s === 1) cut(P, c, [-11, -11, 11, 11]);
    if (st) l1 = MR.placing === job.it ? "ON THE CRANE · CLICK TO SET IT DOWN" : mrStatus(st, true, "PLACED");
  } else {
    // the carrot: a turned root and three leaves
    const P = PS(2.6),
      job = MR.last.carrot,
      st = job && job.st,
      c = st ? prog(st) * m.h : 0,
      col = z => (st && st.done === "EATEN" ? MR_DONE : st && st.s && z <= c + 0.01 ? MR_LIT : st ? MR_DIM : SEL);
    const prof = [
      [0.6, 6],
      [2.6, 6],
      [2.6, 0.7],
      [6, 2],
      [10, 3.4],
      [14, 4.6],
      [17.5, 5.3],
      [19.6, 5.5],
    ];
    prof.forEach(([z, r]) =>
      line(
        Array.from({ length: 19 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return P(r * Math.cos(a), r * Math.sin(a), z);
        }),
        col(z),
      ),
    );
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      line(
        prof.slice(2).map(([z, r]) => P(r * Math.cos(a), r * Math.sin(a), z)),
        col(19.6),
      );
    }
    [0, 120, 240].forEach(a => {
      const u = (a * Math.PI) / 180;
      line([P(0, 0, 19.6), P(3.4 * Math.cos(u), 3.4 * Math.sin(u), 27), P(0, 0, 22)], col(27));
    });
    if (st && st.s === 1) cut(P, c, [-6, -6, 6, 6]);
    if (st) l1 = st.done || mrStatus(st, true, "STUCK ON THE MACHINE");
  }
  return { title: m.name, l1, l2 };
}
function mrStatus(st, queued, done) {
  if (st.s === 0) return queued ? "QUEUED" : "PRESS PRINT";
  if (st.s === 1) return `PRINTING ${Math.round(st.p * 100)}%`;
  if (st.s === 2) return "ON ITS WAY TO ASSEMBLY";
  if (st.s === 3) return "ASSEMBLY";
  return done;
}
