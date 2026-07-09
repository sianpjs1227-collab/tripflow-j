import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");
const coversDir = join(projectRoot, "public", "covers");
const assetsDir = join(
  "C:",
  "Users",
  "admin",
  ".cursor",
  "projects",
  "c-Users-admin-Desktop-tripflow",
  "assets",
);

const sources = [1, 2, 3, 4, 5].map((n) =>
  join(assetsDir, `hero-cover-${String(n).padStart(2, "0")}.png`),
);

for (let i = 1; i <= 20; i += 1) {
  const num = String(i).padStart(2, "0");
  const source = sources[(i - 1) % sources.length];
  const target = join(coversDir, `hero${num}.jpg`);

  if (!existsSync(source)) {
    throw new Error(`Missing source image: ${source}`);
  }

  copyFileSync(source, target);
  console.log(`hero${num}.jpg <- ${source}`);
}
