import type { EarthquakeFeedResponse, GeologicalNode } from "./types.js";

export const USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

interface UsgsProperties {
  mag: number | null;
  place?: string | null;
  time: number | null;
  updated?: number | null;
  url?: string | null;
  status?: string | null;
  magType?: string | null;
  code?: string | null;
}

interface UsgsFeature {
  id?: string | null;
  geometry?: { coordinates?: unknown } | null;
  properties?: UsgsProperties | null;
}

interface UsgsFeed {
  features?: unknown;
  metadata?: { generated?: unknown } | null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFeature(value: unknown): UsgsFeature | null {
  if (!isRecord(value)) return null;
  return value as unknown as UsgsFeature;
}

export function normalizeUsgsFeed(input: unknown, retrievedAt: string): EarthquakeFeedResponse {
  if (!isRecord(input)) throw new Error("USGS response was not an object");
  const feed = input as UsgsFeed;
  if (!Array.isArray(feed.features)) throw new Error("USGS response did not contain a features array");

  const nodes = feed.features.flatMap((rawFeature): GeologicalNode[] => {
    const feature = parseFeature(rawFeature);
    const coordinates = feature?.geometry?.coordinates;
    const properties = feature?.properties;
    if (!feature || !properties || !Array.isArray(coordinates) ||
        !finiteNumber(coordinates[0]) || !finiteNumber(coordinates[1]) ||
        !finiteNumber(coordinates[2]) || !finiteNumber(properties.mag) ||
        !finiteNumber(properties.time)) return [];

    const providerRecordId = String(feature.id || properties.code || "");
    if (!providerRecordId) return [];
    const sourceUrl = typeof properties.url === "string" ? properties.url : USGS_FEED_URL;
    const reviewStatus = properties.status === "reviewed" ? "reviewed" : "automatic";

    return [{
      id: `usgs-${providerRecordId}`,
      type: "earthquake",
      name: typeof properties.place === "string" ? properties.place : "Unnamed USGS event",
      lat: coordinates[1],
      lng: coordinates[0],
      depth: coordinates[2],
      magnitude: properties.mag,
      magnitudeType: typeof properties.magType === "string" ? properties.magType : undefined,
      timestamp: new Date(properties.time).toISOString(),
      details: `USGS ${reviewStatus} earthquake observation. Values may be revised as additional stations and analyst reviews become available.`,
      dataKind: "live_observation",
      provenance: {
        provider: "USGS Earthquake Hazards Program",
        providerRecordId,
        sourceUrl,
        retrievedAt,
        updatedAt: finiteNumber(properties.updated) ? new Date(properties.updated).toISOString() : undefined,
        reviewStatus,
      },
    }];
  });

  return {
    nodes,
    source: {
      provider: "USGS Earthquake Hazards Program",
      feedUrl: USGS_FEED_URL,
      retrievedAt,
      upstreamGeneratedAt: finiteNumber(feed.metadata?.generated)
        ? new Date(feed.metadata.generated).toISOString()
        : undefined,
      notice: "Earthquake parameters are preliminary and may be revised by USGS.",
    },
  };
}
