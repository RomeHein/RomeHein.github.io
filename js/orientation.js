/* =====================================================================
   ORIENTATION — the cube rolls over an edge so the clicked topic's face
   comes up on top. Orientation is a quaternion, slerped in JS; each frame
   we derive the camera & light vectors in the board's own frame (for
   billboards and part lighting) and a shade for every face.
   ===================================================================== */
const cube = $("#cube");

/* target orientation for each state: the topic's face rolls up to the top */
const HOME = [1, 0, 0, 0];
const FACE_UP = {
  left: qAxis(0, 0, 1, 90),
  right: qAxis(0, 0, 1, -90),
  front: qAxis(1, 0, 0, 90),
  back: qAxis(1, 0, 0, -90),
};
const FACE_N = {
  top: [0, -1, 0],
  bottom: [0, 1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
};
const FACE_AX = {
  front: [
    [1, 0, 0],
    [0, 1, 0],
  ],
  right: [
    [0, 0, -1],
    [0, 1, 0],
  ],
  back: [
    [-1, 0, 0],
    [0, 1, 0],
  ],
  left: [
    [0, 0, 1],
    [0, 1, 0],
  ],
};
const faceEls = {};
document.querySelectorAll(".cube .cf").forEach(f => (faceEls[f.dataset.face] = f));
const board_ = document.getElementById("board");
let Q = HOME,
  anim = null;
const AIGROUP = document.getElementById("aiGroup"),
  MOBGROUP = document.getElementById("mobGroup"),
  MAKGROUP = document.getElementById("makGroup"),
  SWGROUP = document.getElementById("swGroup");

/* Per frame: the cube transform, the ~30 camera-facing parts (direct inline values, no cascade) and the
   face shading layers. The inherited lighting / dimming variables touch thousands of elements, so they are
   only refreshed every few frames and once, exactly, when a roll lands. */
const SHADE = {};
for (const k in faceEls) {
  const d = document.createElement("div"),
    l = document.createElement("div");
  d.className = "shade d";
  l.className = "shade l";
  faceEls[k].prepend(l);
  faceEls[k].prepend(d);
  SHADE[k] = { d, l };
}
let BB = null,
  qFrame = 0;
function billboards() {
  // camera-facing parts per surface frame: [elements, mapping from cube camera vector to that frame]
  const pick = sel => [...document.querySelectorAll(sel)];
  return [
    { els: pick("#board .cyl, #board .lc-body, #board .led-cap"), map: c => [c[0], c[2], -c[1]] },
    { els: pick("#aiGroup .cyl"), map: c => [c[0], c[1], c[2]] },
    { els: pick("#mobGroup .cyl"), map: c => [c[2], c[1], -c[0]] },
    {
      els: pick("#makGroup .cyl, #makGroup .lc-body, #makGroup .mr-card, #makGroup .mk-items, #makGroup .mk-rocket"),
      map: c => [-c[0], c[1], -c[2]],
    },
    { els: pick("#swGroup .cyl"), map: c => [-c[2], c[1], c[0]] },
  ];
}
/* exact === true: refresh everything; otherwise `exact` is the roll progress (0…1) and each heavy group is
   refreshed once, staggered mid-roll, so no single frame pays for all of them */
let heavyDone = {};
function applyQ(q, exact = true) {
  Q = q;
  const M = qMat(q);
  cube.style.transform = `rotateX(${ISO / D2R}deg) rotateY(45deg) matrix3d(${M[0][0]},${M[1][0]},${M[2][0]},0,${M[0][1]},${M[1][1]},${M[2][1]},0,${M[0][2]},${M[1][2]},${M[2][2]},0,0,0,0,1)`;
  const cam = mtv(M, ry(rx([0, 0, 1], -ISO), -YAW)),
    lig = mtv(M, ry([1, 0, 0], -YAW));
  // camera-facing parts: set on the parts themselves
  if (!BB) BB = billboards();
  for (const g of BB) {
    const v = g.map(cam),
      sx = v[0].toFixed(3),
      sy = v[1].toFixed(3),
      sz = v[2].toFixed(3);
    for (const el of g.els) {
      const st = el.style;
      st.setProperty("--vx", sx);
      st.setProperty("--vy", sy);
      st.setProperty("--vz", sz);
    }
  }
  // face shading layers (two elements per face)
  const lums = {};
  for (const k in faceEls) {
    const n = ry(mv(M, FACE_N[k]), YAW),
      up = Math.max(0, -n[1]),
      lit = Math.min(1, Math.max(0, -1.25 * n[0])) * (1 - up);
    SHADE[k].d.style.opacity = ((1 - up) * (1 - lit)).toFixed(3);
    SHADE[k].l.style.opacity = lit.toFixed(3);
    lums[k] = Math.min(1, 0.42 + 0.58 * up + 0.38 * lit);
  }
  // inherited lighting + dimming (expensive: they cascade through whole faces)
  const setL = (el, lx, ly) => {
    el.style.setProperty("--lx", lx.toFixed(3));
    el.style.setProperty("--ly", ly.toFixed(3));
  };
  const dim = (el, lum) => {
    el.style.setProperty("--lum", lum.toFixed(2));
    el.classList.toggle("dim", lum < 0.985);
  };
  const groups = {
    board: () => {
      if (!cullState.top) setL(board_, lig[0], lig[2]);
      for (const k of ["top", "bottom", "right", "back"]) if (!cullState[k]) dim(faceEls[k], lums[k]);
    },
    ai: () => {
      if (cullState.front) return;
      if (AIGROUP) {
        setL(AIGROUP, lig[0], lig[1]);
        dim(AIGROUP, lums.front);
      }
      dim(faceEls.front, lums.front);
    },
    sw: () => {
      if (cullState.right) return;
      if (SWGROUP) {
        setL(SWGROUP, -lig[2], lig[1]);
        dim(SWGROUP, lums.right);
      }
    },
    mak: () => {
      if (cullState.back) return;
      if (MAKGROUP) {
        setL(MAKGROUP, -lig[0], lig[1]);
        dim(MAKGROUP, lums.back);
      }
    },
    mob: () => {
      if (cullState.left) return;
      if (MOBGROUP) {
        setL(MOBGROUP, lig[2], lig[1]);
        dim(MOBGROUP, lums.left);
      }
      dim(faceEls.left, lums.left);
    },
  };
  if (exact === true) {
    cull(M);
    for (const g in groups) groups[g]();
    return;
  }
  if ((qFrame++ & 1) === 0) {
    const order = ["board", "ai", "mob", "mak", "sw"];
    groups[order[(qFrame >> 1) % 5]]();
  } // one group every other frame
  cull(M);
}
/* Three faces always point away from the camera: take them (and their 3D groups) out of rendering
   entirely, so the browser neither lays them out, styles them nor runs their CSS animations.
   Toggled only when a face crosses edge-on. */
const cullState = {},
  FACE_GROUP = { front: () => AIGROUP, left: () => MOBGROUP, back: () => MAKGROUP, right: () => SWGROUP };
function cull(M) {
  for (const k in faceEls) {
    const hide = rx(ry(mv(M, FACE_N[k]), YAW), ISO)[2] <= -0.02;
    if (cullState[k] === hide) continue;
    cullState[k] = hide;
    faceEls[k].classList.toggle("off", hide);
    const g = FACE_GROUP[k] && FACE_GROUP[k]();
    if (g) g.classList.toggle("off", hide);
    if (!hide) faceEls[k].querySelectorAll(".fc-title").forEach(el => fitText(el, 26, 14)); // measured now that it is laid out
  }
}
/* During a roll only the face we leave and the face we go to keep animating; everything else
   (other faces, the tower, the background cubes) pauses. The brain keeps being drawn while its face
   is in view: it has to move with the cube. */
const ROLL = { active: false, keep: new Set() };
function upFace(q) {
  const M = qMat(q);
  let best = "top",
    bv = -2;
  for (const k in FACE_N) {
    const v = -ry(mv(M, FACE_N[k]), YAW)[1];
    if (v > bv) {
      bv = v;
      best = k;
    }
  }
  return best;
}
const FACE_GROUP_EL = { front: () => AIGROUP, left: () => MOBGROUP, back: () => MAKGROUP, right: () => SWGROUP };
function rollingMode(on, target) {
  ROLL.active = on;
  document.body.classList.toggle("rolling", on);
  if (on) ROLL.keep = new Set([upFace(Q), upFace(target)]);
  for (const k in faceEls) {
    const freeze = on && !ROLL.keep.has(k);
    faceEls[k].classList.toggle("frozen", freeze);
    const g = FACE_GROUP_EL[k] && FACE_GROUP_EL[k]();
    if (g) g.classList.toggle("frozen", freeze);
  }
}
function rollTo(target, dur = 1400) {
  cancelAnimationFrame(anim);
  rollingMode(true, target);
  clearTimeout(ROLL.safety);
  ROLL.safety = setTimeout(() => rollingMode(false), dur + 400); // never stay paused
  if (reduce) {
    applyQ(target);
    return Promise.resolve();
  }
  const from = Q,
    t0 = performance.now();
  heavyDone = {};
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  return new Promise(res => {
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      applyQ(qSlerp(from, target, ease(t)), t >= 1 ? true : t);
      if (t >= 1) rollingMode(false);
      if (t < 1) anim = requestAnimationFrame(step);
      else res();
    };
    anim = requestAnimationFrame(step);
  });
}
/* once a face is on top, turn its content so it reads upright (text running down-right, like the board labels) */
function uprightTurn(face, q) {
  const M = qMat(q),
    [fx, fy] = FACE_AX[face];
  let best = 0,
    score = -Infinity;
  for (let k = 0; k < 4; k++) {
    const t = k * 90 * D2R,
      up = fx.map((v, j) => Math.sin(t) * v - Math.cos(t) * fy[j]);
    const w = rx(ry(mv(M, up), YAW), ISO),
      sc = w[0] - w[1];
    if (sc > score) {
      score = sc;
      best = k * 90;
    }
  }
  return best;
}
