/* =====================================================================
   DATASHEET PANEL — the floating panel: overview, one page per topic,
   per AI project, per job and per mobile app; the topic switches.
   ===================================================================== */
const panel = $("#panel"),
  pBody = $("#pBody");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function renderPanel(i) {
  AIST.hot = null;
  if (i < 0) {
    panel.style.setProperty("--c", "#63c6dc");
    $("#pPart").textContent = "RC-BOARD V2X";
    $("#pState").textContent = "standby";
    pBody.innerHTML = `<h1>${esc(PROFILE.name)}</h1><p class="lead">${esc(PROFILE.lead)}</p>${PROFILE.about.map(p => `<p>${esc(p)}</p>`).join("")}`;
  } else {
    const t = TOPICS[i];
    panel.style.setProperty("--c", t.color);
    $("#pPart").textContent = t.part;
    $("#pState").textContent = "active";
    const work = t.work
      .map(w => {
        const inner = `<b>${esc(w.name)}</b><span>${esc(w.desc)}</span>`;
        if (w.app)
          return `<button type="button" class="w-app" data-app="${w.app}"><img src="${MOB_IMG[w.app]}" alt=""><span>${inner}</span><em>›</em></button>`;
        if (w.proj) {
          const q = AI_PROJECTS[w.proj];
          return `<button type="button" class="w-app w-proj" data-proj="${w.proj}"><i class="proj-ic">${aiIcon(w.proj)}</i><span><b>${esc(q.name)}</b><span>${esc(q.sub)}</span></span><em>›</em></button>`;
        }
        if (w.exp) {
          const e = EXPERIENCES[w.exp];
          return `<button type="button" class="w-app w-exp" data-exp="${w.exp}"><img src="${e.logo()}" alt=""><span><b>${esc(e.company)}</b><span>${esc(e.role)}</span><small>${esc(e.dates)} · ${esc(e.place)}</small></span><em>›</em></button>`;
        }
        return w.url
          ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="w todo">${inner}</div>`;
      })
      .join("");
    pBody.innerHTML = `<h1>${esc(t.name)}</h1><p class="lead">${esc(t.tagline)}</p><p>${esc(t.description)}</p>
      <h2>Pinout</h2><table class="pins">${t.pins.map((p, k) => `<tr><td>P${String(k + 1).padStart(2, "0")}</td><td>${esc(p)}</td></tr>`).join("")}</table>
      <h2>${esc(t.workTitle || "Selected work")}</h2><div class="work">${work}</div>
      ${t.work.some(w => w.exp) ? `<a class="w-more" href="${esc(PROFILE.links.find(l => l.id === "linkedin").url)}" target="_blank" rel="noopener">Full history on LinkedIn ›</a>` : ""}
      ${t.more ? `<h2>${esc(t.more.title)}</h2><div class="work"><a href="${esc(t.more.url)}" target="_blank" rel="noopener"><b>${esc(t.more.label)}</b><span>${esc(t.more.desc)}</span></a></div>` : ""}`;
    pBody.querySelectorAll("[data-app]").forEach(b => b.addEventListener("click", () => mobOpenApp(b.dataset.app)));
    pBody.querySelectorAll("[data-exp]").forEach(b => b.addEventListener("click", () => renderExpPanel(b.dataset.exp)));
    pBody
      .querySelectorAll("[data-proj]")
      .forEach(b => b.addEventListener("click", () => renderProjPanel(b.dataset.proj)));
  }
  pBody.parentElement.scrollTop = 0;
  pBody.classList.remove("swap");
  void pBody.offsetWidth;
  pBody.classList.add("swap");
}
/* one mobile app: what it is, highlights, where to get it */
const LINK_IC = {
  store:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v3h16v-3"/></svg>',
  web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5m8-10 5 5-5 5"/></svg>',
};
/* AI projects: one icon each (same keys as AI_PROJECTS in content.js) */
const AI_ICON = {
  automation:
    '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><rect x="14" y="9.5" width="7" height="5" rx="1.5"/><path d="M8.5 6h2a3 3 0 0 1 3 3v1.5M8.5 18h2a3 3 0 0 0 3-3v-1.5"/>',
  agents: '<path d="M4 5h16v10H9l-4 4v-4H4z"/><path d="M12 7.5l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z"/>',
  mcp: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
  rag: '<path d="M4 5.5C4 4 5 3.5 6.5 3.5H14v13H6.5C5 16.5 4 17 4 18.5zM4 18.5C4 20 5 20.5 6.5 20.5H14"/><circle cx="17" cy="14" r="3"/><path d="M19.2 16.2L21.5 18.5"/>',
  prompts:
    '<path d="M8 4c-2 0-2.5 1-2.5 3s-.5 3-2 3.5V13c1.5.5 2 1.5 2 3.5S6 20 8 20M16 4c2 0 2.5 1 2.5 3s.5 3 2 3.5V13c-1.5.5-2 1.5-2 3.5S18 20 16 20"/><path d="M9.5 9h5M9.5 12h5M9.5 15h3"/>',
  evals: '<path d="M4 20h16M6.5 17v-5M11 17V8M15.5 17v-3M20 17V5"/><path d="M5 9.5l4-3 4 3 6-5"/>',
};
const aiIcon = id =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${AI_ICON[id]}</svg>`;
/* a screenshot, full size over the page; a click or Esc closes it */
function openShot(src, alt) {
  const o = div("shot-view", document.body);
  o.innerHTML = `<img src="${src}" alt="${esc(alt)}"><button type="button" aria-label="Close">×</button>`;
  const close = () => {
    o.remove();
    removeEventListener("keydown", key, true);
  };
  const key = e => {
    if (e.key === "Escape") {
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    }
  };
  o.addEventListener("click", close);
  addEventListener("keydown", key, true);
  o.querySelector("button").focus();
}
function renderProjPanel(id) {
  const q = AI_PROJECTS[id],
    ti = TOPICS.findIndex(t => t.work.some(w => w.proj === id)),
    t = TOPICS[ti];
  panel.style.setProperty("--c", t.color);
  $("#pPart").textContent = `${t.part} · ${q.tag}`;
  $("#pState").textContent = "active";
  AIST.hot = q.tag; // its module lights up around the hologram
  pBody.innerHTML = `<button type="button" class="p-back">‹ ${esc(t.name)}</button>
    <div class="app-hd"><i class="proj-ic big">${aiIcon(id)}</i><div><h1>${esc(q.name)}</h1><div class="exp-co">Callbell · since 2023</div></div></div>
    <div class="app-tags exp-tags">${q.tags.map(x => `<span>${esc(x)}</span>`).join("")}</div>
    <p class="lead">${esc(q.lead)}</p>
    ${q.shot ? `<figure class="p-shot"><button type="button" aria-label="View full size"><img src="${q.shot.src()}" alt="${esc(q.name)} screenshot"><span>⤢ Full size</span></button><figcaption>${esc(q.shot.caption)}</figcaption></figure>` : ""}
    <h2>What it does</h2><ul class="app-feats">${q.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
    <h2>Context</h2><button type="button" class="app-link proj-exp"><img src="${MOB_IMG.callbell}" alt=""><span>Senior Software Engineer at Callbell</span></button>`;
  pBody.querySelector(".p-back").addEventListener("click", () => renderPanel(ti));
  const shot = pBody.querySelector(".p-shot button");
  if (shot) shot.addEventListener("click", () => openShot(q.shot.src(), q.name));
  pBody.querySelector(".proj-exp").addEventListener("click", () => {
    const wi = TOPICS.findIndex(x => x.work.some(w => w.exp === "callbell"));
    select(wi, true);
    renderExpPanel("callbell");
  });
  pBody.parentElement.scrollTop = 0;
  pBody.classList.remove("swap");
  void pBody.offsetWidth;
  pBody.classList.add("swap");
}
function renderExpPanel(id) {
  const e = EXPERIENCES[id],
    ti = TOPICS.findIndex(t => t.work.some(w => w.exp === id)),
    t = TOPICS[ti];
  panel.style.setProperty("--c", t.color);
  $("#pPart").textContent = `${t.part} · ${e.company.toUpperCase()}`;
  $("#pState").textContent = e.dates.endsWith("today") ? "current" : "past";
  const sec = e.sections
    .map(
      x => `${x.title ? `<h2>${esc(x.title)}</h2>` : `<h2>What I did</h2>`}<ul class="app-feats">${x.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
    ${x.app ? `<button type="button" class="app-link exp-app" data-app="${x.app}"><img src="${MOB_IMG[x.app]}" alt=""><span>Open the mobile app</span></button>` : ""}`,
    )
    .join("");
  pBody.innerHTML = `<button type="button" class="p-back">‹ ${esc(t.name)}</button>
    <div class="app-hd"><img src="${e.logo()}" alt=""><div><h1>${esc(e.role)}</h1><div class="exp-co">${esc(e.company)}${e.kind ? ` · ${esc(e.kind)}` : ""}</div></div></div>
    <div class="exp-meta"><span>${esc(e.dates)}</span><span>${esc(e.place)}</span></div>
    <div class="app-tags exp-tags">${e.tags.map(x => `<span>${esc(x)}</span>`).join("")}</div>
    <p class="lead">${esc(e.lead)}</p>${(e.about || []).map(x => `<p>${esc(x)}</p>`).join("")}${sec}
    <h2>Links</h2><div class="app-links">${e.links.map(l => `<a class="app-link" href="${esc(l.url)}" target="_blank" rel="noopener">${LINK_IC[l.kind]}<span>${esc(l.label)}</span></a>`).join("")}</div>`;
  pBody.querySelector(".p-back").addEventListener("click", () => renderPanel(ti));
  pBody.querySelectorAll("[data-app]").forEach(b => b.addEventListener("click", () => mobOpenApp(b.dataset.app))); // rolls the cube to the phone
  pBody.parentElement.scrollTop = 0;
  pBody.classList.remove("swap");
  void pBody.offsetWidth;
  pBody.classList.add("swap");
}
function renderAppPanel(k) {
  const a = MOBILE_APPS[k],
    t = TOPICS[0];
  panel.style.setProperty("--c", t.color);
  $("#pPart").textContent = `${t.part} · ${a.name.toUpperCase()}`;
  $("#pState").textContent = "running";
  const links = a.links.length
    ? `<h2>${a.links.some(l => l.kind === "store") ? "Get the app" : "Links"}</h2><div class="app-links">${a.links.map(l => `<a class="app-link" href="${esc(l.url)}" target="_blank" rel="noopener">${LINK_IC[l.kind]}<span>${esc(l.label)}</span></a>`).join("")}</div>`
    : `<h2>Availability</h2><p>Not released yet. Coming soon.</p>`;
  pBody.innerHTML = `<button type="button" class="p-back">‹ ${esc(t.name)}</button>
    <div class="app-hd"><img src="${MOB_IMG[a.id]}" alt=""><div><h1>${esc(a.full)}</h1><div class="app-tags">${a.tags.map(x => `<span>${esc(x)}</span>`).join("")}</div></div></div>
    <div class="app-state" style="--st:${a.st}"><i></i>${esc(a.state)}</div>
    <p class="lead">${esc(a.lead)}</p>${a.about.map(x => `<p>${esc(x)}</p>`).join("")}
    <h2>Highlights</h2><ul class="app-feats">${a.feats.map(f => `<li>${esc(f)}</li>`).join("")}</ul>${links}`;
  pBody.querySelector(".p-back").addEventListener("click", () => {
    MOB_UI.pending = null;
    if (MOB_UI.view) mobClose();
    else renderPanel(0);
  });
  pBody.parentElement.scrollTop = 0;
  pBody.classList.remove("swap");
  void pBody.offsetWidth;
  pBody.classList.add("swap");
}
const switches = TOPICS.map((t, i) => {
  const b = div("sw", $("#swRow"), null, "button");
  b.type = "button";
  b.style.setProperty("--c2", t.color);
  b.innerHTML = `<i></i>${t.name}`;
  b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => select(i, true));
  return b;
});
$("#homeBtn").addEventListener("click", () => select(-1));
