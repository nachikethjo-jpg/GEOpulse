/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeologicalNode, TectonicPlate, EarthLayer } from "./types";

export const INITIAL_NODES: GeologicalNode[] = [
  // --- EARTHQUAKES ---
  {
    id: "eq-1",
    type: "earthquake",
    name: "Tohoku Megathrust Slip",
    lat: 38.322,
    lng: 142.369,
    depth: 24,
    magnitude: 8.9,
    status: "critical",
    timestamp: "2026-07-13T12:34:00Z",
    details: "Severe megathrust rupture along the Japan Trench subduction zone. Triggered dynamic aftershock pulses and localized tsunami warnings across Honshu segment."
  },
  {
    id: "eq-2",
    type: "earthquake",
    name: "Atacama Megathrust Rupture",
    lat: -19.642,
    lng: -70.817,
    depth: 35,
    magnitude: 7.2,
    status: "pulsing",
    timestamp: "2026-07-13T09:12:00Z",
    details: "Significant tectonic displacement along the Peru-Chile Trench. Underplating stress continues to migrate eastward, threatening coastal structural integrity."
  },
  {
    id: "eq-3",
    type: "earthquake",
    name: "Cascadia subduction zone Creep",
    lat: 45.823,
    lng: -124.789,
    depth: 42,
    magnitude: 5.8,
    status: "pulsing",
    timestamp: "2026-07-13T16:01:00Z",
    details: "Slow-slip tremor burst detected by coastal GPS arrays. Highly monitored locking segment exhibiting persistent strain accumulation."
  },
  {
    id: "eq-4",
    type: "earthquake",
    name: "Sumatran Megathrust Strike",
    lat: -2.311,
    lng: 101.455,
    depth: 18,
    magnitude: 6.7,
    status: "pulsing",
    timestamp: "2026-07-12T23:45:00Z",
    details: "Oblique slip event along the Sunda Trench interface. High stress coupling ratio indicates secondary fault planes are nearing failure thresholds."
  },
  {
    id: "eq-5",
    type: "earthquake",
    name: "San Andreas Strike-Slip",
    lat: 34.052,
    lng: -118.243,
    depth: 12,
    magnitude: 4.8,
    status: "active",
    timestamp: "2026-07-13T14:20:00Z",
    details: "Shallow strike-slip tremor along the Southern San Andreas fault strand. Minor localized damage reported; stress redistribution active."
  },
  {
    id: "eq-6",
    type: "earthquake",
    name: "Mid-Atlantic Ridge Rift Pulse",
    lat: 64.126,
    lng: -21.817,
    depth: 8,
    magnitude: 5.1,
    status: "active",
    timestamp: "2026-07-13T03:04:00Z",
    details: "Swarm of shallow extensional earthquakes along the Reykjanes Ridge. Coincides with hydrothermal temperature excursions at nearby vents."
  },

  // --- VOLCANOES ---
  {
    id: "vol-1",
    type: "volcano",
    name: "Mount Sakurajima",
    lat: 31.593,
    lng: 130.657,
    depth: 4,
    status: "critical",
    timestamp: "2026-07-13T15:45:00Z",
    details: "Explosive vulcanian eruption yielding a 4.5km ash plume. Seismographs indicate high-frequency volcanic tremors and rapid magma ascent rates."
  },
  {
    id: "vol-2",
    type: "volcano",
    name: "Kilauea Caldera",
    lat: 19.417,
    lng: -155.283,
    depth: 2,
    status: "active",
    timestamp: "2026-07-13T11:00:00Z",
    details: "Active effusive fountaining inside Halemaʻumaʻu crater. Lava flows channeled into subterranean tubes, draining safely toward the southern shelf."
  },
  {
    id: "vol-3",
    type: "volcano",
    name: "Mount Etna",
    lat: 37.751,
    lng: 14.993,
    depth: 5,
    status: "pulsing",
    timestamp: "2026-07-13T01:30:00Z",
    details: "Strombolian explosive discharge and sulfur dioxide outgassing. Paroxysmal activity from the Southeast Crater has increased in frequency."
  },
  {
    id: "vol-4",
    type: "volcano",
    name: "Mount Popocatépetl",
    lat: 19.023,
    lng: -98.622,
    depth: 6,
    status: "active",
    timestamp: "2026-07-12T19:50:00Z",
    details: "Moderate exhalations containing water vapor, gas, and ash. Dome expansion detected via synthetic-aperture radar scans."
  },
  {
    id: "vol-fuego",
    type: "volcano",
    name: "Mount Fuego",
    lat: 14.47,
    lng: -90.880,
    depth: 4,
    status: "pulsing",
    timestamp: "2026-07-13T10:15:00Z",
    details: "Ongoing strombolian explosive activity at the Summit Cone. Thermal imaging sensors registered elevated gas discharge and localized tremors. Peak elevation: 3,763m."
  },
  {
    id: "vol-5",
    type: "volcano",
    name: "Krakatoa Marine Caldera",
    lat: -6.102,
    lng: 105.423,
    depth: 1,
    status: "pulsing",
    timestamp: "2026-07-13T07:15:00Z",
    details: "Phreatomagmatic venting producing localized water column bubbles and seismic micro-tremors. Subsurface caldera building continuing rapidly."
  },

  // --- MINERAL DEPOSITS ---
  {
    id: "min-1",
    type: "mineral",
    name: "Salar de Uyuni Brine",
    lat: -20.133,
    lng: -67.483,
    depth: 0.1,
    value: "Ultra-High Grade Vein",
    mineralType: "lithium",
    timestamp: "2026-07-12T12:00:00Z",
    details: "A massive, shallow evaporite lithium brine field. Highly concentrated lithium carbonate reserves estimated at 21 million metric tons."
  },
  {
    id: "min-2",
    type: "mineral",
    name: "Witwatersrand Deep Reef",
    lat: -26.204,
    lng: 28.047,
    depth: 3.8,
    value: "Deep Core Cluster",
    mineralType: "gold",
    timestamp: "2026-07-11T09:30:00Z",
    details: "Archaean quartz-pebble conglomerate gold deposit. Ultra-deep mining operations tracking rich ore zones dipping steeply south at 3.8km depths."
  },
  {
    id: "min-3",
    type: "mineral",
    name: "Escondida Porphyry Stock",
    lat: -24.270,
    lng: -69.068,
    depth: 0.8,
    value: "Massive Stockwork",
    mineralType: "copper",
    timestamp: "2026-07-12T15:20:00Z",
    details: "Giant copper porphyry mineralized zone. High-density stockwork chalcopyrite veins flanked by advanced argillic alteration halos."
  },
  {
    id: "min-4",
    type: "mineral",
    name: "Bayan Obo Complex",
    lat: 41.791,
    lng: 109.972,
    depth: 1.2,
    value: "Rare-Earth Megastructure",
    mineralType: "rare_earth",
    timestamp: "2026-07-13T05:10:00Z",
    details: "World's largest carbonatite iron-REE-fluorite ore body. Extremely rich in Neodymium, Lanthanum, and Cerium minerals hosted within bastnäsite veins."
  },
  {
    id: "min-5",
    type: "mineral",
    name: "McArthur River Unconformity",
    lat: 57.771,
    lng: -103.951,
    depth: 0.5,
    value: "Uranium Core Vein",
    mineralType: "uranium",
    timestamp: "2026-07-13T10:40:00Z",
    details: "High-grade unconformity-hosted pitchblende uranium deposit. Located at the boundary between Athabasca sandstones and crystalline basement."
  },
  {
    id: "min-6",
    type: "mineral",
    name: "Merensky Reef Plat-Horizon",
    lat: -25.412,
    lng: 27.241,
    depth: 1.5,
    value: "Sulfide Layer-Yield",
    mineralType: "platinum",
    timestamp: "2026-07-12T14:10:00Z",
    details: "Extensive pegmatitic pyroxenite layer containing abundant platinum-group elements. Co-mineralized with heavy nickel-copper sulfides."
  }
];

