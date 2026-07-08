import type { KmlParseResult, KmlPlacemark } from "@/types/kml";

function stripHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html.trim();

  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

function parseCoordinates(
  raw: string,
): { longitude: number; latitude: number } | null {
  const firstToken = raw.trim().split(/\s+/)[0];
  if (!firstToken) return null;

  const parts = firstToken.split(",").map((p) => p.trim());
  if (parts.length < 2) return null;

  const longitude = Number.parseFloat(parts[0]);
  const latitude = Number.parseFloat(parts[1]);

  if (Number.isNaN(longitude) || Number.isNaN(latitude)) return null;

  return { longitude, latitude };
}

function getElementName(element: Element): string | null {
  const name =
    element.querySelector(":scope > name")?.textContent?.trim() ??
    Array.from(element.children).find((c) => c.localName === "name")
      ?.textContent?.trim();
  return name || null;
}

function getLocalTagName(element: Element): string {
  return (element.localName ?? element.tagName).replace(/^.*:/, "");
}

/** Placemark 요소 파싱 (Folder 이름 포함) */
function parsePlacemarkElement(
  element: Element,
  folderName: string | null,
): KmlPlacemark | null {
  const name = getElementName(element) ?? "";
  if (!name) return null;

  const descriptionEl = Array.from(element.children).find(
    (c) => getLocalTagName(c) === "description",
  );
  const coordinatesEl =
    element.querySelector("coordinates") ??
    Array.from(element.getElementsByTagName("coordinates"))[0];

  const descriptionRaw = descriptionEl?.textContent ?? "";
  const coordinatesRaw = coordinatesEl?.textContent ?? "";

  if (!coordinatesRaw.trim()) return null;

  const coords = parseCoordinates(coordinatesRaw);
  if (!coords) return null;

  return {
    name,
    description: stripHtml(descriptionRaw),
    longitude: coords.longitude,
    latitude: coords.latitude,
    folderName: folderName ?? undefined,
  };
}

/**
 * KML 트리를 순회하며 Folder 컨텍스트를 유지한 채 Placemark 수집
 */
function walkKmlNode(
  node: Element,
  currentFolder: string | null,
  results: KmlPlacemark[],
  seenPlacemarks: Set<Element>,
): void {
  const tag = getLocalTagName(node);

  if (tag === "Placemark") {
    if (seenPlacemarks.has(node)) return;
    seenPlacemarks.add(node);

    const parsed = parsePlacemarkElement(node, currentFolder);
    if (parsed) results.push(parsed);
    return;
  }

  if (tag === "Folder") {
    const folderName = getElementName(node) ?? currentFolder;
    for (const child of Array.from(node.children)) {
      walkKmlNode(child, folderName, results, seenPlacemarks);
    }
    return;
  }

  for (const child of Array.from(node.children)) {
    walkKmlNode(child, currentFolder, results, seenPlacemarks);
  }
}

/** KML 텍스트에서 Folder 구조를 반영해 Placemark 파싱 */
export function parseKmlPlacemarks(kmlText: string): KmlParseResult {
  const errors: string[] = [];

  if (typeof DOMParser === "undefined") {
    return { placemarks: [], errors: ["브라우저 환경에서만 동작합니다."] };
  }

  const doc = new DOMParser().parseFromString(kmlText, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return {
      placemarks: [],
      errors: ["KML 파일 형식이 올바르지 않습니다."],
    };
  }

  const results: KmlPlacemark[] = [];
  const seenPlacemarks = new Set<Element>();

  const root = doc.documentElement;
  walkKmlNode(root, null, results, seenPlacemarks);

  if (results.length === 0) {
    errors.push("가져올 수 있는 장소가 없습니다.");
  }

  return { placemarks: results, errors };
}

export function coordinatesToMapsLink(
  latitude: number,
  longitude: number,
): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
