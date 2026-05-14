# pptxgenjs Image Cropping Guide

## The Problem

pptxgenjs v4 has a broken `sizing` feature. When you write:

```js
slide.addImage({
  path: "photo.jpg",
  x: 0, y: 0, w: 10, h: 5.625,
  sizing: { type: "cover", w: 10, h: 5.625 }
});
```

...it **silently does nothing**. The image gets stretched to fill the box instead of being center-cropped. This affects `cover`, `contain`, and `crop` sizing types equally.

### Root Cause

In `pptxgen.cjs.js`, the XML generator sets `imgWidth` and `imgHeight` to the **target box dimensions** (lines ~5148–5149), not the actual source image dimensions. The image-dimension-reading function (`getSizeFromImage`) is commented out with `// FIXME: TODO: currently unused`. So the cover-crop formula always receives identical image and box ratios, producing `srcRect l="0" r="0" t="0" b="0"` — zero crop.

This is true for **both URL-based and local-file-based images**. Downloading images locally does not fix it.

---

## The Solution: Post-Process the PPTX XML

Generate the PPTX normally, then open it as a ZIP, read actual image dimensions, calculate crop values, and patch the slide XML.

### Required Packages

```
npm install -g pptxgenjs adm-zip image-size
```

Set `NODE_PATH` so globally installed packages are found:

```powershell
$env:NODE_PATH = "C:\Users\fresh\AppData\Roaming\npm\node_modules"
```

### Script Structure

```js
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { imageSize } = require("image-size");
// Note: image-size exports { imageSize }, not a default function.

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10" × 5.625"

  // ... build all slides with addImage() ...
  // Keep sizing: { type: "cover" } in your addImage calls.
  // It won't work, but it tells pptxgenjs to write a srcRect
  // element (with zeros) that we can patch later.

  const outputPath = "output.pptx";
  await pres.writeFile({ fileName: outputPath });

  // === POST-PROCESS ===
  fixImageCropping(outputPath);
}

function fixImageCropping(pptxPath) {
  const zip = new AdmZip(pptxPath);
  const slideEntries = zip.getEntries().filter(e =>
    /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName)
  );

  for (const slideEntry of slideEntries) {
    let xml = slideEntry.getData().toString("utf8");
    if (!xml.includes('srcRect l="0" r="0" t="0" b="0"')) continue;

    // Build rId → image file map from the .rels file
    const slideNum = slideEntry.entryName.match(/slide(\d+)/)[1];
    const relsEntry = zip.getEntry(
      `ppt/slides/_rels/slide${slideNum}.xml.rels`
    );
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

    // Find each <p:pic> element with zero-crop srcRect
    const picRe = /<p:pic>[\s\S]*?<\/p:pic>/g;
    let picMatch;
    while ((picMatch = picRe.exec(xml)) !== null) {
      const picXml = picMatch[0];
      if (!picXml.includes('srcRect l="0" r="0" t="0" b="0"')) continue;

      // Get the image's relationship ID
      const rIdM = picXml.match(/r:embed="(rId\d+)"/);
      if (!rIdM) continue;
      const imgFile = relMap[rIdM[1]];
      if (!imgFile) continue;

      // Read actual image dimensions from the embedded file
      const imgEntry = zip.getEntry(imgFile);
      if (!imgEntry) continue;
      const dims = imageSize(imgEntry.getData());

      // Read target box dimensions from <a:ext cx="..." cy="..."/>
      // These are in EMUs (914400 EMU = 1 inch)
      const extM = picXml.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
      if (!extM) continue;
      const boxW = parseInt(extM[1]);
      const boxH = parseInt(extM[2]);

      // Calculate cover-crop percentages (in 1/1000ths of a percent)
      const imgRatio = dims.height / dims.width;
      const boxRatio = boxH / boxW;
      const isBoxBased = boxRatio > imgRatio;
      const w = isBoxBased ? boxH / imgRatio : boxW;
      const h = isBoxBased ? boxH : boxW * imgRatio;
      const hzPerc = Math.round(1e5 * 0.5 * (1 - boxW / w));
      const vzPerc = Math.round(1e5 * 0.5 * (1 - boxH / h));

      if (hzPerc === 0 && vzPerc === 0) continue; // already correct ratio

      // Patch the XML
      const newPicXml = picXml.replace(
        'srcRect l="0" r="0" t="0" b="0"',
        `srcRect l="${hzPerc}" r="${hzPerc}" t="${vzPerc}" b="${vzPerc}"`
      );
      xml = xml.replace(picXml, newPicXml);
    }

    slideEntry.setData(Buffer.from(xml, "utf8"));
  }

  zip.writeZip(pptxPath);
}

main().catch(console.error);
```

