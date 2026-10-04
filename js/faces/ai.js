/* =====================================================================
   AI FACE — a cybernetic brain trapped in a silo under a glass lid.
   Silo walls and the ring are real 3D geometry; the brain and its
   orbiting modules are a camera-facing layer updated every frame.
   ===================================================================== */
const AIST = { z: -72, zIn: -72, zOut: 185, open: false, tween: null, ringA: 0, labels: [], W: null };
function aiChip(parent, o) {
  for (let x = o.x + 14; x < o.x + o.w - 4; x += 14) {
    box(parent, x - 2, o.y - 5, 4, 6, 1.5, "ic-pin");
    box(parent, x - 2, o.y + o.h - 1, 4, 6, 1.5, "ic-pin");
  }
  for (let y = o.y + 8; y < o.y + o.h - 4; y += 14) {
    box(parent, o.x - 5, y, 6, 4, 1.5, "ic-pin");
    box(parent, o.x + o.w - 1, y, 6, 4, 1.5, "ic-pin");
  }
  const b = box(parent, o.x, o.y, o.w, o.h, 5, "ic-body");
  div("ic-dot", b.t);
  div("ic-mark", b.t, { top: "14px" });
  div("ic-mark", b.t, { top: "22px", right: "40px" });
  const t = div("", b.t, {
    position: "absolute",
    left: "12px",
    bottom: "7px",
    font: "8px var(--f-label)",
    color: "#7f88d8",
    letterSpacing: ".12em",
  });
  t.textContent = "NPU-02";
}
function buildAI() {
  const g = $("#aiGroup"),
    AP = PCB.aiParts;
  // copper pads under the passives
  const pads = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pads.setAttribute("viewBox", "0 0 560 560");
  pads.setAttribute("class", "ai-pads");
  pads.innerHTML = [...AP.res, ...AP.cer]
    .map(([x1, y1, x2, y2]) =>
      x1 === x2
        ? `<rect class="fx-pad" x="${x1 - 5}" y="${y1 - 1}" width="10" height="5"/><rect class="fx-pad" x="${x1 - 5}" y="${y2 - 4}" width="10" height="5"/>`
        : `<rect class="fx-pad" x="${x1 - 1}" y="${y1 - 5}" width="5" height="10"/><rect class="fx-pad" x="${x2 - 4}" y="${y1 - 5}" width="5" height="10"/>`,
    )
    .join("");
  g.appendChild(pads);
  AP.res.forEach(r => smdR(g, ...r));
  AP.cer.forEach(r => smdC(g, ...r));
  AP.sot.forEach(([x, y]) => sot23(g, x, y));
  AP.elec.forEach(([x, y, d]) => eCap(g, x, y, d));
  AP.ic.forEach(o => aiChip(g, o));
  // silo: inward-facing wall panels going down into the cube, glowing floor
  const N = 24,
    RS = 104,
    D = 190,
    pw = 2 * RS * Math.sin(Math.PI / N) + 1.2;
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N,
      shade = 0.62 + 0.38 * Math.cos(((a - 200) * Math.PI) / 180);
    div("silo-wall" + (i % 3 === 0 ? " strip" : ""), g, {
      left: px(280 - pw / 2),
      top: "280px",
      width: px(pw),
      height: px(D + 6),
      transform: `translateZ(6px) rotateZ(${a}deg) translateY(-${RS}px) rotateX(-90deg)`,
    }).style.setProperty("--b0", shade.toFixed(2));
  }
  div("silo-floor", g, {
    left: px(280 - RS),
    top: px(280 - RS),
    width: px(2 * RS),
    height: px(2 * RS),
    transform: `translateZ(-${D}px)`,
  });
  // glass lid in two halves, flush with the face
  div("ai-glass l", g);
  div("ai-glass r", g);
  // the ring: raised rim with ticks, bolts and silkscreen; it turns whenever the cube turns
  const ring = div("ai-ring", g);
  AIST.ring = ring;
  const NR = 30,
    rw = 2 * 140 * Math.sin(Math.PI / NR) + 1.2;
  for (let i = 0; i < NR; i++)
    div("ring-wall", ring, {
      left: px(-rw / 2),
      top: "0",
      width: px(rw),
      height: "6px",
      transform: `rotateZ(${(i * 360) / NR}deg) translateY(-140px) rotateX(90deg)`,
    }).style.setProperty("--b0", (0.6 + 0.4 * Math.cos((((i * 360) / NR - 200) * Math.PI) / 180)).toFixed(2));
  const top = div("ring-top", ring);
  for (let k = 0; k < 8; k++) {
    const a = ((k * 45 + 22.5) * Math.PI) / 180;
    div("ring-bolt", top, { left: px(140 + 118 * Math.cos(a)), top: px(140 + 118 * Math.sin(a)) });
  }
  top.insertAdjacentHTML(
    "beforeend",
    `<svg viewBox="0 0 280 280"><defs><path id="ringTxt" d="M140 140m-120 0a120 120 0 1 1 240 0a120 120 0 1 1 -240 0"/></defs>
    <text font-family="Share Tech Mono, monospace" font-size="8.5" letter-spacing="2" fill="rgba(190,200,255,.6)"><textPath href="#ringTxt">NEURAL CORE · RC-AI02 · CONTAINMENT RING · 48 TOPS · NEURAL CORE · RC-AI02 · CONTAINMENT RING ·</textPath></text></svg>`,
  );
  // data streaming along the face's traces into the ring
  const face = document.querySelector('.cube .side[data-face="front"]');
  let flow = "";
  PCB.faces.front.forEach(n => {
    const tq = trimVia(n.p, n.vs, n.ve),
      q = dist(tq[0], [280, 280]) < dist(tq[tq.length - 1], [280, 280]) ? [...tq].reverse() : tq;
    flow += `<path class="ai-flow" d="${pathD(q)}"/>`;
  });
  face.insertAdjacentHTML("beforeend", `<svg class="face-svg ai-flow-svg" viewBox="0 0 560 588">${flow}</svg>`);
  // the brain, its spine and the orbiting modules: a camera-facing canvas redrawn every frame from real 3D geometry
  // (drawn in a 2D overlay above the scene; occlusion by the face is computed exactly, see aiTick)
  const cv = document.createElement("canvas"),
    dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.className = "ai-overlay";
  cv.width = cv.height = Math.round(800 * dpr);
  $("#world").appendChild(cv);
  AIST.cv = cv;
  AIST.ctx = cv.getContext("2d");
  AIST.dpr = dpr;
  AIST.brain = makeBrain();
  AIST.sprite = brainSprite();
  AIST.labels = ["AUTOMATION", "AGENTS", "MCP", "RAG", "PROMPTS", "EVALS"].map((n, k, a) => ({
    n,
    k,
    a: (k / a.length) * Math.PI * 2,
  }));
  requestAnimationFrame(aiTick);
}

