/* =====================================================================
   BACKGROUND CUBES — dimmer cubes around the scene, drawn flat with the
   scene's exact isometric projection (the camera never moves). A few
   traces each; now and then one carries a pulse of light.
   ===================================================================== */
const BGC = { cubes: [], traces: [] };
const BG_LAYOUT = [
  { layer: "back", cx: 470, cy: 70, S: 190, dim: 0.55 },
  { layer: "back", cx: 930, cy: 118, S: 170, dim: 0.5 },
  { layer: "back", cx: 1185, cy: 330, S: 240, dim: 0.62 },
  { layer: "back", cx: 1330, cy: 700, S: 260, dim: 0.6 },
  { layer: "front", cx: 30, cy: 862, S: 300, dim: 0.85 },
];
function buildBgCubes() {
  const NS = "http://www.w3.org/2000/svg",
    world = $("#world");
  const mk = cls => {
    const v = document.createElementNS(NS, "svg");
    v.setAttribute("class", "bg-cubes " + cls);
    v.setAttribute("viewBox", "0 0 1440 900");
    return v;
  };
  const back = mk("back"),
    front = mk("front");
  back.innerHTML = `<defs><linearGradient id="bgcLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2383"/><stop offset=".6" stop-color="#241564"/><stop offset="1" stop-color="#0d0a36"/></linearGradient>
    <linearGradient id="bgcDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1050"/><stop offset="1" stop-color="#05062a"/></linearGradient></defs>`;
  world.insertBefore(back, world.firstChild);
  world.appendChild(front);
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  BG_LAYOUT.forEach((c, ci) => {
    const { cx, cy, S } = c,
      H = S * 2.4,
      k = 0.7071,
      q = 0.4082,
      r = 0.8165;
    const top = (u, v) => {
      const x = u - S / 2,
        z = v - S / 2;
      return [cx + (x + z) * k, cy + q * (z - x)];
    };
    const left = (v, y) => {
      const z = v - S / 2;
      return [cx + (-S / 2 + z) * k, cy + r * y + q * (z + S / 2)];
    };
    const frontF = (u, y) => {
      const x = u - S / 2;
      return [cx + (x + S / 2) * k, cy + r * y + q * (S / 2 - x)];
    };
    const poly = pts => pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
    const g = document.createElementNS(NS, "g");
    g.setAttribute("opacity", c.dim);
    let h = `<polygon class="bgc-left" points="${poly([left(0, 0), left(S, 0), left(S, H), left(0, H)])}"/>
      <polygon class="bgc-front" points="${poly([frontF(0, 0), frontF(S, 0), frontF(S, H), frontF(0, H)])}"/>
      <polygon class="bgc-top" points="${poly([top(0, 0), top(S, 0), top(S, S), top(0, S)])}"/>
      <polyline class="bgc-edge" points="${poly([top(0, 0), top(0, S), top(S, S)])}"/>`;
    // traces: a few 45° runs on each visible face, ending on vias
    const G = S / 12,
      paths = [];
    const run = (map, u0, v0, du, dv, steps) => {
      const pts = [[u0, v0]];
      let u = u0,
        v = v0;
      for (let i = 0; i < steps; i++) {
        const diag = rnd() < 0.35;
        u += diag ? du * G : 0;
        v += dv * G + (diag ? 0 : 0);
        if (!diag) v += 0;
        pts.push([u, v]);
      }
      return pts.map(([a, b]) => map(a, b));
    };
    for (let t = 0; t < 4; t++) {
      // top face, from the far edge inward
      const u0 = G * (2 + Math.floor(rnd() * 8)),
        pts = [[u0, 0]];
      let u = u0,
        v = 0;
      const n = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        if (rnd() < 0.4) {
          u += rnd() < 0.5 ? -G : G;
          v += G;
        } else v += G;
        pts.push([Math.max(G, Math.min(S - G, u)), v]);
      }
      paths.push({ pts: pts.map(([a, b]) => top(a, b)) });
    }
    for (let t = 0; t < 3; t++) {
      // left face, down from the top edge
      const v0 = G * (2 + Math.floor(rnd() * 8)),
        pts = [[v0, 0]];
      let v = v0,
        y = 0;
      for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) {
        if (rnd() < 0.35) {
          v += rnd() < 0.5 ? -G : G;
          y += G;
        } else y += G * 1.4;
        pts.push([v, y]);
      }
      paths.push({ pts: pts.map(([a, b]) => left(a, b)) });
    }
    for (let t = 0; t < 3; t++) {
      // front face
      const u0 = G * (2 + Math.floor(rnd() * 8)),
        pts = [[u0, 0]];
      let u = u0,
        y = 0;
      for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) {
        if (rnd() < 0.35) {
          u += rnd() < 0.5 ? -G : G;
          y += G;
        } else y += G * 1.4;
        pts.push([u, y]);
      }
      paths.push({ pts: pts.map(([a, b]) => frontF(a, b)) });
    }
    paths.forEach(pp => {
      const d = "M" + pp.pts.map(p => p.map(n => n.toFixed(1)).join(" ")).join("L"),
        end = pp.pts[pp.pts.length - 1];
      h += `<path class="bgc-tr" d="${d}"/><ellipse class="bgc-via" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" rx="${(S / 60).toFixed(1)}" ry="${(S / 85).toFixed(1)}"/>
        <path class="bgc-pulse" d="${d}"/>`;
    });
    g.innerHTML = h;
    (c.layer === "front" ? front : back).appendChild(g);
    g.querySelectorAll(".bgc-pulse").forEach(el => BGC.traces.push(el));
    BGC.cubes.push({ g, c });
  });
}
/* now and then, a random trace on a random background cube carries a soft pulse */
function bgPulse() {
  if (!reduce && !ROLL.active && BGC.traces.length) {
    const el = BGC.traces[Math.floor(Math.random() * BGC.traces.length)],
      len = el.getTotalLength(),
      seg = Math.max(18, len * 0.18);
    el.style.stroke = ["#63c6dc", "#b64fd8", "#ffb547", "#58a9ff"][Math.floor(Math.random() * 4)];
    el.style.strokeDasharray = `${seg} ${len + seg}`;
    el.animate(
      [
        { strokeDashoffset: seg, opacity: 0 },
        { opacity: 0.9, offset: 0.15 },
        { strokeDashoffset: -len, opacity: 0.9 },
      ],
      { duration: 900 + len * 4, easing: "ease-in-out" },
    );
  }
  setTimeout(bgPulse, 500 + Math.random() * 1300);
}
