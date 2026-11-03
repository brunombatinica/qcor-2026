// Write a colour scheme and fonts into a .pptx's theme (ppt/theme/theme*.xml), so colours and fonts picked from
// PowerPoint's theme menus match the deck. pptxgenjs has no option for this, so the deck is opened after writing.
//   await applyTheme("deck.pptx", { name, headFontFace, bodyFontFace, colors: { dk1, lt1, ..., folHlink } })
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const JSZip = createRequire(import.meta.url)("jszip");
const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export async function applyTheme(file, { name, headFontFace, bodyFontFace, colors }) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  const parts = Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  if (!parts.length) throw new Error(`${file}: no theme part`);
  const scheme = `<a:clrScheme name="${esc(name)}">` +
    SLOTS.map((k) => {
      if (!/^[0-9A-Fa-f]{6}$/.test(colors[k] || "")) throw new Error(`theme colour ${k}: want RRGGBB, got ${colors[k]}`);
      return `<a:${k}><a:srgbClr val="${colors[k].toUpperCase()}"/></a:${k}>`;
    }).join("") + `</a:clrScheme>`;
  const font = (xml, tag, face) => face ? xml.replace(new RegExp(`(<a:${tag}>\\s*<a:latin typeface=")[^"]*"`), `$1${esc(face)}"`) : xml;
  for (const part of parts) {
    let xml = await zip.file(part).async("string");
    xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, scheme)
      .replace(/(<a:theme\b[^>]*\bname=")[^"]*"/, `$1${esc(name)}"`);
    xml = font(font(xml, "majorFont", headFontFace), "minorFont", bodyFontFace);
    zip.file(part, xml);
  }
  writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}
