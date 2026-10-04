/* =====================================================================
   SOFTWARE FACE — a retro workstation and the small build line it feeds.
   The monitor case slides to the back of the face and sinks through a
   hatch: the electronics sit right behind the screen. While the keyboard
   types, the front-end and back-end layers slide out of the computer to
   the right, into a soldering machine that fuses each stack, pass after
   pass, into a Docker image. A robot arm puts the images on two
   treadmills; the Kubernetes machine rolls them out, pod by pod, and
   serves the internet (the globe).
   Stage coordinates: the face turned upright (180°). x runs to the right
   corner, y to the left corner (towards the keyboard), z up.
   ===================================================================== */
/* tween bound to the Software face's own run counter (cancelled when the face is torn down) */
function swAnim(gen, dur, fn, ease = eio) {
  return new Promise(res => {
    if (reduce) {
      fn(1);
      return res();
    }
    const t0 = performance.now();
    const step = now => {
      if (gen !== SW.gen) return res();
      const t = Math.min(1, (now - t0) / dur);
      fn(ease(t));
      t < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
const SW = {
  open: false,
  gen: 0,
  keys: [],
  fkeys: [],
  mode: "loop",
  leds: [],
  lines: [],
  ui: [],
  sparks: [],
  pods: {},
  lamps: {},
  hot: {},
  tr: {},
  ver: 0,
  live: 0,
  fade: 0,
  cy: 0,
  belts: [],
  aiLeds: [],
};
/* One layout for the whole face. Everything is centred on three axes:
   the computer and its keyboard (x 28…210), the machine and its two lanes (y 322 and 406),
   the delivery column: console, treadmills, Kubernetes (centred on x 483).
   The edge at x 560 is shared with the AI face: three lines cross it into the Kubernetes machine. */
const SWL = {
  bez: { x: 28, y: 440, w: 182, d: 14, h: 132 }, // screen slab: stays in place
  kb: { x: 28, y: 476, w: 182, d: 60, h: 8 },
  cover: [
    { x: 34, y: 342, w: 170, d: 98, h: 124 },
    { x: 34, y: 272, w: 170, d: 70, h: 102 },
  ],
  slide: 172, // cover travel: back into its bay, where it stays
  park: { x: 30, y: 96, w: 178, d: 176 },
  mobo: { x: 36, y: 276, w: 166, d: 160 },
  cpu: { cx: 84, cy: 326 },
  ram: { x: 112, y: 300 },
  hdd: { x: 140, y: 350, w: 56, d: 28 },
  gpu: { x: 146, y: 298, w: 52, d: 42 },
  lane: { be: 322, fe: 406 }, // centre line of each stack
  plate: { x0: 150, z: 22, gap: 12 }, // where a layer appears, first level, spacing
  bed: { x: 260, y: 280, w: 132, d: 168, h: 16 },
  bay: 302,
  pad: 364, // soldering bay (one per lane) and pick-up pad (x)
  beam: 104,
  tip: 56, // gantry height, iron tip at rest
  arm: { x: 420, y: 364, s: 0.78 },
  belt: { xs: [469, 497], w: 20, y0: 168, y1: 394, z: 10, v: 56 }, // v: px per second, same as the CSS animation
  k8s: { x: 434, y: 56, w: 116, d: 112, h: 56, rows: [140, 116, 92] },
  globe: { cx: 322, cy: 112, r: 42, z: 82 },
  ci: { x: 424, y: 484, w: 116, d: 52, h: 14 },
  link: { ys: [210, 238, 294], xs: [544, 534, 524] }, // AI lines: where they cross the edge, and their column
};
const SW_FEATURES = [
  {
    fe: ["function Projects() {", "  const q = useProjects()", "  return <List {...q} />", "}"],
    be: ["app.get('/api/projects',", "  () => db.projects())"],
    rows: [
      ["HomeInOne", "Node · RPi", "1204"],
      ["PassPass", "Bot", "842"],
      ["attest", "RN", "311"],
    ],
  },
  {
    fe: ["const Login = () => {", "  const auth = useAuth()", "  return <Form {...auth}/>", "}"],
    be: ["app.post('/api/auth',", "  req => sign(req.user))"],
    rows: [
      ["session", "jwt", "ok"],
      ["user", "#42", "ok"],
      ["role", "admin", "ok"],
    ],
  },
  {
    fe: ["function Profile({ id }) {", "  const u = useUser(id)", "  return <Card {...u} />", "}"],
    be: ["app.get('/api/users/:id',", "  req => db.user(req.id))"],
    rows: [
      ["Romain", "fullstack", "✓"],
      ["stack", "TS·Node·PG", "✓"],
      ["cluster", "3 nodes", "✓"],
    ],
  },
];
const SW_SQL = [
  "SELECT p.name, p.stack,",
  "  COUNT(c.id) AS commits",
  "FROM projects p",
  "JOIN commits c ON c.pid = p.id",
  "GROUP BY p.id",
  "ORDER BY commits DESC;",
];
/* the two stacks: three layers each, bottom to top */
const SW_STACKS = {
  fe: {
    label: "FRONTEND",
    image: "web",
    color: "#ff8fd9",
    top: "#d94fb4",
    lane: 0,
    plates: [
      ["#ff6fd8", "DESIGN", "Figma · tokens"],
      ["#ffd166", "COMPONENTS", "React"],
      ["#ff9f5a", "STATE", "TypeScript"],
    ],
  },
  be: {
    label: "BACKEND",
    image: "api",
    color: "#58a9ff",
    top: "#2f74d8",
    lane: 1,
    plates: [
      ["#63e6be", "DATA", "PostgreSQL"],
      ["#7aa2ff", "SERVICES", "Node.js"],
      ["#58a9ff", "API", "REST · GraphQL"],
    ],
  },
};
const SWARM = { L1: 70, L2: 66, H: 39, grip: 16 }; // same build as the factory's arms (local units, before scaling)
const SW_REST = [Math.PI, 20, 88]; // arm pose at rest: [turntable angle, reach, wrist height]
const swLerp = (a, b, t) => a + (b - a) * t;

/* Labels on this face are sized by measurement: each one gets the largest size (up to `max`) that fits
   its width. Measured on a canvas, so it works on faces that are not laid out, and again once the fonts load. */
const SWFIT = [],
  swMeasure = document.createElement("canvas").getContext("2d");
const SW_BODY = "'Chakra Petch', system-ui, sans-serif",
  SW_MONO = "'Share Tech Mono', ui-monospace, monospace";
function swFit(el, text, w, max, o = {}) {
  el.textContent = text;
  el._fit = {
    text,
    w,
    max,
    min: o.min || 6,
    wt: o.wt || 600,
    fam: o.fam || SW_BODY,
    ls: o.ls ?? 0.06,
    svg: el instanceof SVGElement,
  };
  SWFIT.push(el);
  swRefit(el);
  return el;
}
function swRefit(el) {
  const f = el._fit;
  swMeasure.font = `${f.wt} 100px ${f.fam}`;
  const nat = swMeasure.measureText(f.text).width + f.ls * 100 * f.text.length;
  const sz = Math.max(f.min, Math.min(f.max, (f.w / nat) * 100));
  if (f.svg) {
    el.setAttribute("font-size", sz.toFixed(2));
    el.setAttribute("letter-spacing", (f.ls * sz).toFixed(2));
  } else {
    el.style.fontSize = sz.toFixed(2) + "px";
    el.style.letterSpacing = f.ls + "em";
  }
}
/* a small IC: body, pin-1 dot, pins on the sides that carry copper, its name on top */
function swIC(st, o) {
  (o.l || []).forEach(y => box(st, o.x - 5, y - 2, 6, 4, 1.5, "ic-pin"));
  (o.r || []).forEach(y => box(st, o.x + o.w - 1, y - 2, 6, 4, 1.5, "ic-pin"));
  (o.t || []).forEach(x => box(st, x - 2, o.y - 5, 4, 6, 1.5, "ic-pin"));
  (o.b || []).forEach(x => box(st, x - 2, o.y + o.d - 1, 4, 6, 1.5, "ic-pin"));
  const b = box(st, o.x, o.y, o.w, o.d, o.h || 4, "ic-body sw-ic");
  div("ic-dot", b.t);
  if (o.label) swFit(div("", b.t), o.label, o.w - 8, o.fs || 10);
  return b;
}

function buildSoftware() {
  const root = $("#swGroup"),
    st = div("sw-stage", root);
  SW.stage = st;
  const L = SWL,
    B = L.bez,
    K = L.kb,
    Bd = L.bed,
    Bt = L.belt,
    Kb = L.k8s,
    G = L.globe,
    Ci = L.ci,
    A = L.arm,
    Lk = L.link,
    NS = "http://www.w3.org/2000/svg";
  const kbY = Kb.y + Kb.d;

  // ---- copper on the face. Named runs can carry a pulse; the first letters of a name pick its colour.
  const ring = 30,
    busY = [G.cy - 12, G.cy, G.cy + 12];
  const NAMED = {
    kb0: [
      [108.5, K.y],
      [108.5, B.y + B.d],
    ],
    kb1: [
      [115.5, K.y],
      [115.5, B.y + B.d],
    ],
    kb2: [
      [122.5, K.y],
      [122.5, B.y + B.d],
    ],
    kb3: [
      [129.5, K.y],
      [129.5, B.y + B.d],
    ],
    // keyboard → USB hub → the build machine
    usb0: [
      [212, 496],
      [249, 496],
    ],
    usb1: [
      [212, 506],
      [249, 506],
    ],
    usb2: [
      [212, 516],
      [249, 516],
    ],
    usb_up0: [
      [266, 481],
      [266, Bd.y + Bd.d],
    ],
    usb_up1: [
      [278, 481],
      [278, Bd.y + Bd.d],
    ],
    // pipeline console → its three machines
    ctl_solder: [
      [Ci.x, Ci.y + 26],
      [406, Ci.y + 26],
      [378, Ci.y - 2],
      [378, Bd.y + Bd.d],
    ],
    ctl_arm: [
      [448, Ci.y],
      [448, 420],
      [A.x, 392],
      [A.x, A.y + 18],
    ],
    ctl_k8s: [
      [513, Ci.y],
      [513, kbY],
    ],
    // the internet: Kubernetes → PHY → globe
    bus0: [
      [Kb.x, busY[0]],
      [G.cx + Math.sqrt(ring * ring - 144), busY[0]],
    ],
    bus1: [
      [Kb.x, busY[1]],
      [G.cx + ring, busY[1]],
    ],
    bus2: [
      [Kb.x, busY[2]],
      [G.cx + Math.sqrt(ring * ring - 144), busY[2]],
    ],
    xt: [
      [393, 137],
      [393, 146],
    ],
    // power: a regulator feeding the soldering bed, the arm and the cluster
    pw_in: [
      [240, 217],
      [325, 217],
    ],
    pw_c1: [
      [270, 217],
      [270, 233],
    ],
    pw_bed: [
      [343, 235],
      [343, Bd.y],
    ],
    pw_arm: [
      [361, 217],
      [404, 217],
      [420, 233],
      [A.x, A.y - 18],
    ],
    pw_k8s: [
      [352, 199],
      [352, 196],
      [360, 188],
      [424, 188],
      [440, 172],
      [440, kbY],
    ],
    // AI link: three lines from the AI face, over the shared edge, into Kubernetes
    ...Object.fromEntries(
      Lk.ys.map((y, i) => {
        const x = Lk.xs[i];
        return [
          "ai" + i,
          [
            [560, y],
            [x + 8, y],
            [x, y - 8],
            [x, kbY],
          ],
        ];
      }),
    ),
    led: [
      [536, 340],
      [536, 400],
    ],
  };
  const VIA = { pw_in: "s", led: "se" };
  const COL = {
    kb: "#ffd166",
    usb: "#ffd166",
    ctl: "#ffb547",
    bus: "#7ff3ff",
    xt: "#7ff3ff",
    pw: "#ffb547",
    ai: "#ff8fd9",
    led: "#ff8fd9",
  };
  // passives on the copper: [x1, y1, x2, y2] (horizontal or vertical)
  const RES = [
    [343, 248, 343, 264],
    [Lk.xs[0], 180, Lk.xs[0], 196],
    [Lk.xs[2], 236, Lk.xs[2], 252],
  ];
  const CER = [[420, 282, 420, 294]];
  const sv = document.createElementNS(NS, "svg");
  sv.setAttribute("viewBox", "0 0 560 560");
  sv.setAttribute("class", "sw-traces");
  const hpad = (x, y) => `<rect class="swp" x="${x - 4}" y="${y - 2.5}" width="8" height="5"/>`,
    vpad = (x, y) => `<rect class="swp" x="${x - 2.5}" y="${y - 4}" width="5" height="8"/>`;
  const Pk = L.park,
    cnr = (x0, y0, w, d, c = 14) =>
      `M${x0} ${y0 + c}V${y0}H${x0 + c}M${x0 + w - c} ${y0}H${x0 + w}V${y0 + c}M${x0 + w} ${y0 + d - c}V${y0 + d}H${x0 + w - c}M${x0 + c} ${y0 + d}H${x0}V${y0 + d - c}`;
  let h =
    `<circle class="swt" cx="${G.cx}" cy="${G.cy}" r="${ring}"/>` +
    `<rect class="bay" x="${Pk.x}" y="${Pk.y}" width="${Pk.w}" height="${Pk.d}" rx="4"/><path class="bayc" d="${cnr(Pk.x - 3, Pk.y - 3, Pk.w + 6, Pk.d + 6)}"/>` +
    hpad(140, K.y + K.d + 1) +
    hpad(308, Bd.y + Bd.d + 1) +
    hpad(350, Bd.y + Bd.d + 1) +
    hpad(378, Bd.y + Bd.d + 1) +
    hpad(266, Bd.y + Bd.d + 1) +
    hpad(278, Bd.y + Bd.d + 1) +
    vpad(Ci.x - 1, Ci.y + 26) +
    hpad(448, Ci.y - 1) +
    hpad(513, Ci.y - 1) +
    hpad(513, kbY + 1) +
    busY.map(y => vpad(Kb.x - 1, y)).join("") +
    [496, 506, 516].map(y => vpad(211, y)).join("") +
    hpad(343, Bd.y - 1) +
    hpad(A.x, A.y - 19) +
    hpad(440, kbY + 1) +
    Lk.xs.map(x => hpad(x, kbY + 1)).join("") +
    [...RES, ...CER]
      .map(([x1, y1, x2, y2]) =>
        x1 === x2 ? hpad(x1, y1 + 1.5) + hpad(x1, y2 - 1.5) : vpad(x1 + 1.5, y1) + vpad(x2 - 1.5, y1),
      )
      .join("");
  Object.entries(NAMED).forEach(([k, pts]) => {
    const v = VIA[k] || "",
      tp = v ? trimVia(pts, v.includes("s"), v.includes("e"), 4.5) : pts;
    const d = "M" + tp.map(q => q.map(n => +n.toFixed(1)).join(" ")).join("L"),
      c = COL[k.replace(/[_\d].*$/, "")];
    h += `<path class="swt${/^(kb|usb)/.test(k) ? " thin" : ""}" d="${d}"/><path class="pk" data-k="${k}" d="${d}" stroke="${c}" style="color:${c}"/>`;
    if (v.includes("s")) h += `<circle class="via" cx="${pts[0][0]}" cy="${pts[0][1]}" r="4.5"/>`;
    if (v.includes("e")) {
      const q = pts[pts.length - 1];
      h += `<circle class="via" cx="${q[0]}" cy="${q[1]}" r="4.5"/>`;
    }
  });
  sv.innerHTML = h;
  st.appendChild(sv);
  sv.querySelectorAll(".pk").forEach(el => (SW.tr[el.dataset.k] = { el, len: el.getTotalLength() }));
  // silkscreen
  const silk = (x, y, text, w, max) => {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class", "sws");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("text-anchor", "middle");
    sv.appendChild(t);
    return swFit(t, text, w, max, { ls: 0.12 });
  };
  silk(G.cx, G.cy + 62, "PRODUCTION", 120, 13);
  silk(537, 324, "AI LINK", 44, 11.5);
  RES.forEach(r => smdR(st, ...r));
  CER.forEach(r => smdC(st, ...r));

  // ---- the bay the case parks in, and its two end stops
  [Pk.x + 14, Pk.x + Pk.w - 26].forEach(x => box(st, x, Pk.y - 6, 12, 7, 9, "sw-bump"));

  // ---- small chips on the copper: USB hub, power regulator, network PHY + its crystal, the AI link LED
  swIC(st, { x: 254, y: 486, w: 32, d: 40, l: [496, 506, 516], t: [266, 278] });
  swIC(st, { x: 330, y: 204, w: 26, d: 26, label: "PWR", fs: 9, l: [217], r: [217], t: [352], b: [343] });
  swIC(st, { x: 382, y: 92, w: 22, d: 40, label: "PHY", fs: 9, l: busY, r: busY, b: [393] });
  box(st, 386, 146, 14, 9, 4, "sw-xtal");
  eCap(st, 270, 241, 18);
  SW.aiLeds.push(box(st, 532, 352, 8, 10, 3, "sw-sled").r);

  // ---- the electronics, mounted right behind the screen (under the case until it opens)
  const Mb = L.mobo,
    Cp = L.cpu,
    H = L.hdd,
    Gp = L.gpu,
    lx = x => x - Mb.x,
    ly = y => y - Mb.y;
  const mobo = box(st, Mb.x, Mb.y, Mb.w, Mb.d, 4, "sw-mobo");
  mobo.t.insertAdjacentHTML(
    "beforeend",
    `<svg class="sw-mb" viewBox="0 0 ${Mb.w} ${Mb.d}">
    ${[0, 1, 2].map(i => `<path class="t" d="M${lx(102)} ${ly(316 + i * 10)}H${lx(112)}"/>`).join("")}
    ${[0, 1, 2].map(i => `<path class="t" d="M${lx(88 + i * 8)} ${ly(346)}V${ly(356)}L${lx(98 + i * 8)} ${ly(366)}H${lx(134)}"/><circle class="v" cx="${lx(134)}" cy="${ly(366)}" r="1.8"/>`).join("")}
    <rect class="sk" x="${lx(64)}" y="${ly(306)}" width="40" height="40" rx="2"/><rect class="sk" x="${lx(144)}" y="${ly(296)}" width="56" height="46"/>
    <text x="${lx(46)}" y="${ly(428)}" font-size="8">RC-MB 2X</text></svg>`,
  );
  // rear I/O along the back edge: USB and ethernet
  box(st, 44, 278, 12, 12, 10, "sw-io usb", 4);
  box(st, 60, 278, 14, 13, 10, "sw-io eth", 4);
  // VRM heatsink behind the socket, the CPU and its tower cooler
  box(st, 64, 296, 40, 8, 9, "sw-sink", 4);
  const cpu = box(st, Cp.cx - 18, Cp.cy - 18, 36, 36, 3, "sw-cpu", 4);
  cpu.t.textContent = "NODE";
  box(st, Cp.cx - 16, Cp.cy - 16, 32, 32, 10, "sw-sink", 7);
  const fan = cyl(st, Cp.cx, Cp.cy, 30, 5, "sw-fan", 17);
  div("sw-blades", fan.t);
  SW.fan = fan.t;
  // two DIMMs with their latches
  [0, 10].forEach(dx => {
    box(st, L.ram.x + 4 + dx, L.ram.y, 5, 46, 14, "sw-ram", 4);
    [L.ram.y - 4, L.ram.y + 46].forEach(y => box(st, L.ram.x + 4 + dx - 0.5, y, 6, 4, 6, "sw-latch", 4));
  });
  [0, 1, 2, 3].forEach(i => cyl(st, 150 + i * 12, 287, 8, 9, "sw-cap", 4));
  // drives: a stack of three disks (the database)
  const hdds = [0, 1, 2].map(i => {
    const d = box(st, H.x, H.y, H.w, H.d, 10, "sw-hdd", 4 + i * 14);
    const fr = d.r.querySelector(".bx-front");
    for (let k = 0; k < 3; k++) SW.leds.push(div("sw-hddled", fr, { left: px(6 + k * 7) }));
    if (i === 2) {
      div("sw-platter", d.t, { left: "4px", top: "3px", width: "22px", height: "22px" });
      SW.hddArm = div("sw-arm", d.t, { left: "44px", top: "21px", width: "22px", transform: "rotate(200deg)" });
    }
    return d.r;
  });
  const gpu = box(st, Gp.x, Gp.y, Gp.w, Gp.d, 9, "sw-gpu", 4);

  // ---- the monitor: the screen slab stays, the case behind it is the cover
  const bez = box(st, B.x, B.y, B.w, B.d, B.h, "sw-case"),
    fface = bez.r.querySelector(".bx-front");
  const scr = div("sw-screen", fface),
    cv = document.createElement("canvas");
  scr.appendChild(cv);
  const sdpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round((B.w - 20) * sdpr * 1.5);
  cv.height = Math.round((B.h - 36) * sdpr * 1.5);
  SW.ctx = cv.getContext("2d");
  SW.cw = cv.width;
  SW.ch = cv.height;
  const chin = div("sw-chin", fface);
  div("sw-badge", chin).textContent = "RC·TERM 2";
  div("sw-slot", chin);
  div("sw-pwr", chin);
  SW.cover = mkG(st, 0, 0);
  const W = 3,
    [Cf, Cb] = L.cover; // wall thickness; front (tall) and back (vented) halves
  SW.shells = L.cover.map((c, i) =>
    box(SW.cover, c.x, c.y, c.w, c.d, W, "sw-shell sw-lid" + (i ? " vent" : ""), c.h - W),
  ); // the two lids
  L.cover.forEach(c => {
    box(SW.cover, c.x, c.y, W, c.d, c.h - W, "sw-shell sw-wall in-r"); // left wall: its inner side faces the opening
    box(SW.cover, c.x + c.w - W, c.y, W, c.d, c.h - W, "sw-shell sw-wall vents"); // right wall, with its vent slots outside
  });
  box(SW.cover, Cb.x + W, Cb.y, Cb.w - 2 * W, W, Cb.h - W, "sw-shell sw-wall in-f"); // back wall
  box(SW.cover, Cf.x + W, Cf.y, Cf.w - 2 * W, W, Cf.h - Cb.h, "sw-shell sw-wall in-f", Cb.h - W); // the step between the two heights
  const stk = div("sw-sticker", SW.shells[0].t);
  stk.innerHTML = "RC·TERM 2<small>SN 0420 · 240 V ~ 2 A</small>";
  SW.shells.forEach(({ t }, i) => {
    const c = L.cover[i];
    [
      [6, 6],
      [c.w - 13, 6],
      [6, c.d - 13],
      [c.w - 13, c.d - 13],
    ].forEach(([x, y]) => div("sw-screw", t, { left: px(x), top: px(y) }));
  });

  // ---- keyboard: the function row switches what the screen shows
  const kbb = box(st, K.x, K.y, K.w, K.d, K.h, "sw-kb");
  const frow = div("sw-frow", kbb.t),
    keys = div("sw-keys", kbb.t),
    FR = [1.3, 1.2, 0.9, 0.8, 0.9],
    frw = (K.w - 14 - 16) / FR.reduce((a, b) => a + b);
  [
    ["DESIGN", "design"],
    ["FRONT", "front"],
    ["API", "api"],
    ["DB", "db"],
    ["OPS", "ops"],
  ].forEach(([l, m], i) => {
    const k = div("sw-fkey", frow);
    swFit(k, l, FR[i] * frw - 5, 9.5, { ls: 0.04 });
    k.dataset.mode = m;
    k.addEventListener("pointerdown", e => {
      e.stopPropagation();
      k.classList.add("down");
    });
    k.addEventListener("pointerup", e => {
      e.stopPropagation();
      k.classList.remove("down");
      swFocus(m);
    });
    k.addEventListener("pointerleave", () => k.classList.remove("down"));
    SW.fkeys.push(k);
  });
  for (let i = 0; i < 56; i++) SW.keys.push(div("sw-key", keys));

  // ---- soldering machine: layers come straight in from the computer and wait in their lane's slot;
  //      one iron on a gantry turns each stack into an image in the bay, which then goes to the pick-up pad
  const nameOn = (face, text, color, w, max) => {
    const n = div("sw-name", face);
    swFit(n, text, w, max, { ls: 0.1 });
    if (color) n.style.setProperty("--c", color);
    return n;
  };
  const bed = box(st, Bd.x, Bd.y, Bd.w, Bd.d, Bd.h, "sw-bed");
  const bx = L.bay - Bd.x,
    px0 = L.pad - Bd.x,
    NS2 = "http://www.w3.org/2000/svg";
  const fix = document.createElementNS(NS2, "svg");
  fix.setAttribute("class", "sw-fix");
  fix.setAttribute("viewBox", `0 0 ${Bd.w} ${Bd.d}`);
  fix.innerHTML = ["be", "fe"]
    .map(k => {
      const cy = L.lane[k] - Bd.y;
      return `<path class="fa" d="${cnr(bx - 37, cy - 26, 74, 52, 7)}"/><rect class="fb" x="${px0 - 15}" y="${cy - 15}" width="30" height="30" rx="2"/><path class="fa" d="M${bx + 41} ${cy - 4}l4 4l-4 4M${bx + 46} ${cy - 4}l4 4l-4 4"/>`;
    })
    .join("");
  bed.t.appendChild(fix);
  const dock = nameOn(bed.r.querySelector(".bx-front"), "DOCKER BUILD", "#ffb547", Bd.w - 24, 12.5);
  [Bd.y + 2, Bd.y + Bd.d - 12].forEach(y => box(st, L.bay - 5, y, 10, 10, L.beam - Bd.h, "mk-frame", Bd.h));
  box(st, L.bay - 4, Bd.y + 2, 8, Bd.d - 4, 8, "mk-metal", L.beam);
  // each bay is printed with the name of its stack, on the floor where the layers become an image
  SW.stacks = {};
  Object.entries(SW_STACKS).forEach(([k, S]) => {
    const y = L.lane[k],
      name = document.createElementNS(NS2, "text");
    name.setAttribute("class", "lane");
    name.setAttribute("x", bx);
    name.setAttribute("y", y - Bd.y + 21);
    name.setAttribute("text-anchor", "middle");
    name.style.setProperty("--c", S.color);
    fix.appendChild(name);
    swFit(name, S.label, 62, 11, { ls: 0.12 });
    SW.stacks[k] = { ...S, k, y, name, img: null, bay: null, roll: Promise.resolve() };
  });
  SW.head = mkG(st, L.bay, 0);
  box(SW.head, -9, -9, 18, 18, 16, "mk-amber", L.beam - 12); // carriage riding the beam
  SW.iron = mkG(SW.head, 0, 0);
  box(SW.iron, -1.5, -1.5, 3, 3, 44, "mk-metal", L.beam - 12); // plunger through the carriage
  box(SW.iron, -4, -4, 8, 8, 14, "mk-dark", L.beam - 26); // handle
  box(SW.iron, -2, -2, 4, 4, 16, "mk-metal", L.beam - 42); // barrel
  box(SW.iron, -1.5, -1.5, 3, 3, 6, "sw-tip", L.tip); // tip
  swHead((L.lane.be + L.lane.fe) / 2, 0);

  // ---- robot arm between the pick-up pads and the treadmills
  SW.arm = swBuildArm(st, A.x, A.y, A.s);
  SW.items = mkG(st, 0, 0);

  // ---- two treadmills into the Kubernetes machine (they only run while they carry an image)
  const fx0 = Bt.xs[0] - Bt.w / 2 - 4,
    fw = Bt.xs[1] - Bt.xs[0] + Bt.w + 8,
    blen = Bt.y1 - Bt.y0;
  box(st, fx0, Bt.y0, fw, blen + 3, 6, "mk-frame");
  SW.belts = Bt.xs.map(x => ({ r: box(st, x - Bt.w / 2, Bt.y0, Bt.w, blen, Bt.z - 6, "sw-belt", 6).r, n: 0 }));
  [
    [fx0, 3],
    [(Bt.xs[0] + Bt.xs[1]) / 2 - 2, 4],
    [fx0 + fw - 3, 3],
  ].forEach(([x, w]) => box(st, x, Bt.y0, w, blen + 3, 6, "mk-frame", 6));
  box(st, fx0, Bt.y1, fw, 3, 6, "mk-frame", 6);

  // ---- Kubernetes machine: an intake per treadmill, a column of three pods behind each, the AI port on the right
  const k8 = box(st, Kb.x, Kb.y, Kb.w, Kb.d, Kb.h, "sw-k8s"),
    kfr = k8.r.querySelector(".bx-front");
  const kube = nameOn(kfr, "KUBERNETES", "#7fb0ff", Kb.w - 18, 12.5);
  Bt.xs.forEach(x => div("sw-intake", kfr, { left: px(x - Kb.x - 13) }));
  const ax = Lk.xs[1] - Kb.x;
  k8.t.insertAdjacentHTML(
    "beforeend",
    `<svg class="sw-fix" viewBox="0 0 ${Kb.w} ${Kb.d}">${Bt.xs
      .map(
        (x, i) =>
          Kb.rows
            .map(y => `<rect class="fk" x="${x - Kb.x - 10}" y="${y - Kb.y - 10}" width="20" height="20" rx="2"/>`)
            .join("") +
          `<text x="${x - Kb.x}" y="${Kb.d - 5}" text-anchor="middle" font-size="9.5">${i ? "API" : "WEB"}</text>`,
      )
      .join("")}
    <rect x="${ax - 12}" y="26" width="24" height="70" rx="3" fill="rgba(255,111,216,.08)" stroke="rgba(255,143,217,.55)" stroke-width="1"/>
    <text x="${ax}" y="${Kb.d - 5}" text-anchor="middle" font-size="9.5" style="fill:#ffb3ef">AI</text></svg>` +
      `<svg class="sw-wheel" style="left:${(Bt.xs[0] + Bt.xs[1]) / 2 - Kb.x - 9}px;top:5px;width:18px;height:18px" viewBox="0 0 34 34" fill="none" stroke="#7fb0ff" stroke-width="2.6"><circle cx="17" cy="17" r="12"/><circle cx="17" cy="17" r="4" fill="#7fb0ff"/>${Array.from(
        { length: 7 },
        (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return `<path d="M${(17 + 5 * Math.cos(a)).toFixed(1)} ${(17 + 5 * Math.sin(a)).toFixed(1)}L${(17 + 15 * Math.cos(a)).toFixed(1)} ${(17 + 15 * Math.sin(a)).toFixed(1)}"/>`;
        },
      ).join("")}</svg>`,
  );
  [38, 58, 78].forEach(y => SW.aiLeds.push(div("sw-aled", k8.t, { left: px(ax - 3), top: px(y - 3) })));
  Object.values(SW.stacks).forEach(
    S =>
      (SW.pods[S.k] = Kb.rows.map(y => {
        const p = box(st, Bt.xs[S.lane] - 8, y - 8, 16, 16, 9, "sw-pod " + S.k, Kb.h - 10);
        return { r: p.r, t: p.t };
      })),
  );

  // ---- the internet: a projector, the globe itself is drawn on the overlay
  cyl(st, G.cx, G.cy, 48, 22, "sw-ped", 0);
  cyl(st, G.cx, G.cy, 30, 5, "mk-lens", 22);

  // ---- pipeline console (GitHub Actions): one lamp per stage
  const ci = box(st, Ci.x, Ci.y, Ci.w, Ci.d, Ci.h, "sw-ci");
  ["build", "test", "push", "deploy"].forEach((k, i) => {
    const c = div("sw-step", ci.t);
    SW.lamps[k] = div("sw-lamp", c);
    swFit(div("", c), k.toUpperCase(), (Ci.w - 18) * (i < 2 ? 0.45 : 0.55) - 14, 10, { ls: 0.05 });
  });
  const gha = nameOn(ci.r.querySelector(".bx-front"), "GITHUB ACTIONS", "#9fb6ff", Ci.w - 16, 11);

  // what each function key lights up on the face
  const fe = SW.stacks.fe,
    be = SW.stacks.be;
  SW.hot = { design: [gpu.r], front: [fe.name], api: [be.name], db: [...hdds], ops: [dock, kube, gha] }; // layers in flight are lit through their data-hot

  const ov = document.createElement("canvas"),
    odpr = Math.min(2, window.devicePixelRatio || 1);
  ov.className = "sw-overlay";
  ov.width = ov.height = Math.round(900 * odpr);
  $("#world").appendChild(ov);
  SW.ov = ov;
  SW.octx = ov.getContext("2d");
  SW.odpr = odpr;
  swDraw();
  if (document.fonts)
    Promise.all([document.fonts.load(`600 10px ${SW_BODY}`), document.fonts.load(`10px ${SW_MONO}`)])
      .then(() => {
        SWFIT.forEach(swRefit);
        swDraw();
      })
      .catch(() => {});
}
/* a pulse of light along one of the named copper runs */
function swTrace(name, rev = false, dur = 650) {
  const t = SW.tr[name];
  if (!t || reduce) return Promise.resolve();
  const seg = Math.min(36, t.len * 0.6),
    L = t.len;
  t.el.style.strokeDasharray = `${seg} ${L + seg}`;
  const a = rev
    ? [
        { strokeDashoffset: -L, opacity: 1 },
        { strokeDashoffset: seg, opacity: 1 },
      ]
    : [
        { strokeDashoffset: seg, opacity: 1 },
        { strokeDashoffset: -L, opacity: 1 },
      ];
  return t.el.animate(a, { duration: dur, easing: "linear" }).finished.catch(() => {});
}
function swProject(M, sx, sy, sz) {
  const fx = 560 - sx,
    fy = 560 - sy,
    fz = sz;
  const w = rx(ry(mv(M, [fz + 280.5, fy - 280, -(fx - 280)]), YAW), ISO);
  return [600 + w[0], 634 + w[1], w[2]];
}
/* the monitor: code on the left, the running app on the right; focus modes take the whole screen */
function swDraw() {
  const c = SW.ctx,
    W = SW.cw,
    H = SW.ch,
    s0 = W / 180;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#04110f";
  c.fillRect(0, 0, W, H);
  c.scale(s0, s0);
  const w = W / s0,
    h = H / s0,
    F = SW_MONO;
  c.textBaseline = "top";
  const mode = SW.mode;
  if (mode === "loop" || mode === "front") {
    const cw = w * 0.6;
    c.fillStyle = "#0a2420";
    c.fillRect(0, 0, cw, h);
    c.save();
    c.beginPath();
    c.rect(0, 0, cw - 1, h);
    c.clip();
    c.font = `7.6px ${F}`;
    c.fillStyle = "#3fd29a";
    c.fillText(SW.file || "src/App.tsx", 4, 3);
    c.font = `7.2px ${F}`;
    SW.lines.forEach((l, i) => {
      c.fillStyle = l.startsWith("$") ? "#ffd166" : "#bff7e0";
      c.fillText(l, 4, 15 + i * 9.8);
    });
    if (SW.caret) {
      const last = SW.lines[SW.lines.length - 1] || "";
      c.fillStyle = "#3fd29a";
      c.fillRect(4 + c.measureText(last).width + 1, 15 + (SW.lines.length - 1) * 9.8, 3.6, 7.4);
    }
    c.restore();
    const ux = w * 0.62,
      uw = w * 0.36;
    c.fillStyle = "#101a3a";
    c.fillRect(ux, 3, uw, h - 6);
    c.fillStyle = "#58a9ff";
    c.fillRect(ux, 3, uw, 12);
    c.fillStyle = "#fff";
    c.font = `6.8px ${F}`;
    c.fillText("localhost:3000", ux + 3, 5.6);
    (SW.ui.length ? SW.ui : [null, null, null]).forEach((r, i) => {
      const y = 19 + i * 26;
      c.fillStyle = r ? "#1d2a5e" : "#141c40";
      c.fillRect(ux + 3, y, uw - 6, 22);
      c.save();
      c.beginPath();
      c.rect(ux + 3, y, uw - 7, 22);
      c.clip();
      if (r) {
        c.fillStyle = "#e8ecff";
        c.font = `7.4px ${F}`;
        c.fillText(r[0], ux + 6, y + 3);
        c.fillStyle = "#63e6be";
        c.font = `6.4px ${F}`;
        c.fillText(r[1] + " · " + r[2], ux + 6, y + 12.5);
      } else {
        c.fillStyle = "#26305e";
        c.fillRect(ux + 6, y + 5, uw * 0.5, 4);
        c.fillRect(ux + 6, y + 13, uw * 0.3, 4);
      }
      c.restore();
    });
  } else {
    const title = {
      design: "DESIGN TOKENS",
      api: "API · request / response",
      db: "psql · projects",
      ops: "kubectl get pods",
    }[mode];
    c.font = `7.6px ${F}`;
    c.fillStyle = "#3fd29a";
    c.fillText(title, 4, 3);
    const body = {
      design: [
        "--accent   #ff6fd8",
        "--info     #58a9ff",
        "--ok       #63e6be",
        "--warn     #ffb547",
        "--board    #23286e",
        "font-label Michroma",
        "font-body  Chakra Petch",
        "radius     4 / 8 / 12",
      ],
      api: [
        "> GET /api/projects",
        "  200 OK · 18 ms",
        "  [{ name: 'HomeInOne', …},",
        "   { name: 'PassPass', …}]",
        "> POST /api/auth",
        "  201 Created · jwt",
        "> query { projects { name } }",
        "  200 OK · GraphQL",
      ],
      db: [
        "projects=# " + SW_SQL[0],
        "  " + SW_SQL[1],
        "  " + SW_SQL[2],
        "  " + SW_SQL[3],
        "  name      | stack | commits",
        "  HomeInOne | Node  | 1204",
        "  PassPass  | Bot   |  842",
        "(3 rows)",
      ],
      ops: [
        "NAME              READY  STATUS",
        "api-7d9f-x2kq     1/1    Running",
        "api-7d9f-m8zt     1/1    Running",
        "api-7d9f-c4wd     1/1    Running",
        "web-5c4b-q1lp     1/1    Running",
        "web-5c4b-r7vn     1/1    Running",
        "web-5c4b-h2sj     1/1    Running",
        "$ kubectl rollout status ok",
      ],
    }[mode];
    c.font = `7.2px ${F}`;
    body.forEach((l, i) => {
      c.fillStyle = i % 4 === 0 ? "#ffd166" : "#bff7e0";
      c.fillText(l, 4, 15 + i * 11);
    });
  }
}
const SW_KEYMAP = (() => {
  const m = {},
    rows = [
      ["`1234567890-=", "~!@#$%^&*()_+"],
      ["\tqwertyuiop[]\\", "\tQWERTYUIOP{}|"],
      ["\0asdfghjkl;'\n", '\0ASDFGHJKL:"\n'],
      ["\0zxcvbnm,./", "\0ZXCVBNM<>?"],
    ];
  rows.forEach(([lo, hi], r) => {
    [...lo].forEach((c, i) => (m[c] = [r * 14 + i + (r === 3 ? 1 : 0), 0]));
    [...hi].forEach((c, i) => {
      if (!(c in m)) m[c] = [r * 14 + i + (r === 3 ? 1 : 0), 1];
    });
  });
  return m;
})();
function swPressKey(ch) {
  if (!SW.keys.length) return;
  const press = i => {
    const k = SW.keys[i];
    if (!k) return;
    k.classList.add("down");
    setTimeout(() => k.classList.remove("down"), 85);
  };
  if (ch === " ") return [3 * 14 + 5, 3 * 14 + 6, 3 * 14 + 7].forEach(press); // the space bar: the middle of the bottom row
  const e = SW_KEYMAP[ch];
  if (!e) return press(Math.floor(Math.random() * SW.keys.length));
  press(e[0]);
  if (e[1]) press(Math.random() < 0.5 ? 3 * 14 : 3 * 14 + 13); // Shift on one side or the other
}
function swFocus(m) {
  SW.mode = SW.mode === m ? "loop" : m;
  SW.fkeys.forEach(k => k.classList.toggle("on", k.dataset.mode === SW.mode));
  Object.entries(SW.hot).forEach(([k, els]) => els.forEach(el => el.classList.toggle("hot", k === SW.mode)));
  SW.items.querySelectorAll(".sw-plate").forEach(el => el.classList.toggle("hot", el.dataset.hot === SW.mode));
  swDraw();
}
const swOK = gen => gen === SW.gen;
const swPlace = (g, x, y, z) =>
  (g.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px)`);
const swLamp = (k, s) => (SW.lamps[k].className = "sw-lamp" + (s ? " " + s : ""));
const swTerm = l => {
  SW.lines.push(l);
  if (SW.mode === "loop" || SW.mode === "front") swDraw();
};

/* ---------------- overlay: the globe and the sparks of the iron ---------------- */
function swOverlayTick(now) {
  const ctx = SW.octx,
    dpr = SW.odpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, SW.ov.width, SW.ov.height);
  if (!SW.open && (SW.fade || 0) <= 0.001) {
    SW.raf = 0;
    SW.tPrev = 0;
    return;
  }
  SW.raf = requestAnimationFrame(swOverlayTick);
  const M = qMat(Q),
    vis = rx(ry(mv(M, [1, 0, 0]), YAW), ISO)[2] > 0.02;
  if (!vis || (ROLL.active && !ROLL.keep.has("right"))) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const P = (x, y, z) => swProject(M, x, y, z),
    dt = Math.min(0.05, (now - (SW.tPrev || now)) / 1000);
  SW.tPrev = now;
  swDrawGlobe(ctx, P, now / 1000);
  swDrawSparks(ctx, P, dt);
}
/* wireframe globe: the far half is drawn dimmer than the near half, so it reads as a sphere */
function swDrawGlobe(ctx, P, t) {
  const G = SWL.globe,
    R = G.r,
    live = SW.live || 0,
    c = P(G.cx, G.cy, G.z),
    base = P(G.cx, G.cy, 27);
  const rgb = `${Math.round(127 - 28 * live)},${Math.round(196 + 34 * live)},${Math.round(255 - 65 * live)}`;
  ctx.globalAlpha = SW.fade || 0;
  // projection cone from the lens
  const cone = ctx.createLinearGradient(0, base[1], 0, c[1]);
  cone.addColorStop(0, `rgba(${rgb},${0.22 + 0.2 * live})`);
  cone.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(base[0] - 11, base[1]);
  ctx.lineTo(c[0] - R * 0.86, c[1] + R * 0.3);
  ctx.lineTo(c[0] + R * 0.86, c[1] + R * 0.3);
  ctx.lineTo(base[0] + 11, base[1]);
  ctx.closePath();
  ctx.fill();
  // body
  const g = ctx.createRadialGradient(c[0] - R * 0.35, c[1] - R * 0.4, R * 0.1, c[0], c[1], R);
  g.addColorStop(0, `rgba(${rgb},${0.2 + 0.12 * live})`);
  g.addColorStop(1, "rgba(14,20,90,.18)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c[0], c[1], R, 0, Math.PI * 2);
  ctx.fill();
  if (live > 0.01) {
    const gl = ctx.createRadialGradient(c[0], c[1], R * 0.7, c[0], c[1], R * 1.5);
    gl.addColorStop(0, `rgba(99,230,190,${0.22 * live})`);
    gl.addColorStop(1, "rgba(99,230,190,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(c[0], c[1], R * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // parallels and meridians, split into far and near halves
  const far = new Path2D(),
    near = new Path2D(),
    N = 48;
  const ringPath = fn => {
    let p = fn(0);
    for (let k = 1; k <= N; k++) {
      const q = fn((k / N) * Math.PI * 2),
        path = (p[2] + q[2]) / 2 >= c[2] ? near : far;
      path.moveTo(p[0], p[1]);
      path.lineTo(q[0], q[1]);
      p = q;
    }
  };
  for (let la = -60; la <= 60; la += 30) {
    const r0 = R * Math.cos(la * D2R),
      z0 = G.z + R * Math.sin(la * D2R);
    ringPath(a => P(G.cx + r0 * Math.cos(a), G.cy + r0 * Math.sin(a), z0));
  }
  for (let lo = 0; lo < 180; lo += 30) {
    const a0 = lo * D2R + t * 0.5;
    ringPath(b =>
      P(G.cx + R * Math.cos(b) * Math.cos(a0), G.cy + R * Math.cos(b) * Math.sin(a0), G.z + R * Math.sin(b)),
    );
  }
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${rgb},.2)`;
  ctx.stroke(far);
  ctx.strokeStyle = `rgba(${rgb},${0.62 + 0.3 * live})`;
  ctx.stroke(near);
  ctx.strokeStyle = `rgba(${rgb},${0.5 + 0.3 * live})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(c[0], c[1], R, 0, Math.PI * 2);
  ctx.stroke();
  // live traffic: three points orbiting on tilted rings
  if (live > 0.01)
    for (let k = 0; k < 3; k++) {
      const a = t * (1.1 + 0.25 * k) + k * 2.1,
        tilt = (k - 1) * 0.6,
        r1 = R + 6;
      const q = P(
        G.cx + r1 * Math.cos(a),
        G.cy + r1 * Math.sin(a) * Math.cos(tilt),
        G.z + r1 * Math.sin(a) * Math.sin(tilt),
      );
      ctx.globalAlpha = (SW.fade || 0) * live * (q[2] >= c[2] ? 1 : 0.3);
      ctx.fillStyle = "#eafff8";
      ctx.shadowColor = "#63e6be";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  ctx.globalAlpha = 1;
}
/* sparks thrown by the iron while it works on a stack (stage-space particles, projected every frame) */
function swDrawSparks(ctx, P, dt) {
  const L = SWL,
    tip = [L.bay, SW.hy, L.tip - SW.hd],
    S = SW.sparks;
  if (SW.hotTip && !reduce)
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * Math.PI * 2,
        v = 30 + Math.random() * 60;
      S.push({
        p: tip.slice(),
        v: [Math.cos(a) * v, Math.sin(a) * v, 50 + Math.random() * 90],
        life: 0,
        max: 0.22 + Math.random() * 0.3,
      });
    }
  if (SW.hotTip) {
    const q = P(...tip),
      g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 15);
    g.addColorStop(0, "rgba(255,240,200,.9)");
    g.addColorStop(0.3, "rgba(255,181,71,.5)");
    g.addColorStop(1, "rgba(255,181,71,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q[0], q[1], 15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = "round";
  ctx.lineWidth = 1.3;
  for (let i = S.length - 1; i >= 0; i--) {
    const s = S[i];
    s.life += dt;
    if (s.life > s.max) {
      S.splice(i, 1);
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
}

/* ---------------- robot arm: same joints as the factory's arms, driven in cylindrical coordinates ---------------- */
function swBuildArm(st, x, y, s) {
  const { L1, L2 } = SWARM,
    root = mkG(st, x, y, `scale3d(${s},${s},${s})`);
  cyl(root, 0, 0, 42, 6, "mk-dark", 0);
  const ring = cyl(root, 0, 0, 36, 5, "mk-gear", 6),
    rg = div("gear", ring.t);
  const tt = mkG(root, 0, 0, "translateZ(11px)");
  box(tt, -13, -13, 26, 26, 4, "mk-amber");
  box(tt, -8, -13, 16, 4, 32, "mk-frame", 4);
  box(tt, -8, 9, 16, 4, 32, "mk-frame", 4);
  const sh = mkG(tt, 0, 0, "translateZ(28px)");
  box(sh, -4, -12, 8, 24, 8, "mk-metal", -4);
  box(sh, -5, -5, 10, 10, L1 + 6, "mk-metal", -3);
  box(sh, -7, -9, 14, 4, 16, "mk-frame", L1 - 8);
  box(sh, -7, 5, 14, 4, 16, "mk-frame", L1 - 8);
  const el = mkG(sh, 0, 0, `translateZ(${L1}px)`);
  box(el, -3, -10, 6, 20, 6, "mk-amber", -3);
  box(el, -4, -4, 8, 8, L2 + 2, "mk-metal", -2);
  const wr = mkG(el, 0, 0, `translateZ(${L2}px)`);
  box(wr, -6, -6, 12, 12, 8, "mk-amber", -4);
  const grip = mkG(wr, 0, 0); // counter-turned so the jaws stay square with the line
  box(grip, -21, -5, 42, 10, 4, "mk-dark", 4);
  const f1 = box(grip, -21, -4, 3, 8, 12, "mk-amber", 8),
    f2 = box(grip, 18, -4, 3, 8, 12, "mk-amber", 8);
  const arm = { x, y, s, tt, sh, el, wr, grip, rg, fingers: [f1.r, f2.r], C: SW_REST.slice(), hold: null };
  swArmPose(arm, arm.C);
  return arm;
}
/* wrist at [θ, r, z] around the base (stage units), gripper pointing straight down */
function swArmPose(arm, C) {
  arm.C = C;
  const { L1, L2, H } = SWARM,
    [th, r0, z0] = C,
    r = r0 / arm.s,
    hz = z0 / arm.s - H;
  const d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, Math.hypot(r, hz)));
  const phi = Math.atan2(r, hz),
    k = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const a = phi - k,
    a2 = Math.atan2(r - L1 * Math.sin(a), hz - L1 * Math.cos(a)),
    deg = th / D2R;
  arm.tt.style.transform = `translateZ(11px) rotateZ(${th.toFixed(4)}rad)`;
  arm.tt.style.setProperty("--R", (180 + deg).toFixed(1) + "deg");
  arm.rg.style.setProperty("--ga", deg.toFixed(1) + "deg");
  arm.sh.style.transform = `translateZ(28px) rotateY(${a.toFixed(4)}rad)`;
  arm.el.style.transform = `translateZ(${L1}px) rotateY(${(a2 - a).toFixed(4)}rad)`;
  arm.wr.style.transform = `translateZ(${L2}px) rotateY(${(Math.PI - a2).toFixed(4)}rad)`;
  arm.grip.style.transform = `rotateZ(${th.toFixed(4)}rad)`;
  if (arm.hold)
    swPlace(arm.hold.g, arm.x + r0 * Math.cos(th), arm.y + r0 * Math.sin(th), z0 - SWARM.grip * arm.s - arm.hold.h);
}
function swArmMove(gen, arm, to, dur) {
  const from = arm.C;
  return swAnim(gen, dur, t =>
    swArmPose(
      arm,
      from.map((v, i) => swLerp(v, to[i], t)),
    ),
  );
}
const swRestAngle = th => Math.PI + 2 * Math.PI * Math.round((th - Math.PI) / (2 * Math.PI)); // the rest pose, on the turn the arm is on
function swGrip(arm, closed) {
  arm.fingers.forEach((f, i) => (f.style.transform = closed ? `translateX(${i ? -3.5 : 3.5}px)` : ""));
}

/* ---------------- the line, station by station ----------------
   Three workers run side by side, so the line never stops:
   · the computer types feature after feature; each stack's layers slide out straight into that lane's bay
     (one stack per bay: a lane's next stack is only built once its bay is free);
   · the iron alternates front end / back end, soldering each complete stack into an image;
   · the arm takes every image as soon as it reaches its pad; Kubernetes rolls it out. */
function swHead(y, drop) {
  SW.hy = y;
  SW.hd = drop;
  SW.head.style.transform = `translateY(${y.toFixed(1)}px)`;
  SW.iron.style.transform = `translateZ(${(-drop).toFixed(1)}px)`;
}
const SW_TYPE_MS = 3400; // typing one stack takes about as long as soldering one
async function swUntil(gen, cond) {
  while (swOK(gen) && !cond()) await mkWait(gen, 60);
  return swOK(gen);
}
const swPlateHot = (k, i) => (k === "fe" ? (i ? "front" : "design") : i ? "api" : "db");
function swBatchSet(S, batch, x, gap, sc) {
  const P = SWL.plate;
  batch.plates.forEach(
    (p, i) =>
      (p.g.style.transform = `translate3d(${x.toFixed(1)}px,${S.y}px,${(P.z + i * gap).toFixed(1)}px) scale(${sc.toFixed(3)})`),
  );
}
async function swSeek(gen, n) {
  for (let i = 0; i < n; i++) {
    if (!swOK(gen)) return;
    SW.hddArm.style.transform = `rotate(${(185 + Math.random() * 40).toFixed(0)}deg)`;
    SW.leds.forEach(l => l.classList.toggle("on", Math.random() < 0.5));
    await mkWait(gen, 150);
  }
  SW.leds.forEach(l => l.classList.remove("on"));
  SW.hddArm.style.transform = "rotate(200deg)";
}
/* one layer appears above the electronics and slides out of the computer, straight to its place in the bay */
async function swEmit(gen, S, batch, i, delay) {
  const P = SWL.plate,
    [c, n, sub] = SW_STACKS[S.k].plates[i],
    z = P.z + i * P.gap;
  if (delay) await mkWait(gen, delay);
  if (!swOK(gen)) return;
  const g = mkG(SW.items, 0, 0),
    el = div("sw-plate", g),
    hot = swPlateHot(S.k, i);
  el.style.setProperty("--c", c);
  el.dataset.hot = hot;
  el.classList.toggle("hot", SW.mode === hot);
  swFit(div("", el, null, "b"), n, 58, 10.5, { ls: 0.04 });
  swFit(div("", el, null, "small"), sub, 58, 8.5, { fam: SW_MONO, wt: 400, ls: 0 });
  const at = x => (g.style.transform = `translate3d(${x.toFixed(1)}px,${S.y}px,${z}px)`);
  batch.plates[i] = { g, el };
  at(P.x0);
  el.style.opacity = 1;
  await mkWait(gen, 180);
  await swAnim(gen, 900, t => at(swLerp(P.x0, SWL.bay, t)));
}
/* type lines on the monitor; the stack's three layers come out evenly while it is written (at a third, two thirds, the end).
   A layer is only built if it has a spot: the lane's bay must be free. Until it is, the computer runs its tests. */
async function swTypeBuild(gen, file, lines, S, ver) {
  if (S.bay) {
    SW.file = "terminal";
    SW.lines = [];
    swTerm("$ npm test -- --watch");
    swLamp("test", "on");
    for (let i = 0; S.bay && swOK(gen); i++) {
      await swSeek(gen, 4);
      if (S.bay) swTerm(`  ✓ ${["api", "auth", "ui", "db"][i % 4]}.spec.ts`);
      if (SW.lines.length > 6) SW.lines.splice(1, 1);
    }
    swLamp("test", "ok");
  }
  if (!swOK(gen)) return;
  const batch = { ver, plates: [], done: false };
  S.bay = batch;
  const total = lines.reduce((a, l) => a + l.length, 0),
    dt = Math.max(22, Math.min(70, (SW_TYPE_MS - 90 * lines.length) / total));
  SW.file = file;
  SW.lines = [""];
  let typed = 0,
    n = 0;
  const jobs = [];
  const emit = () => {
    jobs.push(swEmit(gen, S, batch, n++, 0));
    swTrace("usb_up0", false, 380);
    swTrace("usb_up1", false, 440);
  };
  for (const line of lines) {
    for (const ch of line) {
      if (!swOK(gen)) return;
      SW.lines[SW.lines.length - 1] += ch;
      swPressKey(ch);
      SW.caret = true;
      if (SW.mode === "loop" || SW.mode === "front") swDraw();
      if (++typed >= ((n + 1) / 3) * total && n < 2) emit();
      await mkWait(gen, dt);
    }
    [0, 1, 2, 3].forEach(k => swTrace("kb" + k, false, 260 + 40 * k));
    [0, 1, 2].forEach(k => swTrace("usb" + k, false, 320 + 40 * k));
    SW.lines.push("");
    await mkWait(gen, 90);
  }
  emit();
  SW.lines.pop();
  SW.caret = false;
  swDraw();
  Promise.all(jobs).then(() => (batch.done = true));
}
/* the iron works across the stack three times; every pass squeezes the layers closer and smaller,
   until they are one block: the image. It then slides to the pick-up pad. */
async function swSolder(gen, S, batch) {
  const L = SWL,
    P = L.plate,
    gaps = [P.gap, 8, 5, 3],
    scs = [1, 0.8, 0.62, 0.46],
    topZ = gap => P.z + 2 * gap;
  swLamp("build", "on");
  swTrace("ctl_solder", false, 700);
  swTrace("pw_in", false, 500).then(() => swTrace("pw_bed", false, 420));
  const y0 = SW.hy,
    d00 = SW.hd;
  await swAnim(gen, 450, t => swHead(swLerp(y0, S.y, t), d00 * (1 - t)));
  for (let pass = 0; pass < 3; pass++) {
    const dir = pass % 2 ? -1 : 1,
      d0 = SW.hd,
      h0 = SW.hy,
      reach = 17 * scs[pass];
    await swAnim(gen, 240, t => swHead(swLerp(h0, S.y - dir * reach, t), swLerp(d0, L.tip - topZ(gaps[pass]), t)));
    if (!swOK(gen)) return;
    SW.hotTip = true;
    await swAnim(
      gen,
      720,
      t => {
        const gap = swLerp(gaps[pass], gaps[pass + 1], t);
        swBatchSet(S, batch, L.bay, gap, swLerp(scs[pass], scs[pass + 1], t));
        swHead(S.y - dir * reach * (1 - 2 * t), L.tip - topZ(gap));
      },
      t => t,
    );
    SW.hotTip = false;
    if (!swOK(gen)) return;
    await swAnim(gen, 160, t =>
      swHead(SW.hy, swLerp(L.tip - topZ(gaps[pass + 1]), L.tip - topZ(gaps[pass + 1]) - 8, t)),
    );
  }
  if (!swOK(gen)) return;
  const img = swImage(S, batch.ver),
    at = (x, k) =>
      (img.g.style.transform = `translate3d(${x.toFixed(1)}px,${S.y}px,${L.bed.h}px) scale3d(${k.toFixed(3)},${k.toFixed(3)},${k.toFixed(3)})`);
  at(L.bay, 0.55); // in the bay from its very first frame (it is created at the stage origin)
  batch.plates.forEach(p => p.g.remove());
  const d1 = SW.hd;
  await swAnim(
    gen,
    260,
    t => {
      at(L.bay, swLerp(0.55, 1, t));
      swHead(swLerp(SW.hy, S.y, t), swLerp(d1, 0, t));
    },
    eout,
  );
  swLamp("build", "ok");
  if (!(await swUntil(gen, () => !S.img))) return; // the pad is still taken: the arm is on its way
  await swAnim(gen, 560, t => at(swLerp(L.bay, L.pad, t), 1));
  if (!swOK(gen)) return;
  S.img = img;
  S.bay = null; // the bay is free: the computer may build the next stack
}
function swImage(S, ver) {
  const g = mkG(SW.items, 0, 0),
    b = box(g, -13, -13, 26, 26, 22, "sw-img");
  SW_STACKS[S.k].plates.forEach((p, i) => b.r.style.setProperty("--c" + (i + 1), p[0]));
  b.r.style.setProperty("--ct", S.top);
  b.t.innerHTML = `${S.image}<small>v${ver}</small>`;
  return { g, h: 22, ver };
}
/* pick the image up from its pad, swing it over, set it down on its treadmill; resolves when the arm is clear */
async function swCarry(gen, S) {
  const L = SWL,
    A = L.arm,
    arm = SW.arm,
    img = S.img,
    up = 92;
  if (!img) return null;
  const T = 2 * Math.PI,
    base = Math.atan2(S.y - A.y, L.pad - A.x),
    r0 = Math.hypot(S.y - A.y, L.pad - A.x);
  const th0 = base + T * Math.round((arm.C[0] - base) / T),
    th1 = T * Math.round(th0 / T); // nearest turn to the pad; then swing away from the machine
  const r1 = L.belt.xs[S.lane] - A.x,
    grip = SWARM.grip * arm.s,
    swing = (a, b) => 380 + 230 * Math.abs(a - b);
  swGrip(arm, false);
  await swArmMove(gen, arm, [th0, r0, up], swing(arm.C[0], th0));
  await swArmMove(gen, arm, [th0, r0, L.bed.h + img.h + grip], 320);
  if (!swOK(gen)) return null;
  swGrip(arm, true);
  arm.hold = img;
  S.img = null;
  await mkWait(gen, 120);
  await swArmMove(gen, arm, [th0, r0, up], 320);
  await swArmMove(gen, arm, [th1, r1, up], swing(th0, th1));
  await swArmMove(gen, arm, [th1, r1, L.belt.z + img.h + grip], 320);
  if (!swOK(gen)) return null;
  swGrip(arm, false);
  arm.hold = null;
  const ride = swRide(gen, img, S.lane);
  await swArmMove(gen, arm, [th1, r1, up], 260);
  return { ride, ver: img.ver };
}
/* the treadmill carries the image into the machine's intake */
async function swRide(gen, img, lane) {
  const L = SWL,
    x = L.belt.xs[lane],
    y0 = L.arm.y,
    y1 = L.k8s.y + L.k8s.d - 22,
    belt = SW.belts[lane];
  belt.n++;
  belt.r.classList.add("run");
  await swAnim(
    gen,
    ((y0 - y1) / L.belt.v) * 1000,
    t => swPlace(img.g, x, swLerp(y0, y1, t), L.belt.z),
    t => t,
  );
  if (gen === SW.gen && --belt.n <= 0) {
    belt.n = 0;
    belt.r.classList.remove("run");
  }
  img.g.remove();
}
/* rolling update: each pod of the column drops into the machine and comes back up on the new version */
async function swRollout(gen, k, ver) {
  const z0 = SWL.k8s.h - 10,
    setZ = (p, z) => p.r.style.setProperty("--z", z.toFixed(1) + "px");
  for (const p of SW.pods[k]) {
    if (!swOK(gen)) return;
    if (p.up)
      await swAnim(
        gen,
        200,
        t => setZ(p, z0 + 10 * (1 - t)),
        t => t * t,
      );
    p.t.textContent = "v" + ver;
    p.r.classList.add("fresh");
    p.up = true;
    await swAnim(gen, 300, t => setZ(p, z0 + 10 * t), eout);
    setTimeout(() => p.r.classList.remove("fresh"), 700);
  }
}
/* worker 1: the computer. Front end, a quick test, back end, a commit; each half lasts about as long as one solder,
   so it writes one lane while the iron works on the other */
async function swProduce(gen) {
  const fe = SW.stacks.fe,
    be = SW.stacks.be;
  for (let f = 0; swOK(gen); f++) {
    const F = SW_FEATURES[f % SW_FEATURES.length],
      ver = ++SW.ver;
    SW.ui = [];
    await swTypeBuild(gen, "src/App.tsx", F.fe, fe, ver);
    if (!swOK(gen)) return;
    swLamp("test", "on");
    SW.fan.style.setProperty("--fs", ".25s");
    await swSeek(gen, 3);
    SW.fan.style.setProperty("--fs", "1.2s");
    for (const r of F.rows) {
      if (!swOK(gen)) return;
      SW.ui.push(r);
      swDraw();
      await mkWait(gen, 130);
    }
    swLamp("test", "ok");
    await swTypeBuild(gen, "server/api.ts", F.be, be, ver);
    if (!swOK(gen)) return;
    SW.file = "terminal";
    SW.lines = [];
    swTerm(`$ git commit -m "v${ver}"`);
    await mkWait(gen, 300);
    swTerm("$ git push");
    await mkWait(gen, 450);
    if (reduce) return; // no motion: one finished cycle is the still picture
  }
}
/* worker 2: the iron. Front end, back end, front end… each as soon as its stack is complete in its bay */
async function swIron(gen) {
  for (let k = "fe", made = 0; swOK(gen); k = k === "fe" ? "be" : "fe") {
    const S = SW.stacks[k];
    if (!(await swUntil(gen, () => S.bay && S.bay.done))) return;
    await swSolder(gen, S, S.bay);
    if (reduce && ++made >= 2) return;
  }
}
/* worker 3: the arm and the cluster. Every image goes out as soon as it is on its pad; each lane rolls out in order */
async function swDeliver(gen) {
  const fe = SW.stacks.fe,
    be = SW.stacks.be;
  for (let sent = 0; swOK(gen);) {
    if (!(await swUntil(gen, () => fe.img || be.img))) return;
    const S = fe.img && (!be.img || fe.img.ver <= be.img.ver) ? fe : be;
    swLamp("push", "on");
    swTrace("ctl_arm", false, 700);
    swTrace("pw_arm", false, 760);
    const c = await swCarry(gen, S);
    if (!swOK(gen)) return;
    swLamp("push", "ok");
    if (c)
      S.roll = Promise.all([S.roll, c.ride]).then(async () => {
        if (!swOK(gen)) return;
        swLamp("deploy", "on");
        swTrace("ctl_k8s", false, 900);
        swTrace("pw_k8s", false, 900);
        await swRollout(gen, S.k, c.ver);
        if (!swOK(gen)) return;
        swLamp("deploy", "ok");
        for (let i = 0; i < 3; i++) {
          swTrace("bus" + i, true, 600);
          await mkWait(gen, 160);
        }
        if ((SW.live || 0) < 1) swAnim(gen, 600, t => (SW.live = Math.max(SW.live || 0, t)));
      });
    if (reduce && ++sent >= 2) return;
    // nothing waiting: the arm goes back to rest until the next image
    if (!fe.img && !be.img) {
      await swArmMove(gen, SW.arm, [swRestAngle(SW.arm.C[0]), SW_REST[1], SW_REST[2]], 700);
      if (swOK(gen)) SW.arm.C = SW_REST.slice();
    }
  }
}
function swLoop(gen) {
  Object.values(SW.stacks).forEach(S => {
    S.bay = null;
    S.img = null;
    S.roll = Promise.resolve();
  });
  Object.keys(SW.lamps).forEach(k => swLamp(k));
  swProduce(gen);
  swIron(gen);
  swDeliver(gen);
}
/* once live, requests and answers run between the machine and the globe; now and then the API asks the AI */
function swTraffic() {
  if (SW.open && SW.live > 0.5 && !ROLL.active) {
    if (Math.random() < 0.3) swAskAI(Math.floor(Math.random() * 3));
    else {
      swTrace("bus" + Math.floor(Math.random() * 3), Math.random() < 0.5, 600);
      if (Math.random() < 0.3) swTrace("xt", false, 300);
    }
  }
  if (SW.open) SW.trafficT = setTimeout(swTraffic, 500 + Math.random() * 900);
}
const swAILeds = on => SW.aiLeds.forEach(l => l.classList.toggle("on", on));
/* a request leaves Kubernetes, crosses the edge, runs on into the AI face towards the core; the answer comes back */
async function swAskAI(k) {
  const gen = SW.gen;
  swAILeds(true);
  await swTrace("ai" + k, true, 520);
  if (!swOK(gen)) return swAILeds(false);
  const el = AI_LINK[k] != null && document.querySelectorAll(".ai-flow")[AI_LINK[k]];
  if (el && !reduce) {
    const len = el.getTotalLength(),
      seg = 26;
    el.style.strokeDasharray = `${seg} ${len + seg}`;
    await el
      .animate(
        [
          { strokeDashoffset: seg, opacity: 1 },
          { strokeDashoffset: -len, opacity: 1 },
        ],
        { duration: len * 5, easing: "linear" },
      )
      .finished.catch(() => {});
  }
  if (!swOK(gen)) return swAILeds(false);
  await mkWait(gen, 260);
  swTrace("ai" + k, false, 520).then(() => setTimeout(() => swAILeds(false), 120));
}
function swCover(y) {
  SW.cy = y;
  SW.cover.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
}
/* after the roll lands: the case slides off the electronics, into its bay at the back of the face, and stays there */
async function swOpen() {
  if (SW.open) return;
  SW.open = true;
  const gen = ++SW.gen,
    L = SWL;
  if (!SW.raf) SW.raf = requestAnimationFrame(swOverlayTick);
  const f0 = SW.fade || 0;
  swAnim(gen, 500, t => (SW.fade = swLerp(f0, 1, t)));
  const y0 = SW.cy,
    far = Math.abs(-L.slide - y0) / L.slide;
  if (far > 0.01) {
    await swAnim(gen, 300 + 1000 * far, t => swCover(swLerp(y0, -L.slide - 3, t)), eio);
    if (!swOK(gen)) return;
    await swAnim(gen, 160, t => swCover(-L.slide - 3 + 3 * t), eout);
    if (!swOK(gen)) return;
  } // it touches the end stops
  swTraffic();
  swLoop(gen);
}
/* leaving: the line stops and tidies up, the case slides back over the electronics */
function swClose() {
  if (!SW.open) return Promise.resolve();
  SW.open = false;
  const gen = ++SW.gen,
    L = SWL;
  clearTimeout(SW.trafficT);
  SW.mode = "loop";
  SW.fkeys.forEach(k => k.classList.remove("on"));
  Object.values(SW.hot).forEach(els => els.forEach(el => el.classList.remove("hot")));
  [...SW.items.children].forEach(n => n.remove());
  Object.values(SW.stacks).forEach(S => {
    S.img = null;
    S.bay = null;
  });
  SW.belts.forEach(b => {
    b.n = 0;
    b.r.classList.remove("run");
  });
  swAILeds(false);
  SW.hotTip = false;
  SW.sparks.length = 0;
  SW.arm.hold = null;
  swGrip(SW.arm, false);
  SW.fan.style.setProperty("--fs", "1.2s");
  SW.leds.forEach(l => l.classList.remove("on"));
  Object.keys(SW.lamps).forEach(k => swLamp(k));
  SW.lines = [];
  SW.ui = [];
  SW.file = "";
  SW.caret = false;
  swDraw();
  return (async () => {
    const f0 = SW.fade || 0,
      l0 = SW.live || 0,
      c0 = SW.arm.C.slice(),
      h0 = [SW.hy, SW.hd],
      park = (L.lane.be + L.lane.fe) / 2;
    const rest = [swRestAngle(c0[0]), SW_REST[1], SW_REST[2]];
    swAnim(gen, 450, t => {
      SW.fade = f0 * (1 - t);
      SW.live = l0 * (1 - t);
      swArmPose(
        SW.arm,
        c0.map((v, i) => swLerp(v, rest[i], t)),
      );
      swHead(swLerp(h0[0], park, t), h0[1] * (1 - t));
    }).then(() => {
      if (swOK(gen)) SW.arm.C = SW_REST.slice();
    });
    const y0 = SW.cy;
    await swAnim(gen, 250 + (600 * Math.abs(y0)) / L.slide, t => swCover(swLerp(y0, 0, t)), eio);
  })();
}
