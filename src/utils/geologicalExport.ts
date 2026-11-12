/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeologicalNode } from "../types";

export type ExportScope = "all" | "history" | "seismic";
export type ExportFormat = "json" | "csv";

export interface ResearchExportMetadata {
  datasetTitle: string;
  generatedAt: string;
  schemaVersion: string;
  coordinateReferenceSystem: string;
  depthDatum: string;
  magnitudeScale: string;
  scope: ExportScope;
  totalRecords: number;
  statistics: {
    sessionHistoryCount: number;
    seismicNodesCount: number;
    maxMagnitude: number | null;
    minMagnitude: number | null;
    meanMagnitude: number | null;
    depthRangeKm: { min: number; max: number } | null;
    geographicBoundingBox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    } | null;
  };
}

export interface FormattedResearchJSON {
  exportMetadata: ResearchExportMetadata;
  sessionHistory?: GeologicalNode[];
  seismicNodes?: GeologicalNode[];
  records?: Array<GeologicalNode & { sourceCategory: "session_simulated" | "grid_monitored" }>;
}

/**
 * Filter all nodes to extract seismic nodes (earthquakes or nodes with magnitude)
 */
export function extractSeismicNodes(nodes: GeologicalNode[]): GeologicalNode[] {
  return nodes.filter(
    (n) => n.type === "earthquake" || (typeof n.magnitude === "number" && !isNaN(n.magnitude))
  );
}

/**
 * Compute descriptive geological statistics over a node collection
 */
export function computeGeologicalStatistics(nodes: GeologicalNode[]) {
  if (nodes.length === 0) {
    return {
      maxMagnitude: null,
      minMagnitude: null,
      meanMagnitude: null,
      depthRangeKm: null,
      geographicBoundingBox: null,
    };
  }

  const mags = nodes
    .map((n) => n.magnitude)
    .filter((m): m is number => typeof m === "number" && !isNaN(m));

  const depths = nodes.map((n) => n.depth);
  const lats = nodes.map((n) => n.lat);
  const lngs = nodes.map((n) => n.lng);

  return {
    maxMagnitude: mags.length > 0 ? parseFloat(Math.max(...mags).toFixed(2)) : null,
    minMagnitude: mags.length > 0 ? parseFloat(Math.min(...mags).toFixed(2)) : null,
    meanMagnitude:
      mags.length > 0
        ? parseFloat((mags.reduce((a, b) => a + b, 0) / mags.length).toFixed(2))
        : null,
    depthRangeKm: {
      min: Math.min(...depths),
      max: Math.max(...depths),
    },
    geographicBoundingBox: {
      minLat: parseFloat(Math.min(...lats).toFixed(4)),
      maxLat: parseFloat(Math.max(...lats).toFixed(4)),
      minLng: parseFloat(Math.min(...lngs).toFixed(4)),
      maxLng: parseFloat(Math.max(...lngs).toFixed(4)),
    },
  };
}

/**
 * Generate formatted research JSON
 */
export function generateResearchJSON(
  sessionHistory: GeologicalNode[],
  allNodes: GeologicalNode[],
  scope: ExportScope = "all"
): string {
  const seismicNodes = extractSeismicNodes(allNodes);

  let targetNodes: GeologicalNode[] = [];
  if (scope === "history") {
    targetNodes = sessionHistory;
  } else if (scope === "seismic") {
    targetNodes = seismicNodes;
  } else {
    // deduplicate by id if simulated events were also inserted into nodes
    const map = new Map<string, GeologicalNode>();
    sessionHistory.forEach((n) => map.set(n.id, n));
    seismicNodes.forEach((n) => map.set(n.id, n));
    targetNodes = Array.from(map.values());
  }

  const stats = computeGeologicalStatistics(targetNodes);

  const metadata: ResearchExportMetadata = {
    datasetTitle: "GEOPULSE Lithospheric & Seismic Research Survey",
    generatedAt: new Date().toISOString(),
    schemaVersion: "1.2.0-geological-research",
    coordinateReferenceSystem: "EPSG:4326 (WGS84 World Geodetic System)",
    depthDatum: "Mean Sea Level (km, negative downward)",
    magnitudeScale: "Moment Magnitude (Mw / Richter scale equivalent)",
    scope,
    totalRecords: targetNodes.length,
    statistics: {
      sessionHistoryCount: sessionHistory.length,
      seismicNodesCount: seismicNodes.length,
      ...stats,
    },
  };

  const payload: FormattedResearchJSON = {
    exportMetadata: metadata,
  };

  if (scope === "history") {
    payload.sessionHistory = sessionHistory;
  } else if (scope === "seismic") {
    payload.seismicNodes = seismicNodes;
  } else {
    payload.sessionHistory = sessionHistory;
    payload.seismicNodes = seismicNodes;
    payload.records = targetNodes.map((n) => ({
      ...n,
      sourceCategory: sessionHistory.some((s) => s.id === n.id)
        ? "session_simulated"
        : "grid_monitored",
    }));
  }

  return JSON.stringify(payload, null, 2);
}