export const TECTONIC_PLATES: TectonicPlate[] = [
  {
    name: "Pacific Plate",
    color: "#ff007f",
    boundary: [
      { lat: 60, lng: -140 }, { lat: 60, lng: 180 }, { lat: 50, lng: 160 }, { lat: 35, lng: 140 },
      { lat: 10, lng: 125 }, { lat: -10, lng: 150 }, { lat: -40, lng: 180 }, { lat: -60, lng: -170 },
      { lat: -55, lng: -120 }, { lat: -35, lng: -100 }, { lat: -15, lng: -115 }, { lat: 0, lng: -115 },
      { lat: 15, lng: -105 }, { lat: 30, lng: -115 }, { lat: 45, lng: -125 }, { lat: 55, lng: -135 },
      { lat: 60, lng: -140 }
    ]
  },
  {
    name: "Nazca Plate",
    color: "#00ffff",
    boundary: [
      { lat: 0, lng: -115 }, { lat: -15, lng: -115 }, { lat: -35, lng: -100 }, { lat: -45, lng: -75 },
      { lat: -15, lng: -75 }, { lat: 0, lng: -80 }, { lat: 0, lng: -115 }
    ]
  },
  {
    name: "South American Plate",
    color: "#ffff00",
    boundary: [
      { lat: 10, lng: -60 }, { lat: 0, lng: -80 }, { lat: -15, lng: -75 }, { lat: -45, lng: -75 },
      { lat: -55, lng: -65 }, { lat: -45, lng: -35 }, { lat: -20, lng: -20 }, { lat: 0, lng: -20 },
      { lat: 10, lng: -40 }, { lat: 10, lng: -60 }
    ]
  },
  {
    name: "North American Plate",
    color: "#00ff00",
    boundary: [
      { lat: 75, lng: -100 }, { lat: 80, lng: -40 }, { lat: 65, lng: -20 }, { lat: 45, lng: -30 },
      { lat: 20, lng: -60 }, { lat: 15, lng: -90 }, { lat: 30, lng: -115 }, { lat: 45, lng: -125 },
      { lat: 60, lng: -140 }, { lat: 65, lng: 170 }, { lat: 75, lng: 140 }, { lat: 75, lng: -100 }
    ]
  },
  {
    name: "Eurasian Plate",
    color: "#a020f0",
    boundary: [
      { lat: 75, lng: 140 }, { lat: 65, lng: 170 }, { lat: 40, lng: 140 }, { lat: 30, lng: 120 },
      { lat: 15, lng: 100 }, { lat: 10, lng: 75 }, { lat: 30, lng: 35 }, { lat: 45, lng: 15 },
      { lat: 65, lng: -20 }, { lat: 80, lng: -40 }, { lat: 75, lng: 60 }, { lat: 75, lng: 140 }
    ]
  },
  {
    name: "African Plate",
    color: "#ff8c00",
    boundary: [
      { lat: 35, lng: -10 }, { lat: 45, lng: 15 }, { lat: 30, lng: 35 }, { lat: 10, lng: 45 },
      { lat: -35, lng: 40 }, { lat: -45, lng: 10 }, { lat: -45, lng: -35 }, { lat: -20, lng: -20 },
      { lat: 0, lng: -20 }, { lat: 20, lng: -20 }, { lat: 35, lng: -10 }
    ]
  },
  {
    name: "Indo-Australian Plate",
    color: "#0080ff",
    boundary: [
      { lat: 10, lng: 75 }, { lat: 15, lng: 100 }, { lat: -10, lng: 110 }, { lat: -10, lng: 140 },
      { lat: -40, lng: 150 }, { lat: -50, lng: 160 }, { lat: -55, lng: 120 }, { lat: -45, lng: 80 },
      { lat: -35, lng: 40 }, { lat: 10, lng: 45 }, { lat: 10, lng: 75 }
    ]
  }
];

