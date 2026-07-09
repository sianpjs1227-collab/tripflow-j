interface GeoPosition {
  latitude: number;
  longitude: number;
}

function parseLatLngPair(value: string): GeoPosition | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}

/** Google Maps 링크에서 좌표 추출 (여러 URL 형식 지원) */
export function extractCoordsFromMapsLink(mapsLink: string): GeoPosition | null {
  const trimmed = mapsLink.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    const href = url.href;

    for (const key of ["query", "q", "ll", "center"]) {
      const param = url.searchParams.get(key);
      if (!param) continue;
      const coords = parseLatLngPair(param);
      if (coords) return coords;
    }

    const atMatch = `${url.pathname}${url.hash}`.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    );
    if (atMatch) {
      const latitude = Number.parseFloat(atMatch[1]);
      const longitude = Number.parseFloat(atMatch[2]);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }

    const d3 = href.match(/!3d(-?\d+(?:\.\d+)?)/);
    const d4 = href.match(/!4d(-?\d+(?:\.\d+)?)/);
    if (d3 && d4) {
      const latitude = Number.parseFloat(d3[1]);
      const longitude = Number.parseFloat(d4[1]);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }

    return null;
  } catch {
    return null;
  }
}
