import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const pageUrl = "https://www.mortalkombat.com/en-us/roster";
const publicDirectory = join(process.cwd(), "public");
const manifestPath = join(process.cwd(), "src", "data", "roster.json");

const response = await fetch(pageUrl);

if (!response.ok) {
  throw new Error(`Roster request failed with ${response.status}`);
}

const html = await response.text();
const rosterMatch = html.match(/data-roster='([^']+)'/);

if (!rosterMatch) {
  throw new Error("Main roster data was not found");
}

const mainRoster = JSON.parse(rosterMatch[1]);
const kameoMatches = [
  ...html.matchAll(
    /<img src="(https:\/\/cdn-mk1\.mortalkombat\.com\/roster\/kameos\/([^"/]+)\.webp)" alt="([^"]+)"/g,
  ),
];

const fighters = mainRoster.map(({ id, name, thumb, categories }) => ({
  id: `fighter-${id}`,
  slug: id,
  name,
  group: "fighter",
  image: `/fighters/main/${id}.webp`,
  source: thumb,
  categories,
}));

const kameos = kameoMatches.map(([, source, slug, name]) => ({
  id: `kameo-${slug}`,
  slug,
  name,
  group: "kameo",
  image: `/fighters/kameos/${slug}.webp`,
  source,
  categories: ["kameo"],
}));

const assets = [
  ...fighters.map((fighter) => ({
    source: fighter.source,
    destination: join(publicDirectory, "fighters", "main", basename(fighter.image)),
  })),
  ...kameos.map((fighter) => ({
    source: fighter.source,
    destination: join(publicDirectory, "fighters", "kameos", basename(fighter.image)),
  })),
];

await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify([...fighters, ...kameos], null, 2)}\n`);

let cursor = 0;

async function downloadNext() {
  while (cursor < assets.length) {
    const asset = assets[cursor++];
    const assetResponse = await fetch(asset.source);

    if (!assetResponse.ok) {
      throw new Error(`${asset.source} failed with ${assetResponse.status}`);
    }

    await mkdir(dirname(asset.destination), { recursive: true });
    await writeFile(asset.destination, Buffer.from(await assetResponse.arrayBuffer()));
    process.stdout.write(`Downloaded ${asset.destination}\n`);
  }
}

await Promise.all(Array.from({ length: 6 }, downloadNext));
process.stdout.write(`Synced ${fighters.length} fighters and ${kameos.length} kameos\n`);