export const EARTH_LAYERS: EarthLayer[] = [
  {
    id: "crust",
    name: "Lithospheric Crust",
    depthRange: "0 - 40 km",
    temperature: 450,
    pressure: "1 to 10,000 atm",
    composition: "Felsic and mafic silicates, granite, basaltic minerals",
    color: "from-cyan-500/20 to-cyan-500/50",
    borderColor: "border-cyan-400",
    description: "The Earth's brittle outer shell. Fragmented into active tectonic plates that float over the underlying ductile asthenosphere. Rich in quartz, ore minerals, and vital industrial deposits.",
    scifiTerm: "CRUST-MATRIX INTERFACE"
  },
  {
    id: "upper_mantle",
    name: "Asthenosphere & Upper Mantle",
    depthRange: "40 - 660 km",
    temperature: 1400,
    pressure: "0.1 to 0.2 million atm",
    composition: "Ductile peridotite, olivine, pyroxene aggregates",
    color: "from-orange-500/25 to-orange-500/60",
    borderColor: "border-orange-500",
    description: "A solid yet highly plastic zone. Convective heat currents flow slowly here, driving the motion of tectonic plates above. Sourced with deep mantle plumes feeding volcanic calderas.",
    scifiTerm: "CONVECTIVE FLOW CHAMBER"
  },
  {
    id: "lower_mantle",
    name: "Lower Mantle (Mesosphere)",
    depthRange: "660 - 2,900 km",
    temperature: 2800,
    pressure: "0.2 to 1.3 million atm",
    composition: "Bridgmanite, ferropericlase, high-density oxides",
    color: "from-red-600/30 to-red-600/70",
    borderColor: "border-red-600",
    description: "A highly compressed region under intense lithostatic pressure. Crystals here reorganize into ultra-dense mineral phases, resisting flow but transferring vast core heat through conduction.",
    scifiTerm: "MESOSPHERIC STRATA"
  },
  {
    id: "outer_core",
    name: "Liquid Outer Core",
    depthRange: "2,900 - 5,150 km",
    temperature: 4600,
    pressure: "1.3 to 3.3 million atm",
    composition: "Liquid Iron, Nickel, Sulfur, Oxygen impurities",
    color: "from-yellow-500/40 to-yellow-500/80",
    borderColor: "border-yellow-400",
    description: "Vigorous, turbulent convection of liquid metals creates electric currents. This core-level dynamo effect generates the Earth's vital geomagnetic field, protecting life from solar winds.",
    scifiTerm: "GEOMAGNETIC DYNAMO CORE"
  },
  {
    id: "inner_core",
    name: "Solid Metallic Inner Core",
    depthRange: "5,150 - 6,371 km",
    temperature: 5800,
    pressure: "3.3 to 3.6 million atm",
    composition: "Crystalline solid Iron-Nickel alloy",
    color: "from-amber-100/50 to-amber-100/95",
    borderColor: "border-amber-200",
    description: "The planetary center. Though hotter than the Sun's surface, the immense pressure prevents melting, forcing iron atoms into a hexagonal close-packed crystal structure. Slowly expanding.",
    scifiTerm: "GRAVITATIONAL ANCHOR POINT"
  }
];