/* ---- 3D brain: anatomical hemispheres (frontal / temporal lobes, Sylvian fissure), folded cortex
   drawn as contour lines of a meander field (marching squares on the surface), cerebellum with its
   folia, brain stem. Brain space: x → front, y → right, z → up; the stem sits on the silo axis. ---- */
function makeBrain() {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const segs = [],
    blobs = [],
    SHIFT = 20;
  const norm = v => {
    const l = Math.hypot(...v) || 1;
    return v.map(c => c / l);
  };
  // cortex surface point for one hemisphere, (φ from front tip to back tip, θ around the long axis)
  const cortex = (side, th, ph) => {
    const u = [Math.cos(ph), Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th)];
    let x = 66 * u[0],
      y = 31 * u[1],
      z = 45 * u[2];
    const lateral = side * u[1] > 0;
    if (!lateral) y *= 0.22; // flat medial face → fissure
    if (z < 0) z *= 0.7;
    const tl = Math.max(0, -u[2]) * Math.max(0, 1 - Math.abs(x - 14) / 52);
    if (lateral) {
      y *= 1 + 0.22 * tl;
      z -= 13 * tl;
    } // temporal lobe
    if (x < -24 && z < 0) z *= 0.4; // room for the cerebellum
    if (x > 30) {
      const f = (x - 30) / 36;
      z *= 1 - 0.12 * f;
    } // rounder, lower frontal pole
    const d = z - (-0.3 * x - 1),
      dent = Math.exp(-(d * d) / 26) * (x > -38 && x < 52 ? 1 : 0);
    if (lateral) y *= 1 - 0.2 * dent; // Sylvian fissure
    const n = norm([x / (66 * 66), (lateral ? y : y / 0.28) / (31 * 31), z / (45 * 45)]);
    return { p: [x + SHIFT, y + side * 9, z + 8], n: [n[0], n[1] * (lateral ? 1 : 0.5), n[2]] }; // hemispheres close, narrow fissure
  };
  const field = ([x, y, z], side) =>
    Math.sin(0.2 * x + 1.5 * Math.sin(0.085 * z + 0.05 * y + side)) +
    Math.sin(0.23 * z + 1.3 * Math.sin(0.075 * x - 0.06 * y)) +
    0.7 * Math.sin(0.17 * y * side + 0.15 * x - 0.11 * z + 0.6);
  const cereb = (th, ph) => {
    const u = [Math.cos(ph), Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th)];
    const p = [-48 + 24 * u[0] * 0.9, 40 * u[1], -24 + 15 * u[2]];
    return { p: [p[0] + SHIFT - 2, p[1], p[2]], n: norm([u[0] / 24, u[1] / 44, u[2] / 15]) };
  };
  // marching squares over a (θ, φ) grid, producing 3D segments on the level set f = 0
  const march = (surf, f, NT, NP, kind) => {
    const G = [];
    for (let i = 0; i <= NT; i++) {
      G.push([]);
      for (let j = 0; j <= NP; j++) {
        const s0 = surf((i / NT) * Math.PI * 2, 0.04 + (j / NP) * (Math.PI - 0.08));
        s0.v = f(s0.p);
        G[i].push(s0);
      }
    }
    const lerp = (A, B) => {
      const t = A.v / (A.v - B.v);
      return { p: A.p.map((c, k) => c + (B.p[k] - c) * t), n: A.n.map((c, k) => c + (B.n[k] - c) * t) };
    };
    for (let i = 0; i < NT; i++)
      for (let j = 0; j < NP; j++) {
        const a = G[i][j],
          b = G[i + 1][j],
          c = G[i + 1][j + 1],
          d = G[i][j + 1];
        const e = [];
        [
          [a, b],
          [b, c],
          [c, d],
          [d, a],
        ].forEach(([P, Q]) => {
          if (P.v > 0 !== Q.v > 0) e.push(lerp(P, Q));
        });
        for (let k = 0; k + 1 < e.length; k += 2)
          segs.push({ a: e[k].p, b: e[k + 1].p, n: norm(e[k].n.map((c, m) => c + e[k + 1].n[m])), kind });
      }
    for (let i = 0; i < NT; i += 3) for (let j = 1; j < NP; j += 3) blobs.push({ p: G[i][j].p, n: G[i][j].n });
  };
  march(
    (th, ph) => cortex(-1, th, ph),
    p => field(p, -1),
    110,
    64,
    0,
  );
  march(
    (th, ph) => cortex(1, th, ph),
    p => field(p, 1),
    110,
    64,
    0,
  );
  march(cereb, ([x, y, z]) => Math.sin(0.75 * z + 0.2 * Math.sin(0.12 * y) + 0.06 * x), 70, 34, 1);
  for (let k = 0; k < 6; k++) {
    // brain stem → spine
    const a = (k / 6) * Math.PI * 2,
      cx = Math.cos(a) * 8,
      cy = Math.sin(a) * 8;
    segs.push({
      a: [SHIFT - 16 + cx, cy, -14],
      b: [cx * 0.8, cy * 0.8, -44],
      n: [Math.cos(a), Math.sin(a), 0],
      kind: 2,
    });
  }
  // chain the cortex segments into polylines so impulses can travel along the folds
  const key = p => p.map(c => c.toFixed(1)).join(","),
    ends = new Map();
  segs.forEach((sg, i) => {
    if (sg.kind !== 0) return;
    [key(sg.a), key(sg.b)].forEach(k => {
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(i);
    });
  });
  const used = new Set(),
    chains = [];
  segs.forEach((sg, i) => {
    if (sg.kind !== 0 || used.has(i)) return;
    const pts = [sg.a, sg.b];
    used.add(i);
    for (let dir = 0; dir < 2; dir++) {
      let guard = 0;
      while (guard++ < 400) {
        const endP = dir ? pts[0] : pts[pts.length - 1],
          nxt = (ends.get(key(endP)) || []).find(k => !used.has(k));
        if (nxt === undefined) break;
        used.add(nxt);
        const o = segs[nxt],
          np = key(o.a) === key(endP) ? o.b : o.a;
        dir ? pts.unshift(np) : pts.push(np);
      }
    }
    if (pts.length > 8) chains.push(pts);
  });
  const pulses = [];
  for (let k = 0; k < 60; k++) pulses.push({ c: Math.floor(rnd() * chains.length), t: rnd(), v: 6 + rnd() * 10 });
  const cortexPts = segs.filter(sg => sg.kind === 0);
  const axons = [];
  for (let k = 0; k < 16; k++)
    axons.push([
      cortexPts[Math.floor(rnd() * cortexPts.length)].a,
      [SHIFT + (rnd() - 0.5) * 30, (rnd() - 0.5) * 10, 4 + (rnd() - 0.5) * 16],
      cortexPts[Math.floor(rnd() * cortexPts.length)].b,
    ]);
  const nodes = [];
  chains.forEach(ch => {
    for (let k = 4; k < ch.length; k += 11) nodes.push(ch[k]);
  });
  return { segs, blobs, chains, pulses, axons, nodes, rnd };
}
function brainSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d"),
    r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, "rgba(200,70,200,.07)");
  r.addColorStop(1, "rgba(200,70,200,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/* The brain, its spine and the orbiting modules are drawn in a 2D overlay from real 3D geometry.
   Occlusion is exact: anything above the face plane is visible; anything below it is only visible
   where the line of sight passes through the silo opening, i.e. inside the projected hole. */
let aiLast = performance.now();
let aiN = 0,
  aiLastQ = null;
function aiTick(now) {
  // closed brain on a still cube: a third of the frame rate is plenty (the lid dims it anyway)
  const still = aiLastQ === Q;
  aiLastQ = Q;
  // nothing to draw while the AI face is turned away (during a roll the brain keeps moving with its face)
  if (cullState.front) {
    if (!AIST.hid) {
      AIST.ctx.setTransform(1, 0, 0, 1, 0, 0);
      AIST.ctx.clearRect(0, 0, AIST.cv.width, AIST.cv.height);
      AIST.hid = true;
    }
    requestAnimationFrame(aiTick);
    return;
  }
  AIST.hid = false;
  if (AIST.open || !still || aiN++ % 3 === 0) {
    try {
      aiFrame(now);
    } catch (e) {
      console.warn("ai frame", e);
    }
  }
  requestAnimationFrame(aiTick);
}
function aiFrame(now) {
  if (INTRO.dark) {
    AIST.ctx.setTransform(1, 0, 0, 1, 0, 0);
    AIST.ctx.clearRect(0, 0, AIST.cv.width, AIST.cv.height);
    return;
  }
  const dt = Math.min(0.05, (now - aiLast) / 1000);
  aiLast = now;
  const M = qMat(Q);
  const col = v => rx(ry(mv(M, v), YAW), ISO); // cube / face frame → screen
  const c0 = col([1, 0, 0]),
    c1 = col([0, 1, 0]),
    c2 = col([0, 0, 1]);
  const z = AIST.z + (AIST.open ? Math.sin(now / 900) * 6 : 0);
  $("#aiGroup").classList.toggle("risen", z > 20);
  const ctx = AIST.ctx,
    dpr = AIST.dpr,
    t = now / 1000;
  // anchor the overlay on the projected silo centre
  const ox = 600 + c2[0] * 280.5,
    oy = 634 + c2[1] * 280.5;
  AIST.cv.style.transform = `translate(${(ox - 400).toFixed(1)}px, ${(oy - 400).toFixed(1)}px)`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, 800, 800);
  if (c2[2] < 0.02) return; // face turned away: nothing to draw
  ctx.translate(400, 400);
  const S3 = (x, y, h) => [
    c0[0] * x + c1[0] * y + c2[0] * h,
    c0[1] * x + c1[1] * y + c2[1] * h,
    c0[2] * x + c1[2] * y + c2[2] * h,
  ];
  const risen = Math.max(0, Math.min(1, (z - 10) / 120));
  const pulse = 1 + 0.035 * Math.sin(t * 2.9);
  if (AIST.open) AIST.phi = (AIST.phi ?? 0.5) + dt * 0.12; // slow turn only while the AI face is up
  const phi = AIST.phi ?? 0.5,
    cp = Math.cos(phi),
    sp = Math.sin(phi),
    cpN = cp,
    spN = sp;
  const B = AIST.brain,
    sc = (0.8 + 0.2 * risen) * pulse * 1.18; // a touch bigger
  // brain points: [screen x, screen y, depth, height above the face]
  const bc = S3(0, 0, z); // brain centre on screen
  const hole = () => {
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2,
        q = S3(Math.cos(a) * 103, Math.sin(a) * 103, 0);
      k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
  };
  const labs = AIST.labels.map(L => {
    const th = t * 0.5 + L.a,
      h = z + 26 + 16 * Math.sin(t * 1.3 + L.k * 1.7);
    return { L, q: S3(180 * Math.cos(th), 180 * Math.sin(th), h) };
  });

  // two passes: below the face (clipped to the opening, dimmed by the glass if closed), then above it
  // project the brain once per frame; both passes below just pick what they keep
  const facingF = n => c0[2] * n[0] * cp - c0[2] * n[1] * sp + c1[2] * (n[0] * sp + n[1] * cp) + c2[2] * n[2];
  const BPF = p => {
    const X = (p[0] * cp - p[1] * sp) * sc,
      Y = (p[0] * sp + p[1] * cp) * sc,
      H = z + p[2] * sc;
    const q = S3(X, Y, H);
    q.push(H);
    return q;
  };
  const nS = B.segs.length,
    SX = AIST.sx || (AIST.sx = new Float32Array(nS * 5)),
    SK = AIST.sk || (AIST.sk = new Uint8Array(nS));
  for (let i = 0; i < nS; i++) {
    const sg = B.segs[i],
      f = facingF(sg.n),
      a = BPF(sg.a),
      b = BPF(sg.b),
      o = i * 5;
    SX[o] = a[0];
    SX[o + 1] = a[1];
    SX[o + 2] = b[0];
    SX[o + 3] = b[1];
    SX[o + 4] = (a[3] + b[3]) / 2;
    SK[i] = f < -0.1 ? 0 : f < 0.15 ? 1 : f < 0.4 ? 2 : f < 0.7 ? 3 : 4;
  }
  const blobP = [];
  for (const bl of B.blobs) {
    if (facingF(bl.n) >= -0.05) blobP.push(BPF(bl.p));
  }
  for (const below of [true, false]) {
    const keep = h => (below ? h < 0 : h >= 0);
    ctx.save();
    if (below) ctx.globalAlpha = AIST.open ? 1 : 0.7;
    ctx.globalCompositeOperation = "lighter";
    // ---- spine: a simple glowing cord (three fine fibres) with a few packets going up
    if (risen > 0.02) {
      const top = z - 44 * sc,
        bottom = -185,
        span = top - bottom,
        segs = 20;
      ctx.lineCap = "round";
      [
        [-4, 0.35, 1],
        [0, 0.8, 2.4],
        [4, 0.35, 1],
      ].forEach(([off, al, w]) => {
        for (let k = 0; k < segs; k++) {
          const h0 = top - (span * k) / segs,
            h1 = top - (span * (k + 1)) / segs;
          if (!keep((h0 + h1) / 2)) continue;
          const q0 = S3(off, 0, h0),
            q1 = S3(off, 0, h1),
            f = 1 - (k / segs) * 0.75;
          ctx.strokeStyle = `rgba(255,${off ? 150 : 215},${off ? 235 : 248},${(al * risen * f).toFixed(3)})`;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(q0[0], q0[1]);
          ctx.lineTo(q1[0], q1[1]);
          ctx.stroke();
        }
      });
      for (let m = 0; m < 3; m++) {
        const f = (t * 0.32 + m / 3) % 1,
          h = bottom + f * span;
        if (!keep(h)) continue;
        const q = S3(0, 0, h),
          fade = risen * Math.min(1, f * 3) * Math.max(0.3, 1 - ((top - h) / span) * 0.6);
        const g4 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 5);
        g4.addColorStop(0, `rgba(230,255,255,${fade})`);
        g4.addColorStop(1, "rgba(127,243,255,0)");
        ctx.fillStyle = g4;
        ctx.beginPath();
        ctx.arc(q[0], q[1], 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // ---- brain: body glow, folds (front-facing bright, back-facing faint), axons, nodes, impulses
    const facing = n => c0[2] * n[0] * cpN - c0[2] * n[1] * spN + c1[2] * (n[0] * spN + n[1] * cpN) + c2[2] * n[2];
    const BP = p => {
      const X = (p[0] * cp - p[1] * sp) * sc,
        Y = (p[0] * sp + p[1] * cp) * sc,
        H = z + p[2] * sc;
      const q = S3(X, Y, H);
      q.push(H);
      return q;
    };
    if (keep(z)) {
      const glowR = 140 * sc,
        halo = ctx.createRadialGradient(bc[0], bc[1], 0, bc[0], bc[1], glowR);
      halo.addColorStop(0, `rgba(255,111,216,${0.14 * (0.45 + 0.55 * risen) * pulse})`);
      halo.addColorStop(1, "rgba(170,70,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(bc[0], bc[1], glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    const spr = 16 * sc,
      half = 8 * sc; // soft body: the organ's volume
    for (const q of blobP) {
      if (keep(q[3])) ctx.drawImage(AIST.sprite, q[0] - half, q[1] - half, spr, spr);
    }
    const style = [
      ["rgba(255,140,230,.04)", 0.7],
      ["rgba(255,120,225,.2)", 0.9],
      ["rgba(255,135,230,.42)", 1.1],
      ["rgba(255,165,238,.66)", 1.35],
      ["rgba(255,205,246,.85)", 1.6],
    ];
    for (let k = 0; k < 5; k++) {
      // folds, batched by brightness
      ctx.beginPath();
      let any = false;
      for (let i = 0; i < nS; i++) {
        if (SK[i] !== k) continue;
        const o = i * 5;
        if (!keep(SX[o + 4])) continue;
        ctx.moveTo(SX[o], SX[o + 1]);
        ctx.lineTo(SX[o + 2], SX[o + 3]);
        any = true;
      }
      if (any) {
        ctx.strokeStyle = style[k][0];
        ctx.lineWidth = style[k][1] * sc;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    for (const [p0, p1, p2] of B.axons) {
      const q0 = BP(p0),
        q1 = BP(p1),
        q2 = BP(p2);
      if (!keep(q1[3])) continue;
      ctx.moveTo(q0[0], q0[1]);
      ctx.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]);
    }
    ctx.strokeStyle = "rgba(127,243,255,.16)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = "rgba(150,245,255,.75)";
    for (const nd of B.nodes) {
      const q = BP(nd);
      if (!keep(q[3]) || q[2] < bc[2] - 10) continue;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 1.5 * sc, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const pl of B.pulses) {
      // impulses running along the folds
      const ch = B.chains[pl.c];
      if (below) {
        pl.t += (dt * pl.v) / ch.length;
        if (pl.t >= 1) {
          pl.c = Math.floor(B.rnd() * B.chains.length);
          pl.t = 0;
        }
      }
      if (!ch || ch.length < 2) continue;
      const f = Math.min(0.9999, Math.max(0, pl.t)) * (ch.length - 1),
        i0 = Math.floor(f),
        fr = f - i0,
        A = ch[i0],
        Bq = ch[Math.min(ch.length - 1, i0 + 1)];
      const p = [A[0] + (Bq[0] - A[0]) * fr, A[1] + (Bq[1] - A[1]) * fr, A[2] + (Bq[2] - A[2]) * fr],
        q = BP(p);
      if (!keep(q[3]) || q[2] < bc[2] - 25) continue;
      const g3 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 5);
      g3.addColorStop(0, "rgba(255,255,255,.95)");
      g3.addColorStop(1, "rgba(255,111,216,0)");
      ctx.fillStyle = g3;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // below the face only the silo opening shows. The canvas holds nothing else yet, so cut this pass to the
    // opening in one go rather than clipping every draw: Safari is very slow at drawing images through a clip.
    if (below) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      hole();
      ctx.fill();
      ctx.restore();
    }
  }
  // ---- orbiting modules (always above the face when shown), sorted around the brain
  const drawLabel = ({ L, q }) => {
    if (risen < 0.6) return;
    const a = (risen - 0.6) / 0.4,
      s2 = 1 + (q[2] - bc[2]) / 900;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,155,230,${0.55 * a})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -t * 18;
    ctx.beginPath();
    ctx.moveTo(bc[0], bc[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(q[0], q[1]);
    ctx.scale(s2, s2);
    const hot = AIST.hot === L.n,
      dim = AIST.hot && !hot;
    if (hot) ctx.scale(1.3, 1.3);
    ctx.font = "10px Michroma, 'Chakra Petch', sans-serif";
    const w = ctx.measureText(L.n).width + 26;
    ctx.globalAlpha = a * (dim ? 0.45 : 1);
    ctx.fillStyle = hot ? "rgba(120,30,110,.92)" : "rgba(24,10,60,.85)";
    ctx.strokeStyle = hot ? "#ffd6f4" : "#ff6fd8";
    ctx.lineWidth = hot ? 1.8 : 1.4;
    if (hot) {
      ctx.shadowColor = "#ff6fd8";
      ctx.shadowBlur = 16;
    }
    ctx.beginPath();
    ctx.roundRect(-w / 2, -12, w, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#7ff3ff";
    ctx.beginPath();
    ctx.arc(-w / 2 + 9, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hot ? "#ffffff" : "#ffe3f7";
    ctx.textBaseline = "middle";
    ctx.fillText(L.n, -w / 2 + 17, 1);
    ctx.restore();
  };
  // modules passing behind the brain are dimmed by it; those in front are drawn on top
  labs
    .sort((u, v) => (u.L.n === AIST.hot) - (v.L.n === AIST.hot) || u.q[2] - v.q[2])
    .forEach(l => {
      if (l.q[2] < bc[2] && l.L.n !== AIST.hot) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        drawLabel(l);
        ctx.restore();
      } else drawLabel(l);
    });
}
function aiMoveBrain(to, dur, delay = 0) {
  cancelAnimationFrame(AIST.tween);
  const start = () => {
    const from = AIST.z,
      t0 = performance.now();
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      AIST.z = from + (to - from) * ease(t);
      if (t < 1) AIST.tween = requestAnimationFrame(step);
    };
    AIST.tween = requestAnimationFrame(step);
  };
  if (reduce) {
    AIST.z = to;
    return;
  }
  clearTimeout(AIST.delay);
  AIST.delay = setTimeout(start, delay);
}
function aiSpinRing(dur) {
  // the ring turns with every roll of the cube
  AIST.ringA += 180;
  AIST.ring.style.transitionDuration = dur + "ms";
  AIST.ring.style.transform = `rotateZ(${AIST.ringA}deg)`;
}
/* now and then one trace talks to the core: a single pulse runs along it into the ring */
function aiChatter() {
  const paths = [...document.querySelectorAll(".ai-flow")];
  const send = () => {
    if (AIST.open && paths.length && !reduce) {
      const el = paths[Math.floor(Math.random() * paths.length)],
        len = el.getTotalLength(),
        seg = 26;
      el.style.strokeDasharray = `${seg} ${len + seg}`;
      el.animate(
        [
          { strokeDashoffset: seg, opacity: 1 },
          { strokeDashoffset: -len, opacity: 1 },
        ],
        { duration: len * 4.2, easing: "ease-in" },
      );
    }
    setTimeout(send, 700 + Math.random() * 1800);
  };
  send();
}
function aiOpen() {
  if (AIST.open) return;
  AIST.open = true;
  if (AIST.ring) aiSpinRing(1400);
  $("#aiGroup").classList.add("open");
  $('.cube .side[data-face="front"]').classList.add("live");
  aiMoveBrain(AIST.zOut, 1800, 450);
}
function aiClose() {
  if (!AIST.open) return;
  AIST.open = false;
  $("#aiGroup").classList.remove("open");
  $('.cube .side[data-face="front"]').classList.remove("live");
  aiMoveBrain(AIST.zIn, 900, 0);
}
