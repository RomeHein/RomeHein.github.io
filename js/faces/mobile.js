/* =====================================================================
   MOBILE FACE — a smartphone built into the cube, and a column of retro
   buttons (one per project) that flip their label and launch the app.
   Each app is redrawn at the phone's scale from the real one; opening it
   also shows its details (and store links) in the side panel.
   ===================================================================== */
const RB_ICON = `<svg viewBox="0 0 32 32"><g fill="#fff"><ellipse cx="18.6" cy="7.6" rx="1.7" ry="5.4" transform="rotate(-14 18.6 7.6)"/><ellipse cx="22.4" cy="8" rx="1.7" ry="5.2" transform="rotate(12 22.4 8)"/>
  <ellipse cx="14.6" cy="21.8" rx="8.2" ry="6.4"/><circle cx="20.8" cy="15.4" r="4.7"/><circle cx="6.8" cy="20.6" r="2.4"/><ellipse cx="14.4" cy="27.8" rx="4.8" ry="1.6"/><ellipse cx="21.6" cy="27.6" rx="2.6" ry="1.3"/></g>
  <circle cx="22.7" cy="14.6" r=".85" fill="#ff4fb8"/><ellipse cx="19.4" cy="8.4" rx=".6" ry="3.4" transform="rotate(-14 19.4 8.4)" fill="#ffc2e6"/></svg>`;
