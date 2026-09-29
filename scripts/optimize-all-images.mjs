import { mkdir, readdir, copyFile, unlink } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const weddingDir = join(projectDirectory, "public", "images", "wedding");
const groomDir = join(projectDirectory, "public", "images", "portraits", "groom");
const brideDir = join(projectDirectory, "public", "images", "portraits", "bride");
const rawBackupDir = join(projectDirectory, "public", "images", "wedding-raw-backup");

await mkdir(rawBackupDir, { recursive: true });

async function processDirectory(dir, maxWidth = 1800, quality = 82) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".jpg") {
      const srcPath = join(dir, entry.name);
      const backupPath = join(rawBackupDir, entry.name);
      const destPath = join(dir, entry.name.replace(/\.jpg$/i, ".webp"));

      console.log(`Optimizing ${entry.name}...`);
      // Backup original raw photo
      await copyFile(srcPath, backupPath);

      // Convert to high quality WebP
      await sharp(srcPath)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality })
        .toFile(destPath);

      // Remove the heavy original from the public web folder (it is safe in rawBackupDir)
      await unlink(srcPath);
    }
  }
}

console.log("Optimizing wedding photos...");
await processDirectory(weddingDir, 1800, 82);

console.log("Optimizing groom portrait...");
await processDirectory(groomDir, 1200, 84);

console.log("Optimizing bride portrait...");
await processDirectory(brideDir, 1200, 84);

console.log("Done optimizing all images!");
