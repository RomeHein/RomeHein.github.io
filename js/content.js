/* =====================================================================
   CONTENT — everything about you lives here. TODO entries are
   placeholders for your real projects.
   ===================================================================== */
const PROFILE = {
  name: "Romain Cayzac",
  lead: "Engineer across hardware, software and AI.",
  about: [
    "Each push-button on this board powers one part of what I do. Press one and the board turns to that module, the screen boots it and this datasheet fills in.",
    "I like projects where the layers meet: firmware talking to a backend, a model driving a real device, a plan that survives contact with the workshop.",
  ],
  links: [
    // EDIT: your real LinkedIn and email
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/romaincayzac/" },
    { id: "github", label: "GitHub", url: "https://github.com/RomeHein" },
    { id: "mail", label: "Email", url: "mailto:hello@example.com" },
  ],
};

const TOPICS = [
  {
    id: "mobile-projects",
    code: "MOBILE",
    part: "RC-MB01",
    label: "MOBILE",
    name: "Mobile projects",
    color: "#45d6c4",
    icon: "mobile",
    tagline: "Apps that live in people's pockets, from the first sketch to the store.",
    description:
      "Designing, building and shipping mobile apps end to end: product thinking, native development, releases and the feedback loop after launch.",
    pins: [
      "iOS / Swift, SwiftUI",
      "Cross-platform apps",
      "App architecture",
      "Backend and API integration",
      "App Store and TestFlight releases",
      "Over-the-air (OTA) updates for React Native apps",
      "Analytics and iteration",
    ],
    work: [
      {
        app: "callbell",
        name: "Callbell Chat",
        desc: "One team inbox for WhatsApp, Messenger, Instagram and Telegram.",
      },
      { app: "nonagram", name: "Nonagram", desc: "Private, encrypted photo boards for each circle of your life." },
      { app: "openstrum", name: "OpenStrum", desc: "Tuner, chord library, lessons and a voice trainer. Coming soon." },
      { app: "widgetkit", name: "Widget Kit", desc: "Tools and games for the iPhone's notification center, in Swift." },
      { app: "attest", name: "Attest", desc: "COVID-19 travel attestations for France, in Swift. Open source." },
    ],
    screen: [
      "$ xcodebuild archive",
      "build ......... [ok]",
      "tests ........ green",
      "testflight .... sent",
      "review ........ [ok]",
      "> ship to store",
    ],
  },
  {
    id: "ai",
    code: "AI",
    part: "RC-AI02",
    label: "AI",
    name: "Artificial intelligence",
    color: "#ff6fd8",
    icon: "ai",
    tagline: "Putting language models to work inside real products and workflows.",
    description:
      "Designing LLM features, agents and automations, from prompt and tool design to evaluation, so the model does something useful and measurable. Most of it at Callbell, where I own the automation, chatbot and AI-agent domain.",
    pins: [
      "LLM integration and APIs",
      "Agents and tool use",
      "Retrieval (RAG) pipelines",
      "Prompt design and evaluation",
      "Workflow automation",
    ],
    workTitle: "Projects at Callbell",
    work: [
      { proj: "automation" },
      { proj: "agents" },
      { proj: "mcp" },
      { proj: "rag" },
      { proj: "prompts" },
      { proj: "evals" },
    ],
    screen: [
      "$ load agent.cfg",
      "model ......... [ok]",
      "tools ....... linked",
      "memory ........ [ok]",
      "evals ...... passing",
      "> think, then act",
    ],
  },
  {
    id: "web-development",
    alias: "software",
    code: "WEB",
    part: "RC-SW03",
    label: "WEB DEV",
    name: "Web development",
    color: "#58a9ff",
    icon: "soft",
    tagline: "Full-stack web work: front ends, back ends and the pipelines that ship them.",
    description:
      "From the design file to production: interfaces, APIs and databases, and the build and deployment pipelines around them.",
    pins: [
      "Design (Figma)",
      "Frontend (React, Vue.js, TypeScript)",
      "Backend (Node.js, Ruby on Rails, Go · REST / GraphQL)",
      "Databases (PostgreSQL, MySQL)",
      "DevOps (Docker, Kubernetes, GitHub Actions)",
    ],
    workTitle: "Experience",
    work: [{ exp: "callbell" }, { exp: "chandago" }, { exp: "ladbrokes" }, { exp: "dassault" }, { exp: "speedwell" }],
    more: {
      title: "Personal projects",
      label: "GitHub · RomeHein",
      desc: "Side projects and open source: HomeInOne, PassPass, Attest and more.",
      url: "https://github.com/RomeHein",
    },
    screen: [
      "$ git pull",
      "build ......... [ok]",
      "tests ........ green",
      "deploy ..... web/api",
      "status ........ live",
      "> ship it",
    ],
  },
  {
    id: "maker",
    code: "MAKER",
    part: "RC-MK04",
    label: "MAKER",
    name: "Maker",
    color: "#ffb547",
    icon: "elec",
    tagline: "Hardware products from the first idea to a working prototype, and on to production.",
    description:
      "I handle every part of the process myself: the enclosure and parts in CAD, the schematic and PCB in KiCad, the electronics, and the code that runs on the device. That is how I build sensors, wearables and smart home devices.",
    pins: [
      "CAD and 3D design (printed enclosures and parts)",
      "Schematic and PCB design (KiCad)",
      "Electronics: sensors, power, relays",
      "ESP32, Arduino and Raspberry Pi",
      "Firmware and code (C++, MQTT, home automation)",
      "Prototype to production",
    ],
    work: [
      {
        name: "ESPecial",
        desc: "ESP32 automation with a web interface and a Telegram bot.",
        url: "https://github.com/RomeHein/ESPecial",
      },
      {
        name: "ESPInstaller",
        desc: "Install any Arduino project remotely from its GitHub repo, directly from your ESP32.",
        url: "https://github.com/RomeHein/ESPInstaller",
      },
      {
        name: "pimodule",
        desc: "A Node package to control the UPS PIco HV3.0 HAT for Raspberry Pi.",
        url: "https://github.com/RomeHein/pimodule",
      },
    ],
    screen: [
      "$ flash esp32",
      "i2c scan ..... 3 dev",
      "mqtt .... connected",
      "relay[1] ....... on",
      "vcc .......... 3.3v",
      "> it's alive",
    ],
  },
];
/* the board's screen at rest; it then works as a terminal (see board.js): the prompt waits on the last line, and
   the secrets line counts the hidden games solved, one on each topic's face */
