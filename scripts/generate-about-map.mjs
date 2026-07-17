import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const globeEntry = require.resolve("globe.gl");

function findPackageRoot(path) {
  let current = dirname(path);
  while (current !== dirname(current)) {
    if (current.endsWith(`${join("node_modules", "globe.gl")}`)) return current;
    current = dirname(current);
  }
  throw new Error("Could not locate the installed globe.gl package.");
}

const sourcePath = join(
  findPackageRoot(globeEntry),
  "example",
  "datasets",
  "ne_110m_admin_0_countries.geojson",
);
const outputPath = join(projectRoot, "src", "data", "about-world-map.ts");
const scale = 100;

const geojson = JSON.parse(await readFile(sourcePath, "utf8"));

function outerRings(feature) {
  const { geometry } = feature;
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon[0]);
  }
  return [];
}

function quantizeRing(ring) {
  const points = [];
  for (const [lng, lat] of ring) {
    const point = [Math.round(lng * scale), Math.round(lat * scale)];
    const previous = points.at(-1);
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      points.push(point);
    }
  }
  if (
    points.length > 1 &&
    points[0][0] === points.at(-1)[0] &&
    points[0][1] === points.at(-1)[1]
  ) {
    points.pop();
  }
  return points;
}

const pointKey = ([lng, lat]) => `${lng},${lat}`;
const edgeKey = (start, end) => {
  const a = pointKey(start);
  const b = pointKey(end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

function makeCoastlineChains(features) {
  const edgeCounts = new Map();
  const edgesByKey = new Map();

  for (const feature of features) {
    for (const rawRing of outerRings(feature)) {
      const ring = quantizeRing(rawRing);
      for (let index = 0; index < ring.length; index += 1) {
        const start = ring[index];
        const end = ring[(index + 1) % ring.length];
        if (Math.abs(start[0] - end[0]) > 180 * scale) continue;
        const key = edgeKey(start, end);
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
        edgesByKey.set(key, [start, end]);
      }
    }
  }

  const coastEdges = [...edgesByKey.entries()]
    .filter(([key]) => edgeCounts.get(key) === 1)
    .map(([, edge]) => edge);
  const adjacency = new Map();

  coastEdges.forEach(([start, end], edgeIndex) => {
    for (const point of [start, end]) {
      const key = pointKey(point);
      const list = adjacency.get(key) ?? [];
      list.push(edgeIndex);
      adjacency.set(key, list);
    }
  });

  const visited = new Set();
  const chains = [];

  function walk(firstEdgeIndex, startKey) {
    const chain = [];
    let edgeIndex = firstEdgeIndex;
    let currentKey = startKey;

    while (!visited.has(edgeIndex)) {
      visited.add(edgeIndex);
      const [start, end] = coastEdges[edgeIndex];
      const startEdgeKey = pointKey(start);
      const nextPoint = startEdgeKey === currentKey ? end : start;
      if (chain.length === 0) {
        chain.push(startEdgeKey === currentKey ? start : end);
      }
      chain.push(nextPoint);
      currentKey = pointKey(nextPoint);
      const nextEdges = (adjacency.get(currentKey) ?? []).filter(
        (candidate) => !visited.has(candidate),
      );
      if (nextEdges.length === 0) break;
      edgeIndex = nextEdges[0];
    }

    return chain;
  }

  for (const [key, edgeIndexes] of adjacency) {
    if (edgeIndexes.length === 2) continue;
    for (const edgeIndex of edgeIndexes) {
      if (!visited.has(edgeIndex)) chains.push(walk(edgeIndex, key));
    }
  }

  coastEdges.forEach((edge, edgeIndex) => {
    if (!visited.has(edgeIndex)) {
      chains.push(walk(edgeIndex, pointKey(edge[0])));
    }
  });

  return chains.filter((chain) => chain.length > 1);
}

function countryRings(code) {
  return geojson.features
    .filter((feature) => feature.properties?.ADM0_A3 === code)
    .flatMap(outerRings)
    .map(quantizeRing)
    .filter((ring) => ring.length > 2);
}

function encodeChain(points, forceClosed = false) {
  const isClosed =
    forceClosed ||
    (points.length > 2 &&
      points[0][0] === points.at(-1)[0] &&
      points[0][1] === points.at(-1)[1]);
  const source = isClosed &&
      points[0][0] === points.at(-1)[0] &&
      points[0][1] === points.at(-1)[1]
    ? points.slice(0, -1)
    : points;
  const encoded = [isClosed ? 1 : 0, source[0][0], source[0][1]];
  for (let index = 1; index < source.length; index += 1) {
    encoded.push(
      source[index][0] - source[index - 1][0],
      source[index][1] - source[index - 1][1],
    );
  }
  return encoded;
}

function formatData(name, data) {
  return `export const ${name}: readonly number[][] = [\n${data
    .map((chain) => `  ${JSON.stringify(chain)},`)
    .join("\n")}\n];`;
}

const coastlineData = makeCoastlineChains(geojson.features).map((chain) =>
  encodeChain(chain),
);
const chinaData = [
  ...countryRings("CHN"),
  ...countryRings("TWN"),
].map((ring) => encodeChain(ring, true));
const unitedStatesData = countryRings("USA").map((ring) =>
  encodeChain(ring, true),
);

const output = `// Generated by scripts/generate-about-map.mjs.
// Source: Natural Earth 1:110m admin-0 countries (public domain),
// distributed with the globe.gl examples. Coordinates are delta-encoded
// integer hundredths of a degree as [closed, lng, lat, dLng, dLat, ...].

${formatData("worldCoastlineData", coastlineData)}

${formatData("chinaAndTaiwanOutlineData", chinaData)}

${formatData("unitedStatesOutlineData", unitedStatesData)}
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, "utf8");
console.log(
  `Generated ${outputPath} (${coastlineData.length} coastline chains, ` +
    `${chinaData.length} China/Taiwan rings, ${unitedStatesData.length} US rings).`,
);
