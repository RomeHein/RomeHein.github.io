/* =====================================================================
   INTRO — the cube rises out of the dark, then the tower; a pick-and-place
   column lowers the core chip onto its pads; everything powers up.
   ===================================================================== */
const INTRO = { dark: true };
const easeBack = t => {
  const c = 1.25,
    u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
function tweenMs(dur, fn, ease = eio) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      fn(ease(t));
      t < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
function powerUp() {
  INTRO.dark = false;
  setTimeout(bgPulse, reduce ? 0 : 600);
  $("#world").classList.remove("off");
  typeScreen("ROMAIN CAYZAC", "RC-BOARD", IDLE_SCREEN);
  nixieWarmUp();
  setTimeout(marqueeTick, reduce ? 0 : 700);
  document.body.classList.remove("intro");
}
async function intro() {
  const world = $("#world"),
    cubeCam = $(".cube-cam"),
    towerCam = $(".tower-cam"),
    nxo = document.querySelector(".nx-overlay");
  if (reduce) {
    powerUp();
    return;
  }
  document.body.classList.add("intro");
  world.classList.add("off");
  // the pick-and-place column holding the chip, high above the board
  const board = $("#board"),
    col = div("mk-g", board, { left: "280px", top: "280px" });
  box(col, -20, -20, 40, 40, 10, "col-nozzle", 14);
  box(col, -34, -34, 68, 68, 16, "col-head", 24);
  box(col, -9, -9, 18, 18, 1100, "col-shaft", 40);
  const glow = div("intro-glow", board, { left: "280px", top: "280px" }),
    ring = div("intro-ring", board, { left: "280px", top: "280px" });
  const setLift = dz => {
    CHIPBOX.r.style.setProperty("--z", dz.toFixed(1) + "px");
    col.style.transform = `translateZ(${dz.toFixed(1)}px)`;
  };
  setLift(760);
  col.style.display = "none";
  CHIPBOX.r.style.visibility = "hidden"; // not there while the cube rises
  const setCube = y => {
    cubeCam.style.transform = `translateY(${y.toFixed(1)}px)`;
  };
  const setTower = y => {
    towerCam.style.transform = `translateY(${y.toFixed(1)}px)`;
    if (nxo) nxo.style.transform = `translateY(${y.toFixed(1)}px)`;
  };
  setCube(820);
  setTower(1000);
  BGC.cubes.forEach(({ g }) => {
    g.style.transform = "translateY(700px)";
    g.style.opacity = 0;
  });
  await new Promise(r => setTimeout(r, 250));
  BGC.cubes.forEach(({ g, c }, i) =>
    setTimeout(
      () =>
        tweenMs(
          1400,
          t => {
            g.style.transform = `translateY(${(700 * (1 - t)).toFixed(1)}px)`;
            g.style.opacity = Math.min(1, t * 1.6);
          },
          easeBack,
        ),
      c.layer === "front" ? 1500 : 120 * i,
    ),
  );
  // 1) the cube rises out of the dark, 2) the tower follows
  const cubeUp = tweenMs(1250, t => setCube(820 * (1 - t)), easeBack);
  await new Promise(r => setTimeout(r, 550));
  await tweenMs(1150, t => setTower(1000 * (1 - t)), easeBack);
  await cubeUp;
  // 3) the column (high above the view) appears, then lowers the chip onto its pads; a light pool gathers underneath
  col.style.display = "";
  CHIPBOX.r.style.visibility = "";
  await tweenMs(
    1500,
    t => {
      setLift(760 * (1 - t));
      glow.style.opacity = (0.15 + 0.6 * t).toFixed(2);
    },
    t => 1 - Math.pow(1 - t, 3.2),
  );
  setLift(0);
  ring.classList.add("go");
  glow.style.opacity = 1;
  chipFlash("#63c6dc");
  await new Promise(r => setTimeout(r, 180));
  // 4) the column lets go and shoots back up; 5) power-up
  tweenMs(
    700,
    t => {
      col.style.transform = `translateZ(${(900 * t * t).toFixed(1)}px)`;
      glow.style.opacity = (1 - t).toFixed(2);
    },
    t => t,
  ).then(() => {
    col.remove();
    glow.remove();
    ring.remove();
  });
  cubeCam.style.transform = "";
  towerCam.style.transform = "";
  if (nxo) nxo.style.transform = "";
  powerUp();
}