/**
 * Escape CSV string field according to RFC-4180
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate formatted tabular CSV for geological research
 */
export function generateResearchCSV(
  sessionHistory: GeologicalNode[],
  allNodes: GeologicalNode[],
  scope: ExportScope = "all"
): string {
  const seismicNodes = extractSeismicNodes(allNodes);

  interface FlatRecord extends GeologicalNode {
    sourceCategory: "session_simulated" | "grid_monitored";
  }

  let records: FlatRecord[] = [];

  if (scope === "history") {
    records = sessionHistory.map((n) => ({
      ...n,
      sourceCategory: "session_simulated",
    }));
  } else if (scope === "seismic") {
    records = seismicNodes.map((n) => ({
      ...n,
      sourceCategory: "grid_monitored",
    }));
  } else {
    const historyIds = new Set(sessionHistory.map((s) => s.id));
    const historyRecords: FlatRecord[] = sessionHistory.map((n) => ({
      ...n,
      sourceCategory: "session_simulated",
    }));
    const nodeRecords: FlatRecord[] = seismicNodes
      .filter((n) => !historyIds.has(n.id))
      .map((n) => ({
        ...n,
        sourceCategory: "grid_monitored",
      }));
    records = [...historyRecords, ...nodeRecords];
  }

  const headers = [
    "record_id",
    "dataset_source",
    "node_name",
    "geological_type",
    "latitude",
    "longitude",
    "depth_km",
    "magnitude",
    "status",
    "timestamp_utc",
    "details",
    "mineral_type",
  ];

  const rows = records.map((r) => [
    escapeCSVField(r.id),
    escapeCSVField(r.sourceCategory),
    escapeCSVField(r.name),
    escapeCSVField(r.type),
    r.lat !== undefined ? r.lat.toFixed(5) : "",
    r.lng !== undefined ? r.lng.toFixed(5) : "",
    r.depth !== undefined ? r.depth.toFixed(1) : "",
    r.magnitude !== undefined && r.magnitude !== null ? r.magnitude.toFixed(1) : "",
    escapeCSVField(r.status || "active"),
    escapeCSVField(r.timestamp),
    escapeCSVField(r.details || ""),
    escapeCSVField(r.mineralType || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Triggers standard browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * High-level export execution function
 */
export function exportResearchData(
  sessionHistory: GeologicalNode[],
  allNodes: GeologicalNode[],
  format: ExportFormat,
  scope: ExportScope = "all"
): { filename: string; recordCount: number } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const scopePrefix =
    scope === "history"
      ? "session_history"
      : scope === "seismic"
      ? "seismic_nodes"
      : "geopulse_research_combined";

  if (format === "json") {
    const jsonStr = generateResearchJSON(sessionHistory, allNodes, scope);
    const filename = `${scopePrefix}_${timestamp}.json`;
    downloadFile(jsonStr, filename, "application/json;charset=utf-8");
    const count =
      scope === "history"
        ? sessionHistory.length
        : scope === "seismic"
        ? extractSeismicNodes(allNodes).length
        : sessionHistory.length + extractSeismicNodes(allNodes).length;
    return { filename, recordCount: count };
  } else {
    const csvStr = generateResearchCSV(sessionHistory, allNodes, scope);
    const filename = `${scopePrefix}_${timestamp}.csv`;
    downloadFile(csvStr, filename, "text/csv;charset=utf-8");
    const count =
      scope === "history"
        ? sessionHistory.length
        : scope === "seismic"
        ? extractSeismicNodes(allNodes).length
        : sessionHistory.length + extractSeismicNodes(allNodes).length;
    return { filename, recordCount: count };
  }
}