const SCREEN_HINT = "> follow the white rabbit";
const IDLE_SCREEN = ["boot .......... [ok]", "modules ....... [ok]", "secrets ........ 0/4", "", SCREEN_HINT, "$ "];

/* AI projects (at Callbell), shown on the AI panel; `tag` is the module that lights up around the hologram.
   Each project also needs an icon in AI_ICON (panel.js). */
const AI_PROJECTS = {
  automation: {
    tag: "AUTOMATION",
    name: "Bot builder",
    sub: "Deterministic automations in a visual, n8n-style builder.",
    tags: ["Visual builder", "Deterministic flows", "Multichannel"],
    lead: "A visual builder for deterministic automations: support teams draw their flows, and they run on every channel.",
    shot: {
      src: () => AI_SHOT.botBuilder,
      caption:
        "A real onboarding flow in the builder: one branch per language and channel, tags, routing to teams, waits and fallbacks.",
    },
    items: [
      "30+ action types, including webhooks and calendar integrations.",
      "Multilingual templates, automatic routing and assignment of conversations.",
      "CSAT flows and audio transcription.",
      "Drafts, numbered versions and a simulator to test a flow before publishing it.",
      "One flow runs on every channel: WhatsApp, Instagram, Messenger, Telegram, TikTok and web chat.",
    ],
  },
  agents: {
    tag: "AGENTS",
    name: "AI agent system",
    sub: "LLM agents that can be mixed with deterministic bot flows.",
    tags: ["LLM agents", "Structured outputs", "Human hand-off"],
    lead: "AI agents that hold real customer conversations, and can be mixed with the deterministic bot flows, so the parts that must stay predictable stay scripted.",
    items: [
      "LLM-driven conversations with structured outputs and goal tracking.",
      "Agents and deterministic bot flows can be combined in the same automation.",
      "Configurable hand-off to human teams: human requested, user frustrated, no response, credits depleted.",
      "AI-credit metering.",
    ],
  },
  mcp: {
    tag: "MCP",
    name: "MCP in AI actions",
    sub: "Agents acting on conversations through the Model Context Protocol.",
    tags: ["Model Context Protocol", "Tool use", "Security"],
    lead: "The tool-use layer: MCP integrations available as AI actions, so agents can act on conversations and connected services.",
    items: [
      "MCP integrations exposed as actions an agent can call.",
      "Schema-validated tools.",
      "Least-privilege, short-lived credentials for every call.",
    ],
  },
  rag: {
    tag: "RAG",
    name: "Knowledge bases (RAG)",
    sub: "Retrieval over each customer's knowledge base, inside agent turns.",
    tags: ["RAG", "Hybrid search", "Reranking"],
    lead: "Retrieval-augmented generation for the AI agent system: agents answer from each customer's own knowledge base.",
    items: [
      "Document ingestion into customer knowledge bases.",
      "Hybrid search and reranking.",
      "Retrieved passages added to the agent's turn.",
    ],
  },
  prompts: {
    tag: "PROMPTS",
    name: "Dynamic system prompts",
    sub: "System prompts assembled for each agent and conversation.",
    tags: ["Prompt design", "Versioning"],
    lead: "System prompts are not written once: they are assembled at run time for each agent and each conversation.",
    items: [
      "The system prompt is composed from the agent's configuration and the state of the conversation.",
      "Prompts are versioned, so every change can be traced and compared.",
    ],
  },
  evals: {
    tag: "EVALS",
    name: "Prompt evaluation",
    sub: "Evaluating prompts and tracing agent runs with Langfuse.",
    tags: ["Langfuse", "Evaluation", "Observability"],
    lead: "LLM observability and evaluation with Langfuse, so prompt changes are measured before they ship.",
    items: [
      "Prompt versioning.",
      "Evaluating prompt versions in Langfuse.",
      "Tracing and cost tracking for every agent run.",
    ],
  },
};

