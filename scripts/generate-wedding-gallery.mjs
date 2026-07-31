import { readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const photoDirectory = join(projectDirectory, "public", "images", "wedding");
const portraitDirectory = join(projectDirectory, "public", "images", "portraits");
const logoDirectory = join(projectDirectory, "public", "images", "logo");
const musicDirectory = join(projectDirectory, "public", "music");
const outputFile = join(projectDirectory, "app", "generated-wedding-gallery.ts");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const supportedAudioExtensions = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac"]);

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, extensions)));
    } else if (extensions.has(extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

let files = [];
try {
  files = await collectFiles(photoDirectory, supportedExtensions);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const photos = files
  .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))
  .map((absolutePath, index) => {
    const publicPath = `/${relative(join(projectDirectory, "public"), absolutePath).split("\\").join("/")}`;
    const filename = absolutePath.split(/[\\\\/]/).at(-1) ?? `Ảnh ${index + 1}`;
    const alt = filename
      .replace(/\.[^.]+$/, "")
      .replace(/^\d+[\s._-]*/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    return { src: publicPath, alt: alt || `Ảnh cưới Duy và Lan ${index + 1}` };
  });

async function firstPortrait(role) {
  try {
    const portraits = await collectFiles(join(portraitDirectory, role), supportedExtensions);
    const absolutePath = portraits.sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))[0];
    if (!absolutePath) return null;
    return `/${relative(join(projectDirectory, "public"), absolutePath).split("\\").join("/")}`;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const portraits = {
  groom: (await firstPortrait("groom")) ?? "/images/wedding/ROZ02433.JPG",
  bride: (await firstPortrait("bride")) ?? "/images/wedding/ROZ01868.JPG",
};

let logoImage = null;
try {
  const logos = await collectFiles(logoDirectory, supportedExtensions);
  const logoPath = logos.find((path) => path.split(/[\\/]/).at(-1)?.toLowerCase() === "logo.webp")
    ?? logos.sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))[0];
  if (logoPath) {
    logoImage = `/${relative(join(projectDirectory, "public"), logoPath).split("\\").join("/")}`;
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

let backgroundMusic = null;
let backgroundMusicTitle = null;
try {
  const tracks = await collectFiles(musicDirectory, supportedAudioExtensions);
  const trackPath = tracks.sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))[0];
  if (trackPath) {
    backgroundMusic = `/${relative(join(projectDirectory, "public"), trackPath).split("\\").join("/")}`;
    const rawTitle = trackPath
      .split(/[\\/]/)
      .at(-1)
      ?.replace(/\.[^.]+$/, "")
      .replace(/[_]+/g, " ")
      .trim();
    backgroundMusicTitle = rawTitle
      ?.split(/\s+-\s+/)
      .filter((part) => !/^(lyrics?|official|video|audio|mv)(\s+video)?$/i.test(part.trim()))
      .join(" · ") || "Nhạc nền đám cưới";
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const source = `// This file is generated automatically from the image and music folders in public.\nexport const weddingPhotos = ${JSON.stringify(photos, null, 2)} as const;\n\nexport const couplePortraits = ${JSON.stringify(portraits, null, 2)} as const;\n\nexport const logoImage = ${JSON.stringify(logoImage)} as const;\n\nexport const backgroundMusic = ${JSON.stringify(backgroundMusic)} as const;\nexport const backgroundMusicTitle = ${JSON.stringify(backgroundMusicTitle)} as const;\n`;
await writeFile(outputFile, source, "utf8");
console.log(`Discovered ${photos.length} wedding photos${backgroundMusic ? " and 1 background music track" : ""}.`);
