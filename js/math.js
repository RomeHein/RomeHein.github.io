/* =====================================================================
   MATH — quaternions and 3×3 rotations for the cube's orientation, and
   the isometric camera angles every face projects with.
   ===================================================================== */
const D2R = Math.PI / 180,
  ISO = -35.264 * D2R,
  YAW = 45 * D2R;
const qAxis = (x, y, z, deg) => {
  const h = (deg * D2R) / 2,
    s = Math.sin(h);
  return [Math.cos(h), x * s, y * s, z * s];
};
function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) {
    b = b.map(v => -v);
    d = -d;
  }
  if (d > 0.9995) {
    const r = a.map((v, k) => v + (b[k] - v) * t),
      n = Math.hypot(...r);
    return r.map(v => v / n);
  }
  const th = Math.acos(d),
    s0 = Math.sin((1 - t) * th) / Math.sin(th),
    s1 = Math.sin(t * th) / Math.sin(th);
  return a.map((v, k) => v * s0 + b[k] * s1);
}
function qMat([w, x, y, z]) {
  // 3×3 rotation matrix (CSS axes: x right, y down, z towards the viewer)
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ];
}
const mv = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];
const mtv = (M, v) => [
  M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2],
  M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2],
  M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2],
];
const ry = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const rx = (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
