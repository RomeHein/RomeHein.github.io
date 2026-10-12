/* =====================================================================
   NAVIGATION & BOOT — select() runs a topic's whole sequence (roll the
   cube, open its face, fill the panel); keys, deep links, fitting the
   scene to the window, and the start-up sequence.
   ===================================================================== */
let current = null,
  seqId = 0;
/* the cube's last face, underneath: no topic of its own, it turns up when "HAL" is typed on the board's screen */
const HAL = 4,
  HAL_COLOR = "#ff3b3b";
/* deep link (#ai, #maker…). Sandboxed previews forbid touching the URL: never let that break the animation */
function setHash(i) {
  try {
    if (i >= 0) history.replaceState(null, "", "#" + TOPICS[i].id);
    else history.replaceState(null, "", location.pathname + location.search);
  } catch (e) {
    /* not allowed here (e.g. sandboxed iframe) */
  }
}
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const isHome = () => Math.abs(Q[0]) > 0.9999;
async function select(i, press = false) {
  if (i === current) return;
  current = i;
  const my = ++seqId;
  const color = i === HAL ? HAL_COLOR : i >= 0 ? TOPICS[i].color : "#63c6dc";
  document.documentElement.style.setProperty("--accent", color);
  modules.forEach((m, k) => m.classList.toggle("active", k === i));
  document.querySelectorAll(".feed").forEach((f, k) => f.classList.toggle("active", k === i));
  document.querySelectorAll(".cube .side").forEach(f => f.classList.toggle("on", FACES.indexOf(f.dataset.face) === i));
  switches.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  renderPanel(i === HAL ? -1 : i);
  setHash(i === HAL ? -1 : i);

  // 0) a topic face is up: roll the board back on top first
  if (!isHome()) {
    document.querySelectorAll(".fwrap").forEach(w => (w.style.transform = ""));
    setLed("pink", true);
    aiClose();
    mobOff();
    if (MK.open) {
      await makClose();
      if (my !== seqId) return;
    } // let the factory settle in view first
    if (SW.open) {
      await swClose();
      if (my !== seqId) return;
    }
    await rollTo(HOME, 900);
    if (my !== seqId) return;
  }
  // 1) the core chip fires and a pulse runs through every track in the module's colour
  if (press && i >= 0) pressKnob(modules[i]._knob, 6);
  chipFlash(color);
  wave(color, i === HAL ? ["top"] : i >= 0 ? ["top", FACES[i]] : ["top", "front", "left"]);
  blinkScreenLeds(color);
  if (i < 0) {
    setLed("pink", false);
    return;
  }
  await sleep(650);
  if (my !== seqId) return;
  // 2) the cube rolls over the module's edge: the topic's own face comes up on top (HAL's: it turns right over)
  const face = i === HAL ? "bottom" : FACES[i],
    target = FACE_UP[face];
  document.querySelectorAll(".fwrap").forEach(w => {
    const k = +w.dataset.topic;
    w.style.transform = k === i ? `rotate(${uprightTurn(face, target)}deg)` : "";
  });
  setLed("pink", true);
  if (face === "front") aiOpen();
  if (face === "back") {
    const my2 = my;
    setTimeout(
      () => {
        if (my2 === seqId && current === i) makOpen();
      },
      reduce ? 0 : 950,
    );
  }
  await rollTo(target, i === HAL ? 2000 : 1400);
  if (face === "left" && my === seqId) mobOn();
  if (face === "right" && my === seqId) swOpen();
  if (my === seqId) setLed("pink", false);
}

addEventListener("keydown", e => {
  if (/^[1-4]$/.test(e.key)) select(+e.key - 1, true);
  else if (e.key === "ArrowRight") select(((current === HAL ? -1 : (current ?? -1)) + 1) % 4, true);
  else if (e.key === "ArrowLeft") select(((current === HAL ? 0 : (current ?? 0)) + 3) % 4, true);
  else if (e.key === "Escape") select(-1);
});
const topicFromHash = h => TOPICS.findIndex(t => "#" + t.id === h || (t.alias && "#" + t.alias === h));
addEventListener("hashchange", () => select(topicFromHash(location.hash)));

/* ---------------- fit the 1440×900 composition ---------------- */
const world = $("#world"),
  canvas = $("#canvas");
function resize() {
  const W = innerWidth,
    H = innerHeight;
  if (W > 1100) {
    canvas.style.height = "";
    const s = Math.min(W / 1440, H / 900);
    world.style.transform = `translate(${(W - 1440 * s) / 2}px, ${(H - 900 * s) / 2}px) scale(${s})`;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
  } else {
    canvas.style.position = "relative";
    canvas.style.inset = "";
    const s = Math.min(W / 860, 0.9);
    const h = Math.round(700 * s);
    canvas.style.height = h + "px";
    world.style.transform = `translate(${W / 2 - 600 * s}px, ${-120 * s}px) scale(${s})`;
  }
}
addEventListener("resize", resize);

/* the images live in img/: once the intro is over, warm the cache so they show up
   instantly when a face or the panel needs them */
function preloadImages() {
  const load = () => [...Object.values(MOB_IMG), ...Object.values(EXP_IMG)].forEach(src => (new Image().src = src));
  if ("requestIdleCallback" in window) requestIdleCallback(load);
  else setTimeout(load, 1000);
}

/* ---------------- boot ---------------- */
buildDisplay();
buildTraces();
buildModules();
buildScreen();
buildParts();
buildTower();
buildNixie();
buildTowerParts();
buildFaceContent();
buildAI();
aiChatter();
buildMobile();
buildMaker();
buildSoftware();
fitAll();
if (document.fonts) document.fonts.ready.then(fitAll);
buildBgCubes();
resize();
showSeg("");
applyQ(HOME);
const initial = topicFromHash(location.hash);
intro().then(() => {
  select(initial);
  preloadImages();
});
