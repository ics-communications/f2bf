const pptxgen = require("pptxgenjs");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { imageSize } = require("image-size");

// ══════════════════════════════════════════════
// IMAGE DOWNLOAD HELPER
// ══════════════════════════════════════════════
const IMG_DIR = path.join(__dirname, "_img_cache");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const doRequest = (reqUrl, redirects) => {
      if (redirects > 5) return reject(new Error("Too many redirects: " + url));
      mod.get(reqUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on("finish", () => ws.close(resolve));
        ws.on("error", reject);
      }).on("error", reject);
    };
    doRequest(url, 0);
  });
}

async function ensureImage(key, url) {
  const ext = url.match(/\.(jpe?g|png|webp|gif)/i)?.[1] || "jpg";
  const localPath = path.join(IMG_DIR, `${key}.${ext}`);
  if (!fs.existsSync(localPath)) {
    console.log(`  Downloading ${key}...`);
    await downloadFile(url, localPath);
  }
  return localPath;
}

// ══════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════
async function main() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  // Image URLs
  const URLS = {
    heroCover: "https://lightroom.adobe.com/v2c/spaces/796283b06b914932aaff4c457375828c/assets/30c19c62dc8448afb3d319426fd0d25c/revisions/33c9a6f8378d4ebea32cfb4f8c7d50ed/renditions/321e45597328e883c4e3599a2d4a4b1c",
    groupPhoto: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/f0faaa0c016a4b8ea240f85f17e2cb1e/revisions/57a5dd3a9fd4465ebd0da11be4657afb/renditions/4c4b344875c946f60233f891b131730a",
    churchInterior: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/775c04442a88322073cac24a125450cf/revisions/78a38af1dbfc6c96835403a41a8e3686/renditions/4b74825b0c1b8b4db5492301e81827e1",
    seminarDiscussion: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/24eada41557e46b79d5497850b7fe992/revisions/a768f52ccef249aba0dbb1a53746d965/renditions/49f0eee5fba45ed7a003be00a7565624",
    booksStudy: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/8d7495845b158f3e456a82bb0ec4bff0/revisions/35f4d5bd371699f1012e16fab1c058bd/renditions/21e84ac83daa19b516686fbe6c99d5e1",
    communityGathering: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/17d8f5c74f29479b90326c635ad2edcc/revisions/48661684b3ac42a8bf9d9385b572ff7d/renditions/f2a68f5a48091dd73b2183a0fbd74c56",
    conferencePhoto: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/2d05f111fd5740b0bf152d504666a0b7/revisions/bc4fbd9b89024de289356c65d8e8bd3c/renditions/f64c33e1866ef7ba69ff1f509ddbb55d",
    icsLogo: "https://images.squarespace-cdn.com/content/v1/69961bfd9be8a352ca34cb2f/1771445259448-EVZXO6XGJPH95Y3MLV7Q/Logo+w+White+Writing+-+Transparent+Background.png?format=1500w",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?data=https%3A%2F%2Ff2bf.icscanada.edu&size=600x600&ecc=H&margin=1",
    duMez: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/59ce09f32a58fc316e527bcac3ad7d8a/revisions/7b6e0c0d080a8cca9fab99b0995a2faa/renditions/9ede31d929031de67041121df4df02a4",
    thomas: "https://images.squarespace-cdn.com/content/v1/66e782ff6d826327d4cbf069/259ee5d1-ff8e-412c-97a2-5896a5a18e18/DSCF1643+2.JPEG?format=1000w",
    keesmaat: "https://images.squarespace-cdn.com/content/v1/5d35d91930e35e0001f32247/0fcc6065-90e9-4a47-b3cb-7351d0a4c970/Sylvia%2Bheadshot%2Bbirch%2Btree%2B%281%29.jpeg",
    berglund: "https://images.squarespace-cdn.com/content/v1/69727fb4d6a46a29f916f46c/1381afca-dddd-4968-9ddb-ff40af3676f5/Berglund%2Bauthor%2Bphoto.jpg",
    prior: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/2d31b1d604d6538884d402ac037d369f/revisions/e75081dd3e4567a5fe6590cbc85cb12d/renditions/8b516c6d1e06707f737b0fda5e14f3cc",
    reichel: "https://ptsem.edu/wp-content/uploads/2024/04/Hanna-Reichel-News-Image-1.jpg",
    reitsma: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/ac9ebddbbf76bdfc058b0aa14d83a7d4/revisions/1b94460a02223f66fef75f366713a3ef/renditions/79d75a0f53fa09ac959c328dd508bb6d",
    taylor: "https://www.drmatthewdtaylor.com/ui/images/mwvL1vOhAf-500.webp",
    benjamins: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/4a7c49aa254f82866883d4ef75ed8fdd/revisions/f6c7ed0159314288a811c2e40aeb8435/renditions/1bd73e02f88bb8f9fa3929d07a0f6583",
    kuipers: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/b2c10be223564c4802d880c29342eff3/revisions/f91248eeef584c9a99b27f34b97cf736/renditions/80443c43064eb8ab5e73f7a8c1f86360",
    strauss: "https://lightroom.adobe.com/v2c/spaces/8e293c41299846de9eaf08c99ce6ee2a/assets/1989be880e740ae434956f4b5c309956/revisions/aade7317e21341bfa27d80682c0cdb11/renditions/17c5a8a134b987c53cbc6f72c7d4b019",
    walsh: "https://bibleremixed.ca/cspics/graphics545.jpg?v=2",
  };

  // Download all images
  console.log("Downloading images...");
  const IMG = {};
  for (const [key, url] of Object.entries(URLS)) {
    try {
      IMG[key] = await ensureImage(key, url);
    } catch (e) {
      console.warn(`  WARNING: Failed to download ${key}: ${e.message}`);
      IMG[key] = url; // fallback to URL
    }
  }
  console.log("All images ready.\n");

  // ══════════════════════════════════════════════
  // BUILD PRESENTATION
  // ══════════════════════════════════════════════
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Institute for Christian Studies";
  pres.title = "Free to be Faithful — 2025-2026";
  pres.subject = "Equipping Christians for Democratic Life";

  const C = {
    tealDeep: "0F2631", teal: "1B3A4B", tealMid: "25516A",
    red: "C83C2C", cream: "F0EBE3", white: "FFFFFF",
    muted: "7E929E", body: "3D4F59", creamDark: "D6DDE2",
  };
  const DISPLAY = "Playfair Display";
  const SANS = "Source Sans 3";
  const SW = 10;
  const SH = 5.625;

  // ══════════════════════════════════════════════
  // SLIDE 1 — TITLE / FRONT COVER
  // ══════════════════════════════════════════════
  let s1 = pres.addSlide();
  s1.background = { color: C.tealDeep };
  s1.addImage({ path: IMG.heroCover, x: 0, y: 0, w: SW, h: SH, sizing: { type: "cover", w: SW, h: SH }, transparency: 50 });
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.tealDeep, transparency: 40 } });
  s1.addText("INSTITUTE FOR CHRISTIAN STUDIES", {
    x: 0.8, y: 0.6, w: 8.4, h: 0.4,
    fontFace: SANS, fontSize: 9, color: C.muted, charSpacing: 4, bold: true, margin: 0
  });
  s1.addText([
    { text: "Free", options: { fontSize: 54, bold: true, fontFace: DISPLAY, color: C.cream, breakLine: true } },
    { text: "to be", options: { fontSize: 54, italic: true, fontFace: DISPLAY, color: C.creamDark, breakLine: true } },
    { text: "Faithful", options: { fontSize: 54, bold: true, fontFace: DISPLAY, color: C.cream } },
  ], { x: 0.8, y: 1.1, w: 5, h: 3.2, lineSpacingMultiple: 0.85, margin: 0 });
  s1.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.0, w: 0.6, h: 0.04, fill: { color: C.red } });
  s1.addText("Equipping Christians for Democratic Life.", {
    x: 0.8, y: 4.15, w: 5, h: 0.4,
    fontFace: DISPLAY, fontSize: 14, italic: true, color: C.cream, margin: 0
  });
  s1.addText("2025 — 2026 SEASON", {
    x: 0.8, y: 4.7, w: 4, h: 0.3,
    fontFace: SANS, fontSize: 8, color: C.muted, bold: true, charSpacing: 4, margin: 0
  });

  // ══════════════════════════════════════════════
  // SLIDE 2 — SCRIPTURE
  // ══════════════════════════════════════════════
  let s2 = pres.addSlide();
  s2.background = { color: C.tealDeep };
  s2.addText("“", {
    x: 1.5, y: 0.3, w: 2, h: 2,
    fontFace: DISPLAY, fontSize: 120, color: C.red, margin: 0,
  });
  s2.addText("For freedom Christ has set us free.\nStand firm, therefore, and do not\nsubmit again to a yoke of slavery.", {
    x: 1.5, y: 1.5, w: 7, h: 2.2,
    fontFace: DISPLAY, fontSize: 26, italic: true, color: C.cream, lineSpacingMultiple: 1.3, margin: 0,
  });
  s2.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 3.85, w: 0.5, h: 0.035, fill: { color: C.red } });
  s2.addText("GALATIANS 5 : 1", {
    x: 1.5, y: 4.05, w: 4, h: 0.35,
    fontFace: SANS, fontSize: 9, color: C.muted, bold: true, charSpacing: 4, margin: 0
  });

  // ══════════════════════════════════════════════
  // SLIDE 3 — MISSION
  // ══════════════════════════════════════════════
  let s3 = pres.addSlide();
  s3.background = { color: C.cream };
  s3.addImage({ path: IMG.groupPhoto, x: 5.2, y: 0, w: 4.8, h: SH, sizing: { type: "cover", w: 4.8, h: SH } });
  s3.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 0, w: 4.8, h: SH, fill: { color: C.tealDeep, transparency: 55 } });
  s3.addText("OUR MISSION", {
    x: 0.8, y: 0.7, w: 4, h: 0.35,
    fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0
  });
  s3.addText([
    { text: "Finding a", options: { breakLine: true } },
    { text: "Better Way.", options: {} },
  ], {
    x: 0.8, y: 1.1, w: 4.2, h: 1.4,
    fontFace: DISPLAY, fontSize: 38, bold: true, color: C.tealDeep, margin: 0, lineSpacingMultiple: 0.95
  });
  s3.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.55, w: 0.5, h: 0.035, fill: { color: C.red } });
  s3.addText("Free to be Faithful is a program, a resource, and a community designed to help Christians meet our complex moment. Our courses, events, and community develop believers who are both faithfully Christian and deeply committed to the common good.", {
    x: 0.8, y: 2.8, w: 4.0, h: 1.6,
    fontFace: SANS, fontSize: 12, color: C.body, lineSpacingMultiple: 1.45, margin: 0
  });
  s3.addText("“For freedom Christ has set us free.”", {
    x: 5.6, y: 4.4, w: 4.0, h: 0.5,
    fontFace: DISPLAY, fontSize: 11, italic: true, color: C.cream, align: "center", margin: 0
  });

  // ══════════════════════════════════════════════
  // SLIDE 4 — MANIFESTO
  // ══════════════════════════════════════════════
  let s4 = pres.addSlide();
  s4.background = { color: C.tealDeep };
  s4.addImage({ path: IMG.churchInterior, x: 0, y: 0, w: SW, h: SH, sizing: { type: "cover", w: SW, h: SH }, transparency: 80 });
  s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.tealDeep, transparency: 25 } });
  s4.addText([
    { text: "Rooted without becoming rigid.", options: { breakLine: true, fontSize: 26 } },
    { text: "", options: { breakLine: true, fontSize: 12 } },
    { text: "Bold without becoming belligerent.", options: { breakLine: true, fontSize: 26 } },
    { text: "", options: { breakLine: true, fontSize: 12 } },
    { text: "Faithful without becoming fearful.", options: { fontSize: 26 } },
  ], {
    x: 1.2, y: 1.0, w: 7.6, h: 3.6,
    fontFace: DISPLAY, italic: true, color: C.cream, align: "center", valign: "middle", margin: 0,
  });
  s4.addShape(pres.shapes.RECTANGLE, { x: 4.2, y: 1.0, w: 1.6, h: 0.03, fill: { color: C.red } });
  s4.addShape(pres.shapes.RECTANGLE, { x: 4.2, y: 4.55, w: 1.6, h: 0.03, fill: { color: C.red } });

  // ══════════════════════════════════════════════
  // SLIDE 5 — PILLAR 1: PROGRAM
  // ══════════════════════════════════════════════
  let s5 = pres.addSlide();
  s5.background = { color: C.cream };
  s5.addImage({ path: IMG.seminarDiscussion, x: 5.8, y: 0.5, w: 3.7, h: 4.625, sizing: { type: "cover", w: 3.7, h: 4.625 } });
  s5.addText("01", { x: 0.6, y: 0.3, w: 1.2, h: 1.2, fontFace: DISPLAY, fontSize: 48, bold: true, color: C.red, margin: 0 });
  s5.addText("WHAT WE OFFER", { x: 0.8, y: 0.5, w: 4, h: 0.3, fontFace: SANS, fontSize: 8, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s5.addText("Program", { x: 0.8, y: 1.2, w: 4.5, h: 0.7, fontFace: DISPLAY, fontSize: 34, bold: true, color: C.tealDeep, margin: 0 });
  s5.addText("Six-week online seminars led by world-class scholars, with the option to earn ICS credit toward degree completion.", {
    x: 0.8, y: 2.0, w: 4.5, h: 1.0, fontFace: SANS, fontSize: 13, color: C.body, lineSpacingMultiple: 1.5, margin: 0
  });
  s5.addText([
    { text: "Courses to foster deeper understanding", options: { bullet: true, breakLine: true } },
    { text: "Retreats and intensives for all walks", options: { bullet: true, breakLine: true } },
    { text: "Pathways toward a Master of Worldview Studies", options: { bullet: true } },
  ], { x: 0.8, y: 3.1, w: 4.5, h: 1.5, fontFace: SANS, fontSize: 12, color: C.tealMid, paraSpaceAfter: 6, margin: 0, bullet: { color: C.red } });

  // ══════════════════════════════════════════════
  // SLIDE 6 — PILLAR 2: RESOURCE
  // ══════════════════════════════════════════════
  let s6 = pres.addSlide();
  s6.background = { color: C.cream };
  s6.addImage({ path: IMG.booksStudy, x: 0.5, y: 0.5, w: 3.7, h: 4.625, sizing: { type: "cover", w: 3.7, h: 4.625 } });
  s6.addText("02", { x: 4.6, y: 0.3, w: 1.2, h: 1.2, fontFace: DISPLAY, fontSize: 48, bold: true, color: C.red, margin: 0 });
  s6.addText("WHAT WE OFFER", { x: 4.8, y: 0.5, w: 4, h: 0.3, fontFace: SANS, fontSize: 8, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s6.addText("Resource", { x: 4.8, y: 1.2, w: 4.5, h: 0.7, fontFace: DISPLAY, fontSize: 34, bold: true, color: C.tealDeep, margin: 0 });
  s6.addText("Curated texts, essays, and dialogues on the issues facing Christians today — gathered, framed, and made shareable.", {
    x: 4.8, y: 2.0, w: 4.5, h: 1.0, fontFace: SANS, fontSize: 13, color: C.body, lineSpacingMultiple: 1.5, margin: 0
  });
  s6.addText([
    { text: "Curated texts to dive deeper", options: { bullet: true, breakLine: true } },
    { text: "Shared expertise from scholars", options: { bullet: true, breakLine: true } },
    { text: "Enriching dialogues to relive or discover", options: { bullet: true } },
  ], { x: 4.8, y: 3.1, w: 4.5, h: 1.5, fontFace: SANS, fontSize: 12, color: C.tealMid, paraSpaceAfter: 6, margin: 0, bullet: { color: C.red } });

  // ══════════════════════════════════════════════
  // SLIDE 7 — PILLAR 3: COMMUNITY
  // ══════════════════════════════════════════════
  let s7 = pres.addSlide();
  s7.background = { color: C.cream };
  s7.addImage({ path: IMG.communityGathering, x: 5.8, y: 0.5, w: 3.7, h: 4.625, sizing: { type: "cover", w: 3.7, h: 4.625 } });
  s7.addText("03", { x: 0.6, y: 0.3, w: 1.2, h: 1.2, fontFace: DISPLAY, fontSize: 48, bold: true, color: C.red, margin: 0 });
  s7.addText("WHAT WE OFFER", { x: 0.8, y: 0.5, w: 4, h: 0.3, fontFace: SANS, fontSize: 8, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s7.addText("Community", { x: 0.8, y: 1.2, w: 4.5, h: 0.7, fontFace: DISPLAY, fontSize: 34, bold: true, color: C.tealDeep, margin: 0 });
  s7.addText("Open events, coalitions, and conversations with welcoming people from every Christian tradition.", {
    x: 0.8, y: 2.0, w: 4.5, h: 1.0, fontFace: SANS, fontSize: 13, color: C.body, lineSpacingMultiple: 1.5, margin: 0
  });
  s7.addText([
    { text: "Open events to strengthen coalitions", options: { bullet: true, breakLine: true } },
    { text: "Timely writing to challenge and inform", options: { bullet: true, breakLine: true } },
    { text: "Welcoming people from every tradition", options: { bullet: true } },
  ], { x: 0.8, y: 3.1, w: 4.5, h: 1.5, fontFace: SANS, fontSize: 12, color: C.tealMid, paraSpaceAfter: 6, margin: 0, bullet: { color: C.red } });

  // ══════════════════════════════════════════════
  // SLIDE 8 — TIMELINE SECTION DIVIDER
  // ══════════════════════════════════════════════
  let s8 = pres.addSlide();
  s8.background = { color: C.tealDeep };
  s8.addText("2025", { x: -0.5, y: -0.3, w: 6, h: 3.5, fontFace: DISPLAY, fontSize: 140, bold: true, color: C.red, margin: 0, transparency: 85 });
  s8.addText("A YEAR OF FREE TO BE FAITHFUL", { x: 0.8, y: 0.6, w: 8, h: 0.35, fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s8.addText([
    { text: "Where we’ve been", options: { bold: true, breakLine: true } },
    { text: "— since May 2025.", options: { italic: true, color: C.creamDark } },
  ], { x: 0.8, y: 1.2, w: 8, h: 1.5, fontFace: DISPLAY, fontSize: 36, color: C.cream, margin: 0, lineSpacingMultiple: 1.0 });
  s8.addText("Courses, events, and community — a full season of faithful engagement.", {
    x: 0.8, y: 3.5, w: 7, h: 0.6, fontFace: SANS, fontSize: 14, italic: true, color: C.muted, margin: 0
  });

  // ══════════════════════════════════════════════
  // SLIDE 9 — TIMELINE 2025
  // ══════════════════════════════════════════════
  let s9 = pres.addSlide();
  s9.background = { color: C.tealDeep };
  s9.addShape(pres.shapes.RECTANGLE, { x: 1.15, y: 0.4, w: 0.025, h: 4.8, fill: { color: C.red } });
  const tl2025 = [
    { date: "MAY 2025", title: "Free to be Faithful Launch", sub: "Grand Rapids", isEvent: true, highlight: true },
    { date: "MAY 2025", title: "Faithful Interpretation & Sexuality", sub: "Keesmaat & Vander Zee", isEvent: false },
    { date: "JUL 2025", title: "Summer Big Read", sub: "Berglund with Du Mez", isEvent: true },
    { date: "SEP 2025", title: "Gender, Sexuality, and the Bible", sub: "Sylvia Keesmaat", isEvent: false },
    { date: "SEP 2025", title: "Twentieth Century Authoritarianism", sub: "Bruce Berglund", isEvent: false },
    { date: "SEP 2025", title: "Fall Big Read", sub: "Reichel & Du Mez", isEvent: true },
    { date: "OCT 2025", title: "Reechanting the World Conference", sub: "", isEvent: true },
    { date: "OCT 2025", title: "The Good, the True, the Beautiful", sub: "Karen Swallow Prior", isEvent: false },
  ];
  tl2025.forEach((item, i) => {
    const yBase = 0.45 + i * 0.58;
    s9.addShape(pres.shapes.OVAL, { x: 1.05, y: yBase + 0.08, w: 0.22, h: 0.22, fill: { color: item.isEvent ? C.cream : C.red } });
    if (item.highlight) s9.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: yBase - 0.02, w: 7.5, h: 0.55, fill: { color: C.red, transparency: 82 } });
    s9.addText(item.date, { x: 1.5, y: yBase - 0.02, w: 2, h: 0.2, fontFace: SANS, fontSize: 7, color: item.highlight ? C.cream : C.red, bold: true, charSpacing: 3, margin: 0 });
    s9.addText(item.title, { x: 1.5, y: yBase + 0.16, w: 4.5, h: 0.28, fontFace: DISPLAY, fontSize: item.highlight ? 13 : 11.5, italic: true, bold: true, color: C.cream, margin: 0 });
    if (item.sub) s9.addText(item.sub, { x: 6.2, y: yBase + 0.16, w: 3, h: 0.28, fontFace: SANS, fontSize: 8, color: C.muted, margin: 0, align: "right" });
  });
  s9.addShape(pres.shapes.OVAL, { x: 0.8, y: 5.2, w: 0.12, h: 0.12, fill: { color: C.red } });
  s9.addText("Course", { x: 1.0, y: 5.15, w: 1, h: 0.22, fontFace: SANS, fontSize: 7, color: C.muted, charSpacing: 3, bold: true, margin: 0 });
  s9.addShape(pres.shapes.OVAL, { x: 2.0, y: 5.2, w: 0.12, h: 0.12, fill: { color: C.cream } });
  s9.addText("Event", { x: 2.2, y: 5.15, w: 1, h: 0.22, fontFace: SANS, fontSize: 7, color: C.muted, charSpacing: 3, bold: true, margin: 0 });

  // ══════════════════════════════════════════════
  // SLIDE 10 — TIMELINE 2026
  // ══════════════════════════════════════════════
  let s10 = pres.addSlide();
  s10.background = { color: C.tealDeep };
  s10.addText("2026", { x: 5, y: -0.3, w: 5.5, h: 3.5, fontFace: DISPLAY, fontSize: 140, bold: true, color: C.red, margin: 0, align: "right", transparency: 85 });
  s10.addShape(pres.shapes.RECTANGLE, { x: 1.15, y: 0.6, w: 0.025, h: 4.0, fill: { color: C.red } });
  s10.addText("— AND WHERE WE’RE GOING.", { x: 0.8, y: 0.15, w: 6, h: 0.3, fontFace: SANS, fontSize: 8, color: C.red, bold: true, charSpacing: 3, margin: 0 });
  const tl2026 = [
    { date: "JAN 2026", title: "Reading the Ruins", sub: "Angela Reitsma Bick", isEvent: false },
    { date: "MAR 2026", title: "The Christian-Jewish Question Today", sub: "Matthew D. Taylor", isEvent: false },
    { date: "MAR 2026", title: "The Evangelical Imagination", sub: "Karen Swallow Prior", isEvent: false },
    { date: "MAY 2026", title: "Courageous Faith in a Time of Fear", sub: "Toronto · Public Conference", isEvent: true, highlight: true },
    { date: "JUN 16, 2026", title: "The Contemplative Life in the Age of Distraction", sub: "Jacob Benjamins", isEvent: false },
  ];
  tl2026.forEach((item, i) => {
    const yBase = 0.7 + i * 0.8;
    s10.addShape(pres.shapes.OVAL, { x: 1.05, y: yBase + 0.1, w: 0.22, h: 0.22, fill: { color: item.isEvent ? C.cream : C.red } });
    if (item.highlight) s10.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: yBase - 0.02, w: 7.5, h: 0.7, fill: { color: C.red, transparency: 82 } });
    s10.addText(item.date, { x: 1.5, y: yBase, w: 2, h: 0.2, fontFace: SANS, fontSize: 7, color: item.highlight ? C.cream : C.red, bold: true, charSpacing: 3, margin: 0 });
    s10.addText(item.title, { x: 1.5, y: yBase + 0.22, w: 5, h: 0.35, fontFace: DISPLAY, fontSize: item.highlight ? 15 : 12, italic: true, bold: true, color: C.cream, margin: 0 });
    if (item.sub) s10.addText(item.sub, { x: 6.5, y: yBase + 0.22, w: 2.8, h: 0.35, fontFace: SANS, fontSize: 9, color: C.muted, margin: 0, align: "right" });
  });
  s10.addShape(pres.shapes.OVAL, { x: 0.8, y: 5.2, w: 0.12, h: 0.12, fill: { color: C.red } });
  s10.addText("Course", { x: 1.0, y: 5.15, w: 1, h: 0.22, fontFace: SANS, fontSize: 7, color: C.muted, charSpacing: 3, bold: true, margin: 0 });
  s10.addShape(pres.shapes.OVAL, { x: 2.0, y: 5.2, w: 0.12, h: 0.12, fill: { color: C.cream } });
  s10.addText("Event", { x: 2.2, y: 5.15, w: 1, h: 0.22, fontFace: SANS, fontSize: 7, color: C.muted, charSpacing: 3, bold: true, margin: 0 });

  // ══════════════════════════════════════════════
  // SLIDE 11 — VOICES OF THE YEAR (1 of 2)
  // ══════════════════════════════════════════════
  let s11 = pres.addSlide();
  s11.background = { color: C.cream };
  s11.addText("VOICES OF THE YEAR", { x: 0.8, y: 0.45, w: 6, h: 0.3, fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s11.addText([
    { text: "The people shaping", options: { breakLine: true } },
    { text: "the ", options: {} },
    { text: "conversation.", options: { italic: true, color: C.tealMid } },
  ], { x: 0.8, y: 0.75, w: 8, h: 0.85, fontFace: DISPLAY, fontSize: 26, bold: true, color: C.tealDeep, margin: 0 });

  const speakers1 = [
    { name: "Sylvia Keesmaat", role: "Scholar · Activist", img: IMG.keesmaat },
    { name: "Bruce Berglund", role: "Author · Historian", img: IMG.berglund },
    { name: "Karen Swallow Prior", role: "Author · Bethel Seminary", img: IMG.prior },
    { name: "Hanna Reichel", role: "Theologian · Princeton", img: IMG.reichel },
    { name: "Kristin Kobes Du Mez", role: "Historian · Calvin Univ.", img: IMG.duMez },
    { name: "Angela Reitsma Bick", role: "Editor · Christian Courier", img: IMG.reitsma },
  ];
  speakers1.forEach((sp, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const xBase = 0.8 + col * 3.0, yBase = 1.9 + row * 1.7;
    s11.addImage({ path: sp.img, x: xBase, y: yBase, w: 0.85, h: 0.85, rounding: true, sizing: { type: "cover", w: 0.85, h: 0.85 } });
    s11.addShape(pres.shapes.OVAL, { x: xBase - 0.03, y: yBase - 0.03, w: 0.91, h: 0.91, line: { color: C.red, width: 1.5 } });
    s11.addText(sp.name, { x: xBase + 1.0, y: yBase + 0.05, w: 1.9, h: 0.4, fontFace: DISPLAY, fontSize: 12, bold: true, color: C.tealDeep, margin: 0 });
    s11.addText(sp.role, { x: xBase + 1.0, y: yBase + 0.45, w: 1.9, h: 0.3, fontFace: SANS, fontSize: 8, color: C.muted, bold: true, charSpacing: 2, margin: 0 });
  });

  // ══════════════════════════════════════════════
  // SLIDE 12 — VOICES OF THE YEAR (2 of 2)
  // ══════════════════════════════════════════════
  let s12 = pres.addSlide();
  s12.background = { color: C.cream };
  s12.addText("VOICES OF THE YEAR", { x: 0.8, y: 0.45, w: 6, h: 0.3, fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s12.addText("Scholars, writers, and pastoral voices guiding our courses and gatherings.", {
    x: 0.8, y: 0.8, w: 7, h: 0.5, fontFace: DISPLAY, fontSize: 13, italic: true, color: C.muted, margin: 0
  });

  const speakers2 = [
    { name: "Matthew D. Taylor", role: "Scholar & Author", img: IMG.taylor },
    { name: "Jacob Benjamins", role: "Postdoctoral Fellow · ICS", img: IMG.benjamins },
    { name: "Ron Kuipers", role: "President · ICS", img: IMG.kuipers },
    { name: "Joash P. Thomas", role: "Public Theologian", img: IMG.thomas },
    { name: "Gideon Strauss", role: "Philosopher · ICS", img: IMG.strauss },
    { name: "Brian Walsh", role: "Theologian & Author", img: IMG.walsh },
  ];
  speakers2.forEach((sp, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const xBase = 0.8 + col * 3.0, yBase = 1.6 + row * 1.7;
    s12.addImage({ path: sp.img, x: xBase, y: yBase, w: 0.85, h: 0.85, rounding: true, sizing: { type: "cover", w: 0.85, h: 0.85 } });
    s12.addShape(pres.shapes.OVAL, { x: xBase - 0.03, y: yBase - 0.03, w: 0.91, h: 0.91, line: { color: C.red, width: 1.5 } });
    s12.addText(sp.name, { x: xBase + 1.0, y: yBase + 0.05, w: 1.9, h: 0.4, fontFace: DISPLAY, fontSize: 12, bold: true, color: C.tealDeep, margin: 0 });
    s12.addText(sp.role, { x: xBase + 1.0, y: yBase + 0.45, w: 1.9, h: 0.3, fontFace: SANS, fontSize: 8, color: C.muted, bold: true, charSpacing: 2, margin: 0 });
  });

  // ══════════════════════════════════════════════
  // SLIDE 13 — CTA
  // ══════════════════════════════════════════════
  let s13 = pres.addSlide();
  s13.background = { color: C.cream };
  s13.addText("JOIN THE MOVEMENT", { x: 0.8, y: 0.5, w: 6, h: 0.3, fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s13.addText([
    { text: "Embrace Your ", options: {} },
    { text: "Freedom", options: { italic: true, color: C.tealMid } },
    { text: "", options: { breakLine: true } },
    { text: "to Be Faithful.", options: {} },
  ], { x: 0.8, y: 0.9, w: 8, h: 1.2, fontFace: DISPLAY, fontSize: 34, bold: true, color: C.tealDeep, margin: 0 });
  s13.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.15, w: 0.5, h: 0.035, fill: { color: C.red } });
  s13.addText("Join a growing community of Christians who believe that ancient faith can actively engage the pressing issues of our time.", {
    x: 0.8, y: 2.4, w: 8, h: 0.6, fontFace: SANS, fontSize: 13, color: C.body, lineSpacingMultiple: 1.5, margin: 0
  });
  [
    { num: "01", title: "Explore the courses.", url: "f2bf.icscanada.edu/f2bf-courses" },
    { num: "02", title: "Subscribe on Substack.", url: "instituteforchristianstudies.substack.com" },
    { num: "03", title: "Support the work.", url: "icscanada.edu/donate" },
  ].forEach((step, i) => {
    const xBase = 0.8 + i * 3.0, yBase = 3.3;
    s13.addShape(pres.shapes.RECTANGLE, { x: xBase, y: yBase, w: 2.7, h: 1.6, fill: { color: C.white }, shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
    s13.addText(step.num, { x: xBase + 0.2, y: yBase + 0.15, w: 0.6, h: 0.5, fontFace: DISPLAY, fontSize: 22, bold: true, color: C.red, margin: 0 });
    s13.addText(step.title, { x: xBase + 0.2, y: yBase + 0.65, w: 2.3, h: 0.4, fontFace: DISPLAY, fontSize: 13, bold: true, color: C.tealDeep, margin: 0 });
    s13.addText(step.url, { x: xBase + 0.2, y: yBase + 1.05, w: 2.3, h: 0.35, fontFace: SANS, fontSize: 8, color: C.muted, margin: 0 });
  });

  // ══════════════════════════════════════════════
  // SLIDE 14 — QR CODE
  // ══════════════════════════════════════════════
  let s14 = pres.addSlide();
  s14.background = { color: C.tealDeep };
  s14.addImage({ path: IMG.conferencePhoto, x: 0, y: 0, w: SW, h: SH, sizing: { type: "cover", w: SW, h: SH }, transparency: 75 });
  s14.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.tealDeep, transparency: 30 } });
  s14.addShape(pres.shapes.RECTANGLE, { x: 2.2, y: 0.8, w: 5.6, h: 4.0, fill: { color: C.teal }, shadow: { type: "outer", blur: 20, offset: 4, angle: 135, color: "000000", opacity: 0.3 } });
  s14.addText("START HERE", { x: 2.6, y: 1.1, w: 3, h: 0.3, fontFace: SANS, fontSize: 9, color: C.red, bold: true, charSpacing: 4, margin: 0 });
  s14.addText("Scan to visit\nFree to be Faithful", { x: 2.6, y: 1.5, w: 3, h: 1.0, fontFace: DISPLAY, fontSize: 24, bold: true, color: C.cream, margin: 0, lineSpacingMultiple: 1.1 });
  s14.addText("Find the next course, resource, or gathering for you.", { x: 2.6, y: 2.6, w: 3, h: 0.5, fontFace: SANS, fontSize: 12, color: C.muted, lineSpacingMultiple: 1.4, margin: 0 });
  s14.addText("f2bf.icscanada.edu", { x: 2.6, y: 3.3, w: 3, h: 0.4, fontFace: DISPLAY, fontSize: 14, bold: true, color: C.cream, margin: 0 });
  s14.addShape(pres.shapes.RECTANGLE, { x: 5.9, y: 1.4, w: 1.6, h: 1.6, fill: { color: C.white } });
  s14.addImage({ path: IMG.qrCode, x: 5.98, y: 1.48, w: 1.44, h: 1.44 });

  // ══════════════════════════════════════════════
  // SLIDE 15 — CLOSING
  // ══════════════════════════════════════════════
  let s15 = pres.addSlide();
  s15.background = { color: C.tealDeep };
  s15.addText("FOR FREEDOM CHRIST HAS SET US FREE.", { x: 1, y: 0.5, w: 8, h: 0.3, fontFace: SANS, fontSize: 8, color: C.red, bold: true, charSpacing: 5, align: "center", margin: 0 });
  s15.addText([
    { text: "Free", options: { fontSize: 44, bold: true, color: C.cream, breakLine: true } },
    { text: "to be", options: { fontSize: 44, italic: true, color: C.creamDark, breakLine: true } },
    { text: "Faithful", options: { fontSize: 44, bold: true, color: C.cream } },
  ], { x: 1, y: 0.9, w: 8, h: 2.3, fontFace: DISPLAY, align: "center", lineSpacingMultiple: 0.85, margin: 0 });
  s15.addShape(pres.shapes.RECTANGLE, { x: 4.5, y: 3.1, w: 1, h: 0.035, fill: { color: C.red } });
  s15.addText("Rooted without becoming rigid. Bold without becoming belligerent.\nFaithful without becoming fearful.", {
    x: 1.5, y: 3.3, w: 7, h: 0.65, fontFace: DISPLAY, fontSize: 12, italic: true, color: C.muted, align: "center", lineSpacingMultiple: 1.4, margin: 0
  });
  s15.addText("f2bf.icscanada.edu", { x: 1, y: 4.05, w: 8, h: 0.35, fontFace: DISPLAY, fontSize: 16, bold: true, color: C.cream, align: "center", margin: 0 });
  s15.addText("59 St. George Street, Toronto, Ontario M5S 2E6  ·  1-888-326-5347  ·  info@icscanada.edu", {
    x: 1, y: 4.5, w: 8, h: 0.3, fontFace: SANS, fontSize: 8, color: C.muted, align: "center", margin: 0
  });
  s15.addImage({ path: IMG.icsLogo, x: 4.0, y: 4.85, w: 2.0, h: 0.55, sizing: { type: "contain", w: 2.0, h: 0.55 } });

  // ══════════════════════════════════════════════
  // WRITE FILE
  // ══════════════════════════════════════════════
  const outputPath = process.argv[2] || "F2BF-Presentation.pptx";
  await pres.writeFile({ fileName: outputPath });
  console.log("Created: " + outputPath);

  // ══════════════════════════════════════════════
  // POST-PROCESS: Fix image cropping
  // pptxgenjs v4 never reads actual image dimensions,
  // so sizing: { type: "cover" } always produces
  // srcRect 0/0/0/0 (no crop). We patch the XML
  // with properly calculated cover-crop values.
  // ══════════════════════════════════════════════
  console.log("\nPost-processing: fixing image crops...");
  const zip = new AdmZip(outputPath);

  for (let slideNum = 1; slideNum <= 15; slideNum++) {
    const slideEntry = zip.getEntry(`ppt/slides/slide${slideNum}.xml`);
    if (!slideEntry) continue;
    let xml = slideEntry.getData().toString("utf8");
    if (!xml.includes('srcRect l="0" r="0" t="0" b="0"')) continue;

    const relsEntry = zip.getEntry(`ppt/slides/_rels/slide${slideNum}.xml.rels`);
    if (!relsEntry) continue;
    const relsXml = relsEntry.getData().toString("utf8");

    const relMap = {};
    const relRe = /Relationship Id="(rId\d+)"[^>]*Target="([^"]+)"/g;
    let rm;
    while ((rm = relRe.exec(relsXml)) !== null) {
      if (rm[2].includes("media/")) {
        relMap[rm[1]] = "ppt/" + rm[2].replace("../", "");
      }
    }

    const picRe = /<p:pic>[\s\S]*?<\/p:pic>/g;
    let picMatch;
    while ((picMatch = picRe.exec(xml)) !== null) {
      const picXml = picMatch[0];
      if (!picXml.includes('srcRect l="0" r="0" t="0" b="0"')) continue;

      const rIdM = picXml.match(/r:embed="(rId\d+)"/);
      if (!rIdM) continue;
      const imgFile = relMap[rIdM[1]];
      if (!imgFile) continue;

      const imgEntry = zip.getEntry(imgFile);
      if (!imgEntry) continue;
      const dims = imageSize(imgEntry.getData());

      const extM = picXml.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
      if (!extM) continue;
      const boxW = parseInt(extM[1]);
      const boxH = parseInt(extM[2]);

      const imgRatio = dims.height / dims.width;
      const boxRatio = boxH / boxW;
      const isBoxBased = boxRatio > imgRatio;
      const w = isBoxBased ? boxH / imgRatio : boxW;
      const h = isBoxBased ? boxH : boxW * imgRatio;
      const hzPerc = Math.round(1e5 * 0.5 * (1 - boxW / w));
      const vzPerc = Math.round(1e5 * 0.5 * (1 - boxH / h));

      if (hzPerc === 0 && vzPerc === 0) continue;

      const newPicXml = picXml.replace(
        'srcRect l="0" r="0" t="0" b="0"',
        `srcRect l="${hzPerc}" r="${hzPerc}" t="${vzPerc}" b="${vzPerc}"`
      );
      xml = xml.replace(picXml, newPicXml);
      console.log(`  Slide ${slideNum}: cropped ${imgFile.split("/").pop()} (${dims.width}x${dims.height}) → srcRect ${hzPerc}/${vzPerc}`);
    }

    slideEntry.setData(Buffer.from(xml, "utf8"));
  }

  zip.writeZip(outputPath);
  console.log("Post-processing complete.\n");
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