---

## How the Crop Math Works

PPTX uses `<a:srcRect>` to define what portion of the source image to **discard** from each edge, expressed in units of 1/100,000 (i.e., 50000 = 50%).

For **cover** behavior (fill the box, crop excess, center the image):

1. Compare the image aspect ratio to the box aspect ratio.
2. If the image is wider than the box (relative to height), crop left and right equally.
3. If the image is taller than the box (relative to width), crop top and bottom equally.
4. The formula calculates what percentage of the image extends beyond the box on each side.

Example: A 2000×1000 image placed in a 500×500 box (square).
- Image is wider → crop left/right.
- Scaled to fill height: the image would be 1000×500, so 500px excess width.
- Each side loses 250/1000 = 25% → srcRect `l="25000" r="25000" t="0" b="0"`.

---

## Key Details

### Images must be local files (not URLs) for addImage

pptxgenjs can embed URL-based images, but the post-processor reads dimensions from the embedded file inside the PPTX ZIP. This works regardless of original source. However, downloading images locally before generation is recommended because:

- It avoids network failures during generation.
- It lets you verify images exist before building slides.
- The cached files can be reused across runs.

### Download helper with redirect support

Many image hosts (Lightroom, Squarespace, etc.) use redirects. Use a download function that follows them:

```js
const https = require("https");
const http = require("http");
const fs = require("fs");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const doRequest = (reqUrl, redirects) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      mod.get(reqUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on("finish", () => ws.close(resolve));
        ws.on("error", reject);
      }).on("error", reject);
    };
    doRequest(url, 0);
  });
}
```

### Images that should NOT be cover-cropped

The post-processor only patches images that have `srcRect l="0" r="0" t="0" b="0"` — which pptxgenjs writes when you use `sizing: { type: "cover" }`. Images added **without** a `sizing` option get `<a:stretch><a:fillRect/></a:stretch>` instead (no srcRect element), so they are left untouched.

- **QR codes, logos, icons**: Do NOT use `sizing`. Just set `x, y, w, h` directly.
- **Logos that need contain**: Use `sizing: { type: "contain" }` — the post-processor only targets `srcRect l="0"` patterns, so contain's zero values will also be patched. If you want true contain behavior, omit sizing and manually calculate the w/h to preserve aspect ratio.
- **Photos filling an area**: Use `sizing: { type: "cover", w: targetW, h: targetH }` — the post-processor will fix the crop values.

### Windows-specific notes

- Use `npm.cmd` instead of `npm` if PowerShell blocks script execution.
- Set `$env:NODE_PATH` before running Node.js so globally installed packages are resolved.
- Node.js path: typically `C:\Program Files\nodejs\node.exe`.

---

## Checklist for Future PPTX Projects

1. **Install packages**: `npm install -g pptxgenjs adm-zip image-size`
2. **Download images locally** to an `_img_cache/` directory before generating.
3. **Build slides** using `addImage({ path: localPath, sizing: { type: "cover", w, h } })` for photos.
4. **Do NOT use sizing** for QR codes, logos, or icons — just set exact `x, y, w, h`.
5. **Call `pres.writeFile()`** to generate the initial PPTX.
6. **Run `fixImageCropping(outputPath)`** to patch srcRect values.
7. **Verify** by opening in PowerPoint — images should be center-cropped, not stretched.