/* Commercial experience, shown on the Web development panel (from LinkedIn) */
const EXPERIENCES = {
  callbell: {
    company: "Callbell",
    role: "Senior Software Engineer",
    dates: "Sep 2021 – today",
    place: "France · Remote",
    kind: "Permanent",
    logo: () => MOB_IMG.callbell,
    tags: ["Ruby on Rails", "Go", "React", "LLM agents", "MCP", "RAG"],
    lead: "Callbell is a customer messaging platform that brings WhatsApp, Instagram, Messenger, Telegram, TikTok and web chat conversations into one place for support and sales teams (20,000+ users).",
    about: ["I own the automation, chatbot and AI-agent domain, full stack."],
    sections: [
      {
        title: "Since 2023 · Bots, automation and AI agents",
        items: [
          "Designed and shipped the AI Agent feature: LLM-driven conversations with structured outputs, goal tracking, configurable hand-off to human teams (human requested, user frustrated, no response, credits depleted) and AI-credit metering.",
          "Built the tool-use layer that lets agents act on conversations through the Model Context Protocol: schema-validated tools, least-privilege short-lived credentials.",
          "Integrated retrieval-augmented generation over customer knowledge bases (document ingestion, hybrid search, reranking) into agent turns.",
          "Built and evolved the visual bot builder used across all channels: 30+ action types, multilingual templates, automatic routing and assignment, webhooks and calendar integrations, CSAT flows, audio transcription.",
          "LLM observability: prompt versioning, tracing and cost tracking per agent run.",
        ],
      },
      {
        title: "2021 – 2023 · Core product",
        items: ["Full-stack features on the shared inbox and the mobile app for support and sales teams."],
        app: "callbell",
      },
    ],
    links: [{ kind: "web", label: "callbell.eu", url: "https://www.callbell.eu" }],
  },
  chandago: {
    company: "Chandago",
    role: "R&D Software Engineer",
    dates: "Oct 2018 – Dec 2019",
    place: "Bordeaux area, France",
    logo: () => EXP_IMG.chandago,
    tags: ["Vue.js", "Node.js", "MySQL", "Graphite", "iOS"],
    lead: "Full-stack and iOS engineer on AppConsent, a GDPR and ePrivacy consent-management platform.",
    sections: [
      {
        items: [
          "Built the back office (Vue.js) and the Node.js API on MySQL, with Graphite metrics.",
          "Built the AppConsent iOS framework that publishers embed in their apps to collect consent, and the companion mobile app.",
        ],
      },
    ],
    links: [{ kind: "web", label: "chandago.com", url: "https://www.chandago.com" }],
  },
  ladbrokes: {
    company: "Ladbrokes",
    role: "Software Engineer",
    dates: "Feb 2018 – Jul 2018",
    place: "Brisbane, Australia",
    logo: () => EXP_IMG.ladbrokes,
    tags: ["Swift", "Objective-C", "React Native", "Node.js"],
    lead: "iOS engineer on the Ladbrokes betting app, with Node.js back-end work.",
    sections: [
      {
        items: [
          "Shipped card scanning and third-party payment integrations.",
          "Unit-tested releases, in Swift, Objective-C and React Native.",
        ],
      },
    ],
    links: [
      {
        kind: "store",
        label: "App Store",
        url: "https://apps.apple.com/au/app/ladbrokes-sports-betting-app/id710375963",
      },
    ],
  },
  dassault: {
    company: "Dassault Systèmes",
    role: "R&D Software Engineer",
    dates: "Aug 2017 – Feb 2018",
    place: "Brisbane, Australia",
    logo: () => EXP_IMG.dassault,
    tags: ["Polymer", "Node.js", "Jasmine", "Scrum"],
    lead: "Built a web application for mining simulations.",
    sections: [{ items: ["Front end in Polymer, back end in Node.js.", "Unit-tested with Jasmine, in a Scrum team."] }],
    links: [{ kind: "web", label: "3ds.com", url: "https://www.3ds.com" }],
  },
  speedwell: {
    company: "Speedwell",
    role: "Software Engineer",
    dates: "Jun 2016 – Aug 2017",
    place: "Brisbane, Australia",
    logo: () => EXP_IMG.speedwell,
    tags: ["Swift", "Objective-C", "iOS", "Front end"],
    lead: "Several iOS apps, and the front end of an Australian Government health website.",
    sections: [
      {
        items: [
          "Shipped several iOS apps in Swift and Objective-C: Brisbane Airport, Prowler Proof, and Dossiere, a highly secure document-delivery app for confidential government and corporate material.",
          "Built the front end of Head to Health (headtohealth.gov.au), the Australian Government's digital mental-health website.",
        ],
      },
    ],
    links: [{ kind: "web", label: "headtohealth.gov.au", url: "https://www.headtohealth.gov.au" }],
  },
};

