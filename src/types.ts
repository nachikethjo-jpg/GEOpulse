/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = "earthquake" | "volcano" | "mineral";

export interface GeologicalNode {
  id: string;
  type: NodeType;
  name: string;
  lat: number; // -90 to 90
  lng: number; // -180 to 180
  depth: number; // km
  magnitude?: number; // for earthquakes (e.g. 4.5 - 9.1)
  value?: string; // for minerals (e.g. "Grade-A Vein", "Deep Core Cluster")
  mineralType?: "gold" | "lithium" | "copper" | "platinum" | "rare_earth" | "uranium";
  status?: "active" | "dormant" | "pulsing" | "critical"; // for volcanoes / seismic activity
  timestamp: string;
  details: string;
}

export interface TectonicPlate {
  name: string;
  color: string;
  // A simplified set of lat/lng coordinates representing the plate boundaries
  boundary: Array<{ lat: number; lng: number }>;
}

export interface EarthLayer {
  id: string;
  name: string;
  depthRange: string;
  temperature: number; // in Celsius
  pressure: string;
  composition: string;
  color: string;
  borderColor: string;
  description: string;
  scifiTerm: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