const MOB_UI = { screen: null, view: null, btns: [], on: false, pending: null, open: null };
const mobIcon = id => `background-image:url("${MOB_IMG[id]}")`;
/* each app, redrawn at the phone's scale from the real thing (status bar included: the colours differ) */
function mobDemo(app) {
  const time = MOB_UI.screen.querySelector(".ps-time").textContent;
  const bar = dark =>
    `<div class="ps-status${dark ? " dark" : ""}"><span class="ps-time">${time}</span><span>▂▄▆ ▮</span></div>`;
  if (app.id === "callbell")
    return `<div class="cb">${bar(true)}
    <div class="cb-top"><span class="cb-back">‹</span><i class="cb-av">M</i><div><b>Maria Lopez</b><span><em class="wa">●</em> WhatsApp · open</span></div></div>
    <div class="cb-day">Today</div>
    <div class="cb-msgs"><div class="bub them" style="animation-delay:.3s">Hi! Is my order on its way? 📦</div>
      <div class="cb-note" style="animation-delay:.9s">Assigned to Support · routing</div>
      <div class="bub me" style="animation-delay:1.4s">Yes, it shipped this morning.</div>
      <div class="bub me" style="animation-delay:1.9s">Here is your tracking link 👇</div>
      <div class="bub them" style="animation-delay:2.8s">Perfect, thanks!</div>
      <div class="typing" style="animation-delay:3.5s"><i></i><i></i><i></i></div></div>
    <div class="cb-input"><span>Write a message…</span><i>➤</i></div>
    <div class="cb-nav"><span class="on">Chats</span><span>Calls</span><span>Alerts</span><span>Settings</span></div></div>`;
  if (app.id === "nonagram")
    return `<div class="ng">${bar(true)}
    <div class="ng-top"><i class="ng-filter"><b></b><b></b><b></b></i><h3>Mangia mangia!</h3>
      <span class="ng-av"><i style="background:linear-gradient(135deg,#c9b8a6,#7c6a5a)"></i><i>@</i><i style="background:linear-gradient(135deg,#7aa0c8,#5c7a4a)"></i><i>@</i></span><em>+3</em></div>
    <div class="ng-grid"><div class="ng-r1">
      <div class="ng-t big" style="animation-delay:.15s;background-image:url(${MOB_IMG.ng1})"><div class="ng-cap"><b>Vous m'avez donné faim</b><span><i></i>Valentina · 17h</span></div></div>
      <div class="ng-col"><div class="ng-t" style="animation-delay:.35s;background-image:url(${MOB_IMG.ng2})"></div><div class="ng-t" style="animation-delay:.5s;background-image:url(${MOB_IMG.ng3})"></div></div></div>
      <div class="ng-r2"><div class="ng-t tall" style="animation-delay:.65s;background-image:url(${MOB_IMG.ng4})"></div><div class="ng-t tall" style="animation-delay:.8s;background-image:url(${MOB_IMG.ng5})"></div></div></div>
    <div class="ng-bar"><span class="ng-dots"><i></i><i></i><i></i><i></i></span><b>+</b><span class="ng-search"></span></div></div>`;
  if (app.id === "openstrum") {
    const notes = [
      ["D", 3, 0],
      ["A", 2, 1],
      ["E", 2, 2],
      ["G", 3, 3],
      ["B", 3, 4],
      ["E", 4, 5],
    ];
    return `<div class="os">${bar(false)}
    <div class="os-top"><span class="os-pill"><b>Standard</b> E A D G B E ⌄</span><span class="os-pill">A4 440</span><span class="os-gear">⚙</span></div>
    <div class="os-hint">Pluck a string</div>
    <div class="os-acc"><span class="fl">♭</span><i></i><span class="sh">♯</span></div>
    <svg class="os-graph" viewBox="0 0 140 66" preserveAspectRatio="none">
      ${Array.from({ length: 11 }, (_, i) => `<line x1="${4 + i * 13.2}" y1="0" x2="${4 + i * 13.2}" y2="66" class="g"/>`).join("")}${[11, 26, 41, 56].map(y => `<line x1="4" y1="${y}" x2="136" y2="${y}" class="g"/>`).join("")}
      <rect x="66" y="0" width="8" height="66" class="band"/><line x1="70" y1="0" x2="70" y2="66" class="mid"/>
      <path class="tr b" d="M30 9 H50 L56 6 M42 20 L60 21 L74 22 H136"/><path class="tr o" d="M108 23 H136"/>
      <path class="tr b" d="M4 37 H72"/><path class="tr o" d="M4 40 H76"/>
      <g class="tag"><rect x="56" y="3" width="16" height="9" rx="4"/><text x="64" y="10">G3</text><rect x="86" y="18" width="16" height="9" rx="4"/><text x="94" y="25">E2</text><rect x="10" y="40" width="16" height="9" rx="4"/><text x="18" y="47">D3</text></g></svg>
    <div class="os-lbl"><span>STRINGS</span><span class="auto">AUTO DETECT</span></div>
    <div class="os-head">
      <svg viewBox="0 0 70 104"><path d="M12 6 Q22 0 35 6 Q48 0 58 6 Q62 9 60 14 L58 80 Q56 92 46 96 L24 96 Q14 92 12 80 L10 14 Q8 9 12 6Z" fill="#1d1c1f" stroke="#3a393e" stroke-width="1.2"/>
        ${[22, 46, 70].map(y => `<rect x="0" y="${y - 5}" width="6" height="10" rx="2" fill="#77736b"/><rect x="64" y="${y - 5}" width="6" height="10" rx="2" fill="#77736b"/><circle cx="18" cy="${y}" r="3" fill="#c8c4bc"/><circle cx="52" cy="${y}" r="3" fill="#c8c4bc"/>`).join("")}
        ${[
          [18, 22, 28],
          [18, 46, 31],
          [18, 70, 34],
          [52, 22, 42],
          [52, 46, 39],
          [52, 70, 36],
        ]
          .map(([x, y, bx]) => `<line x1="${x}" y1="${y}" x2="${bx}" y2="100" stroke="#8d8a83" stroke-width=".8"/>`)
          .join("")}
        <rect x="24" y="96" width="22" height="3" fill="#d9d4c7"/><circle cx="35" cy="20" r="4" fill="none" stroke="#a89cf2" stroke-width="1.2"/></svg>
      ${notes.map(([n, o, i]) => `<span class="os-key" style="${i < 3 ? "left:6px" : "right:6px"};top:${8 + (i % 3) * 32}px;animation-delay:${[2, 1, 0, 3, 4, 5][i] * 1.2}s"><b>${n}</b><small>${o}</small></span>`).join("")}</div>
    <div class="os-nav">${[
      ["⌂", "Home"],
      ["♫", "Tuner"],
      ["◈", "Chords"],
      ["☰", "Charts"],
      ["◉", "Voice"],
    ]
      .map(([g, l], i) => `<span class="${i === 1 ? "on" : ""}"><i>${g}</i>${l}</span>`)
      .join("")}</div></div>`;
  }
  if (app.id === "widgetkit") {
    const sec = [
      ["Activity", "wk1"],
      ["My position", "wk2"],
      ["Data manager", "wk3"],
    ];
    const list = sec
      .map(
        ([t, im]) =>
          `<div class="wk-sec"><div class="wk-prev" style="background-image:url(${MOB_IMG[im]})"></div><span class="wk-pill">${t}</span></div>`,
      )
      .join("");
    return `<div class="wk"><div class="ps-status dark wk-st"><span>●●●●○</span><span class="ps-time">${time}</span><span>▮</span></div>
    <div class="wk-nav"><span class="wk-lock"></span><b>Widget Kit</b><span class="wk-info">i</span></div>
    <div class="wk-tabs"><span class="on">All</span><span>Tools</span><span>Social</span><span>Time</span><span>Games</span></div>
    <div class="wk-list"><div class="wk-scroll">${list}${list}</div></div></div>`;
  }
  // Attest (iOS, French only)
  const qr = Array.from({ length: 81 }, (_, i) => {
    const x = i % 9,
      y = (i / 9) | 0,
      fin = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    return `<i${fin || (x * 7 + y * 13 + x * y) % 3 === 0 ? ' class="k"' : ""}></i>`;
  }).join("");
  return `<div class="at">${bar(true)}
    <h3>Attestations</h3>
    <div class="at-card"><i class="at-av">JD</i><div><b>Jean Dupont</b><span>Profil · créé une fois</span></div><em>›</em></div>
    <div class="at-sec">Motif du déplacement</div>
    <div class="at-list">${["Travail", "Achats", "Santé", "Famille", "Sport"].map((m, i) => `<div class="${i === 1 ? "on" : ""}"><span>${m}</span><i></i></div>`).join("")}</div>
    <div class="at-btn">Générer l'attestation</div>
    <div class="at-pdf"><div class="at-doc"><b>ATTESTATION DE DÉPLACEMENT DÉROGATOIRE</b><span>Jean Dupont · Achats</span><span>Fait le 24/03/2020 à 10:42</span><div class="at-qr">${qr}</div></div><div class="at-share">Partager · Imprimer</div></div></div>`;
}
function buildMobile() {
  const g = $("#mobGroup"),
    MP = PCB.mobParts,
    L = PCB.mobLayout;
  // copper pads under the passives
  const pads = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pads.setAttribute("viewBox", "0 0 560 560");
  pads.setAttribute("class", "mob-pads");
  pads.innerHTML = [...MP.res, ...MP.cer]
    .map(
      ([x1, y1, x2, y2]) =>
        `<rect class="fx-pad" x="${x1 - 5}" y="${y1 - 1}" width="10" height="5"/><rect class="fx-pad" x="${x1 - 5}" y="${y2 - 4}" width="10" height="5"/>`,
    )
    .join("");
  g.appendChild(pads);
  MP.res.forEach(r => smdR(g, ...r));
  MP.cer.forEach(r => smdC(g, ...r));
  MP.ic.forEach(o => {
    const c = box(g, o.x, o.y, o.w, o.h, 4, "ic-body");
    div("ic-dot", c.t);
    const t = div("", c.t, {
      position: "absolute",
      left: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      font: "7px var(--f-label)",
      color: "#7f88d8",
      letterSpacing: ".1em",
    });
    t.textContent = o.label;
    for (let x = o.x + 8; x < o.x + o.w - 4; x += 14) {
      box(g, x - 2, o.y - 5, 4, 6, 1.5, "ic-pin");
      box(g, x - 2, o.y + o.h - 1, 4, 6, 1.5, "ic-pin");
    }
  });
  MP.xtal.forEach(o => box(g, o.x, o.y, o.w, o.h, 5, "smdr-cap"));
  // the phone: rounded body, side keys, working screen
  const ph = L.phone,
    body = chamferBox(g, ph.x, ph.y, ph.w, ph.h, 10, 18, "phone-body");
  body.t.style.clipPath = "inset(0 round 26px)";
  box(g, ph.x + ph.w - 1, 150, 4, 34, 6, "phone-key", 2);
  box(g, ph.x - 3, 140, 4, 22, 6, "phone-key", 2);
  box(g, ph.x - 3, 170, 4, 22, 6, "phone-key", 2);
  const scr = div("phone-screen off", g);
  MOB_UI.screen = scr;
  scr.innerHTML = `<div class="ps-island"></div>
    <div class="ps-layer ps-off"></div>
    <div class="ps-layer ps-boot"><div class="logo">RC</div><div class="bar"><i></i></div></div>
    <div class="ps-layer ps-home"><div class="ps-status"><span class="ps-time">9:41</span><span>▂▄▆ 5G ▮</span></div>
      <div class="ps-clock"><b class="ps-time">9:41</b><span>MOBILE PROJECTS</span></div>
      <div class="ps-grid">${MOBILE_APPS.map((a, k) => `<div class="ps-app-ic" data-k="${k}" style="--ac:${a.ac}"><i class="img" style='${mobIcon(a.id)}'></i><span>${a.name}</span></div>`).join("")}<div class="ps-app-ic rb-ic"><i class="rb-icon">${RB_ICON}</i><span>Rabbit</span></div></div>
      <div class="ps-dots"><i></i><i></i></div></div>`;
  scr.querySelectorAll(".ps-app-ic[data-k]").forEach(el =>
    el.addEventListener("click", e => {
      e.stopPropagation();
      mobLaunch(+el.dataset.k, el);
    }),
  );
  const rbIc = scr.querySelector(".rb-ic");
  rbIc.addEventListener("click", e => {
    e.stopPropagation();
    rbLaunch(rbIc);
  });
  // retro buttons: knob + flip label (name ↔ status)
  MOBILE_APPS.forEach((a, k) => {
    const y = L.btnY[k],
      wrap = div("mob-btn", g, {
        position: "absolute",
        left: 0,
        top: 0,
        width: "560px",
        height: "560px",
        transformStyle: "preserve-3d",
        pointerEvents: "none",
      });
    wrap.style.setProperty("--ac", a.ac);
    const zb = buttonBase(wrap, L.base.x, y - 22, 44);
    const kn = cyl(wrap, L.base.x + 22, y, 34, 14, "mob-knob", zb);
    kn.t.textContent = String(k + 1);
    wrap._knob = kn;
    const lcd = box(wrap, L.lcd.x, y - 18, L.lcd.w, 36, 8, "lcd");
    const fl = div("flap", lcd.t);
    fl.style.setProperty("--st", a.st);
    const nameHTML = a.name.toUpperCase(),
      statusHTML = `<i></i>${a.status}<small>${a.tech}</small>`;
    fl.innerHTML = `<div class="fcard">${nameHTML}</div>`;
    wrap._flap = { el: fl, name: nameHTML, status: statusHTML, cur: nameHTML, q: Promise.resolve() };
    [kn.r, lcd.r].forEach(el => {
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
    });
    pushButton([kn.r, lcd.r], kn, 4, () => mobPress(k, false));
    MOB_UI.btns.push(wrap);
  });
  rbBuildPad(g); // the white rabbit's controller, folded away under the Attest button
  setInterval(() => {
    const d = new Date();
    scr
      .querySelectorAll(".ps-time")
      .forEach(t => (t.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0")));
  }, 10000);
}
/* label flip: the whole card turns edge-on (squash + darken), swaps its face, and turns back */
function flapTo(k, showStatus) {
  const F = MOB_UI.btns[k]._flap,
    target = showStatus ? F.status : F.name;
  if (F.want === target) return;
  F.want = target;
  F.q = F.q.then(
    () =>
      new Promise(res => {
        const card = F.el.querySelector(".fcard");
        if (reduce) {
          card.innerHTML = target;
          card.classList.toggle("st", showStatus);
          return res();
        }
        card.classList.remove("in");
        void card.offsetWidth;
        card.classList.add("out");
        setTimeout(() => {
          card.innerHTML = target;
          card.classList.toggle("st", showStatus);
          card.classList.remove("out");
          void card.offsetWidth;
          card.classList.add("in");
          setTimeout(() => {
            card.classList.remove("in");
            res();
          }, 250);
        }, 165);
      }),
  );
}
function mobSetOn(k) {
  MOB_UI.btns.forEach((b, j) => {
    const on = j === k;
    b.classList.toggle("on", on);
    flapTo(j, on);
  });
}
function mobScreen(state) {
  const s0 = MOB_UI.screen;
  s0.classList.remove("off", "boot", "home", "app");
  s0.classList.add(state);
}
function mobOn() {
  if (MOB_UI.on) return;
  MOB_UI.on = true;
  mobScreen("boot");
  clearTimeout(MOB_UI.t);
  MOB_UI.t = setTimeout(
    () => {
      mobScreen("home");
      if (MOB_UI.pending != null) {
        const k = MOB_UI.pending;
        MOB_UI.pending = null;
        setTimeout(() => mobLaunch(k), 350);
      }
    },
    reduce ? 0 : 1300,
  );
}
function mobOff() {
  if (!MOB_UI.on) return;
  MOB_UI.on = false;
  clearTimeout(MOB_UI.t);
  mobClose(true);
  mobScreen("off");
  mobSetOn(-1);
}
/* open an app like a phone does: zoom out of its icon */
function mobLaunch(k, iconEl) {
  if (!MOB_UI.on) {
    MOB_UI.pending = k;
    if (current !== 0) select(0, false);
    return;
  }
  if (MOB_UI.open === k) return;
  mobClose(true);
  const a = MOBILE_APPS[k],
    scr = MOB_UI.screen,
    ic = iconEl || scr.querySelector(`.ps-app-ic[data-k="${k}"]`);
  const r0 = scr.getBoundingClientRect ? null : null;
  const icon = ic.querySelector("i"),
    ox = icon.offsetLeft + ic.offsetLeft + icon.offsetWidth / 2 + scr.querySelector(".ps-grid").offsetLeft,
    oy = icon.offsetTop + ic.offsetTop + icon.offsetHeight / 2 + scr.querySelector(".ps-grid").offsetTop;
  const v = div("ps-appview closed", scr, { transformOrigin: `${ox}px ${oy}px` });
  v.style.setProperty("--ac", a.ac);
  v.classList.toggle("light", ["callbell", "nonagram", "widgetkit", "attest"].includes(a.id));
  v.innerHTML = `${mobDemo(a)}<div class="pa-home" title="Home"></div>`;
  v.querySelector(".pa-home").addEventListener("click", e => {
    e.stopPropagation();
    mobClose();
  });
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove("closed")));
  MOB_UI.view = v;
  MOB_UI.open = k;
  mobScreen("app");
  mobSetOn(k);
  if (current === 0) renderAppPanel(k);
}
function mobClose(instant) {
  const v = MOB_UI.view;
  if (!v) return;
  if (MOB_UI.open === "rabbit") rbStop(!MOB_UI.on);
  MOB_UI.view = null;
  MOB_UI.open = null;
  mobSetOn(-1);
  if (MOB_UI.on) mobScreen("home");
  if (instant) {
    v.remove();
    return;
  }
  v.classList.add("closed");
  setTimeout(() => v.remove(), 450);
  if (current === 0) renderPanel(0); // back to the list of projects
}
/* from the side panel: open the app on the cube's phone (rolling the cube there first if needed) */
function mobOpenApp(id) {
  const k = MOBILE_APPS.findIndex(a => a.id === id);
  if (k < 0) return;
  if (MOB_UI.open === k) {
    renderAppPanel(k);
    return;
  }
  mobLaunch(k);
  renderAppPanel(k);
}
/* retro button: press, flip the label to the project's status, launch its demo */
function mobPress(k, animate = true) {
  if (animate) pressKnob(MOB_UI.btns[k]._knob, 4);
  if (MOB_UI.open === k) {
    mobClose();
    return;
  }
  mobLaunch(k);
}
