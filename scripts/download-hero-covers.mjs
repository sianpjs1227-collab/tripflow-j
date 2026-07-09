import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "covers");

for (let i = 1; i <= 20; i += 1) {
  const num = String(i).padStart(2, "0");
  const url = `https://picsum.photos/seed/tripflow-hero-${num}/800/1000.jpg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download hero${num}.jpg: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(join(dir, `hero${num}.jpg`), buffer);
  console.log(`hero${num}.jpg`, buffer.length);
}