/* Mobile apps: the buttons on the mobile face, the phone's home screen and the app panels, in this order */
const MOBILE_APPS = [
  {
    id: "callbell",
    name: "Callbell",
    full: "Callbell Chat",
    ac: "#7dbca7",
    status: "LIVE",
    st: "#2ecc71",
    tech: "React Native",
    tags: ["React Native", "iOS", "Android"],
    state: "Live on the App Store and Google Play",
    lead: "The mobile app of Callbell: one team inbox for WhatsApp, Messenger, Instagram and Telegram.",
    about: [
      "Businesses answer their customers from one place: every conversation lands in the same inbox, whatever the channel, and the whole team works on it together.",
      "It is as easy to use as a messaging app, with the tools a support team needs built in.",
    ],
    feats: [
      "WhatsApp, Messenger, Instagram and Telegram in one inbox",
      "Automatic routing, conversation reminders and message templates",
      "WhatsApp voice calls, answered from the native call screen",
      "Notifications, and links that open straight on a conversation",
      "In English, French, Italian, Spanish and Portuguese",
    ],
    links: [
      { kind: "store", label: "App Store", url: "https://apps.apple.com/fr/app/callbell-chat/id1476257476?l=en-GB" },
      {
        kind: "store",
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.callbell.mobilechat&hl=en-US",
      },
    ],
  },
  {
    id: "nonagram",
    name: "Nonagram",
    full: "Nonagram",
    ac: "#e08a63",
    status: "LIVE",
    st: "#2ecc71",
    tech: "cross-platform",
    tags: ["Cross-platform", "iOS", "Android"],
    state: "Live on the App Store and Google Play",
    lead: "Private photo boards you fill together with the people you love.",
    about: [
      "One board per circle of your life: family, best friends, your crew, the house renovation. Invite people with a link or a QR code; everyone on the board can post, nobody else can see a thing.",
      "Photos, videos, captions and comments on private boards are encrypted on the phone before they are uploaded. No feed, no ads, no tracking.",
    ],
    feats: [
      "End-to-end encrypted private boards",
      "Snap a photo or a short clip straight onto a board",
      "Draw, write and add stickers on any photo",
      "Emoji reactions and threaded comments",
      "Cast a board to any TV or browser (nonagram.org/display)",
      "In English, French, Spanish, Italian and Portuguese",
    ],
    links: [
      { kind: "web", label: "nonagram.org", url: "https://nonagram.org" },
      {
        kind: "store",
        label: "App Store",
        url: "https://apps.apple.com/app/nonagram-private-photo-share/id6793954270",
      },
      {
        kind: "store",
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.nonagram.app",
      },
    ],
  },
  {
    id: "openstrum",
    name: "OpenStrum",
    full: "OpenStrum",
    ac: "#a89cf2",
    status: "SOON",
    st: "#ffb547",
    tech: "cross-platform",
    tags: ["Cross-platform"],
    state: "Coming soon",
    lead: "A guitar companion: a tuner, a chord library and lessons, and a voice trainer.",
    about: [
      "A precise tuner that detects which string you play, works with alternate tunings and lets you set the reference pitch.",
      "Around it: a library of chords and charts, lessons to progress, and a voice trainer that helps singers find and hold the right note.",
    ],
    feats: [
      "Tuner with automatic string detection",
      "Alternate tunings and adjustable reference (A4 = 440 Hz)",
      "Chord library and chord charts",
      "Lessons",
      "Voice trainer to tune your voice",
    ],
    links: [],
  },
  {
    id: "widgetkit",
    name: "Widget Kit",
    full: "Widget Kit",
    ac: "#e89a4b",
    status: "LIVE",
    st: "#2ecc71",
    tech: "Swift",
    tags: ["iOS", "Swift"],
    state: "On the App Store since 2015",
    lead: "Tools and games for the iPhone's notification center, without unlocking the phone.",
    about: [
      "When iOS 8 opened the Today view to apps, Widget Kit grouped a whole toolbox into small widgets: instead of ten apps for ten small needs, everything is one swipe away.",
      "Every widget is an app extension, a tiny app with its own tight limits (about 12 MB of memory, against 1 GB for an app), which shaped how the whole thing was built.",
    ],
    feats: [
      "18 widgets in three themes, Social, Tool Box and Time, plus games",
      "Activity, position, data plan, disk, RAM and battery",
      "Calendar, countdowns, world clock, timer and stopwatch",
      "Twitter and news feeds, a calculator, shortcuts",
      "Games: memory, tic-tac-toe, align 4, dice",
    ],
    links: [
      {
        kind: "store",
        label: "App Store",
        url: "https://apps.apple.com/us/app/widget-kit-tools-and-games-for-your-notification-center/id982272883",
      },
    ],
  },
  {
    id: "attest",
    name: "Attest",
    full: "Attest",
    ac: "#75f79c",
    status: "OPEN SOURCE",
    st: "#58a6ff",
    tech: "Swift",
    tags: ["iOS", "Swift", "France"],
    state: "Open source on GitHub",
    lead: "Travel attestations for the French COVID-19 lockdowns, generated in one tap.",
    about: [
      "During the 2020 lockdowns in France, every trip outside needed a signed attestation. Attest lets you create your profiles once, then generate the day's attestation as a PDF, ready to print.",
      "Written in under 24 hours. Personal data never leaves the phone and the code is public so anyone can check it. Apple declined it for the App Store, so it shipped as source code and as an installable IPA.",
    ],
    feats: [
      "Profiles created once, attestation dated today",
      "PDF generation and sharing",
      "No data collected: everything stays on the phone",
      "Open source (MIT)",
    ],
    links: [{ kind: "code", label: "GitHub", url: "https://github.com/RomeHein/attest" }],
  },
];

/* Images, in img/: screenshots, company logos, app icons and screenshots (cropped from the apps) */
const AI_SHOT = {
  botBuilder: "img/ai/bot-builder.jpg",
};
const EXP_IMG = {
  speedwell: "img/experience/speedwell.png",
  chandago: "img/experience/chandago.png",
  ladbrokes: "img/experience/ladbrokes.png",
  dassault: "img/experience/dassault.png",
};
const MOB_IMG = {
  callbell: "img/mobile/callbell.jpg",
  nonagram: "img/mobile/nonagram.jpg",
  widgetkit: "img/mobile/widgetkit.jpg",
  attest: "img/mobile/attest.jpg",
  ng1: "img/mobile/nonagram-1.jpg",
  ng2: "img/mobile/nonagram-2.jpg",
  ng3: "img/mobile/nonagram-3.jpg",
  ng4: "img/mobile/nonagram-4.jpg",
  ng5: "img/mobile/nonagram-5.jpg",
  wk1: "img/mobile/widgetkit-1.jpg",
  wk2: "img/mobile/widgetkit-2.jpg",
  wk3: "img/mobile/widgetkit-3.jpg",
  openstrum: "img/mobile/openstrum.svg",
};
