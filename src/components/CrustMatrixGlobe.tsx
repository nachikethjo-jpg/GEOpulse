/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, MouseEvent, TouchEvent } from "react";
import { GeologicalNode, TectonicPlate } from "../types";
import { TECTONIC_PLATES } from "../data";
import { Maximize2, Minimize2, RotateCw, Globe, Layers, EyeOff, ShieldAlert } from "lucide-react";
import * as d3 from "d3";

// --- GEOGRAPHIC CONTINENTS POLYGONS ---
// Simplified representation of major landmasses for 3D projection
const LAND_POLYGONS = {
  northAmerica: [
    {lat: 72, lng: -168}, {lat: 70, lng: -120}, {lat: 70, lng: -80}, {lat: 70, lng: -60},
    {lat: 50, lng: -55}, {lat: 47, lng: -52}, {lat: 25, lng: -80}, {lat: 9, lng: -79},
    {lat: 16, lng: -95}, {lat: 20, lng: -105}, {lat: 32, lng: -117}, {lat: 48, lng: -125},
    {lat: 60, lng: -145}, {lat: 65, lng: -168}
  ],
  southAmerica: [
    {lat: 12, lng: -72}, {lat: 10, lng: -60}, {lat: -6, lng: -35}, {lat: -23, lng: -43},
    {lat: -55, lng: -68}, {lat: -45, lng: -74}, {lat: -15, lng: -75}, {lat: -2, lng: -81},
    {lat: 5, lng: -77}
  ],
  africa: [
    {lat: 36, lng: -6}, {lat: 37, lng: 11}, {lat: 31, lng: 32}, {lat: 30, lng: 34},
    {lat: 22, lng: 37}, {lat: 12, lng: 44}, {lat: 11, lng: 51}, {lat: -34, lng: 19},
    {lat: -33, lng: 28}, {lat: 5, lng: 9}, {lat: 15, lng: -17}, {lat: 32, lng: -9}
  ],
  eurasia: [
    {lat: 36, lng: -9}, {lat: 43, lng: 10}, {lat: 40, lng: 26}, {lat: 41, lng: 29},
    {lat: 30, lng: 32}, {lat: 31, lng: 35}, {lat: 13, lng: 43}, {lat: 12, lng: 54},
    {lat: 25, lng: 61}, {lat: 8, lng: 77}, {lat: 22, lng: 90}, {lat: 6, lng: 80},
    {lat: 1, lng: 103}, {lat: 10, lng: 108}, {lat: 20, lng: 108}, {lat: 22, lng: 115},
    {lat: 31, lng: 122}, {lat: 40, lng: 125}, {lat: 43, lng: 132}, {lat: 60, lng: 165},
    {lat: 66, lng: 170}, {lat: 70, lng: 180}, {lat: 75, lng: 135}, {lat: 75, lng: 80},
    {lat: 70, lng: 30}, {lat: 71, lng: 10}, {lat: 60, lng: 5}, {lat: 50, lng: -5}
  ],
  australia: [
    {lat: -21, lng: 114}, {lat: -11, lng: 136}, {lat: -11, lng: 142}, {lat: -25, lng: 153},
    {lat: -38, lng: 150}, {lat: -35, lng: 117}, {lat: -21, lng: 114}
  ],
  greenland: [
    {lat: 60, lng: -44}, {lat: 68, lng: -33}, {lat: 75, lng: -18}, {lat: 83, lng: -30},
    {lat: 82, lng: -60}, {lat: 76, lng: -69}, {lat: 66, lng: -53}
  ],
  madagascar: [
    {lat: -12, lng: 49}, {lat: -16, lng: 50}, {lat: -25, lng: 47}, {lat: -25, lng: 44},
    {lat: -16, lng: 44}
  ],
  uk: [
    {lat: 50, lng: -5}, {lat: 55, lng: -6}, {lat: 58, lng: -5}, {lat: 58, lng: -3},
    {lat: 51, lng: 1}
  ],
  japan: [
    {lat: 31, lng: 130}, {lat: 35, lng: 135}, {lat: 40, lng: 140}, {lat: 45, lng: 145},
    {lat: 43, lng: 140}, {lat: 35, lng: 132}
  ],
  india: [
    {lat: 23, lng: 68}, {lat: 20, lng: 73}, {lat: 8, lng: 77}, {lat: 10, lng: 80},
    {lat: 22, lng: 89}
  ],
  tasmania: [
    {lat: -40, lng: 144}, {lat: -40, lng: 148}, {lat: -43, lng: 148}, {lat: -43, lng: 144}
  ],
  newZealandNorth: [
    {lat: -34, lng: 172}, {lat: -37, lng: 178}, {lat: -41, lng: 175}, {lat: -39, lng: 173}
  ],
  newZealandSouth: [
    {lat: -41, lng: 172}, {lat: -41, lng: 174}, {lat: -46, lng: 170}, {lat: -46, lng: 166}
  ],
  iceland: [
    {lat: 63, lng: -24}, {lat: 66, lng: -24}, {lat: 66, lng: -13}, {lat: 63, lng: -13}
  ],
  sumatraJava: [
    {lat: 5, lng: 95}, {lat: -2, lng: 102}, {lat: -6, lng: 105}, {lat: -8, lng: 115},
    {lat: -9, lng: 115}, {lat: -7, lng: 105}, {lat: -5, lng: 100}, {lat: 1, lng: 97}
  ],
  borneo: [
    {lat: 7, lng: 116}, {lat: 5, lng: 119}, {lat: -3, lng: 117}, {lat: -4, lng: 111},
    {lat: 1, lng: 109}, {lat: 4, lng: 113}
  ],
  newGuinea: [
    {lat: -1, lng: 131}, {lat: -3, lng: 143}, {lat: -10, lng: 150}, {lat: -8, lng: 141},
    {lat: -4, lng: 135}
  ],
  philippines: [
    {lat: 18, lng: 120}, {lat: 14, lng: 121}, {lat: 10, lng: 125}, {lat: 6, lng: 125},
    {lat: 9, lng: 122}, {lat: 14, lng: 120}
  ]
};

// Ray casting algorithm for Point-in-Polygon check
function isPointInPolygon(lat: number, lng: number, polygon: {lat: number; lng: number}[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

interface LandPoint {
  lat: number;
  lng: number;
  type: 'ice' | 'desert' | 'land';
}

// Pre-compute dense geographic grid points (resolution: 2 degrees)
const LAND_POINTS: LandPoint[] = [];
const GRID_STEP = 2.0;

for (let lat = -90; lat <= 90; lat += GRID_STEP) {
  for (let lng = -180; lng < 180; lng += GRID_STEP) {
    if (lat < -60 || lat > 72) {
      // Antarctica & high Arctic polar regions
      LAND_POINTS.push({ lat, lng, type: 'ice' });
    } else {
      let isLand = false;
      for (const poly of Object.values(LAND_POLYGONS)) {
        if (isPointInPolygon(lat, lng, poly)) {
          isLand = true;
          break;
        }
      }
      if (isLand) {
        let type: 'ice' | 'desert' | 'land' = 'land';
        // Sahara & Arabian desert
        if (lat >= 12 && lat <= 32 && lng >= -17 && lng <= 55) {
          type = 'desert';
        }
        // Gobi Desert
        else if (lat >= 35 && lat <= 48 && lng >= 75 && lng <= 105) {
          type = 'desert';
        }
        // Australian Outback
        else if (lat >= -32 && lat <= -18 && lng >= 115 && lng <= 145) {
          type = 'desert';
        }
        // SW US & Mexico deserts
        else if (lat >= 23 && lat <= 35 && lng >= -118 && lng <= -100) {
          type = 'desert';
        }
        // Atacama desert
        else if (lat >= -28 && lat <= -16 && lng >= -72 && lng <= -66) {
          type = 'desert';
        }
        LAND_POINTS.push({ lat, lng, type });
      }
    }
  }
}

// Geographic coordinates for center labels of major continents
const CONTINENTS_DATA = [
  { name: "NORTH AMERICA", lat: 48, lng: -100, code: "PLATE: N_AMER" },
  { name: "SOUTH AMERICA", lat: -15, lng: -60, code: "PLATE: S_AMER" },
  { name: "EUROPE", lat: 50, lng: 15, code: "PLATE: EURAS" },
  { name: "ASIA", lat: 45, lng: 95, code: "PLATE: EURAS" },
  { name: "AFRICA", lat: 2, lng: 20, code: "PLATE: AFRIC" },
  { name: "AUSTRALIA", lat: -25, lng: 135, code: "PLATE: AUSTRAL" },
  { name: "ANTARCTICA", lat: -78, lng: 0, code: "PLATE: ANTARC" },
  { name: "GREENLAND", lat: 72, lng: -40, code: "PLATE: N_AMER" }
];

interface GlobeProps {
  nodes: GeologicalNode[];
  selectedNode: GeologicalNode | null;
  onSelectNode: (node: GeologicalNode | null) => void;
  filters: {
    earthquakes: boolean;
    volcanoes: boolean;
    minerals: boolean;
    plates: boolean;
    grid: boolean;
    continents: boolean;
    heatmap: boolean;
  };
}

export default function CrustMatrixGlobe({
  nodes,
  selectedNode,
  onSelectNode,
  filters,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Globe states
  const [rotationX, setRotationX] = useState<number>(0.2); // pitch (up/down)
  const [rotationY, setRotationY] = useState<number>(-0.6); // yaw (left/right)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<GeologicalNode | null>(null);

  // Drag states
  const isDragging = useRef<boolean>(false);
  const prevMouseX = useRef<number>(0);
  const prevMouseY = useRef<number>(0);

  // Animation frame ref
  const animFrameId = useRef<number | null>(null);
  const pulseRef = useRef<number>(0);

  // Size states
  const [dimensions, setDimensions] = useState({ width: 450, height: 450 });

  // Handle Container Resize to stay fully responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height || 450);
        setDimensions({ width: size, height: size });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Auto rotation effect
  useEffect(() => {
    if (!isRotating || isDragging.current) return;

    let lastTime = performance.now();
    const rotate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setRotationY((prev) => (prev + delta * 0.12) % (Math.PI * 2));
      animFrameId.current = requestAnimationFrame(rotate);
    };

    animFrameId.current = requestAnimationFrame(rotate);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isRotating]);

  // Center on selected node if it changes (without locking manual rotations)
  useEffect(() => {
    if (selectedNode) {
      // Lat / Lng conversion to YAW (lng) and PITCH (lat)
      // Note: Lat needs to be inverted depending on camera angle
      const targetY = -selectedNode.lng * (Math.PI / 180) - Math.PI / 2;
      const targetX = selectedNode.lat * (Math.PI / 180);

      // Smoothly transition or set directly
      setRotationY(targetY);
      setRotationX(targetX);
      setIsRotating(false); // Stop auto-rotating to lock onto selection
    }
  }, [selectedNode]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const center = { x: width / 2, y: height / 2 };
    const radius = (Math.min(width, height) / 2 - 20) * zoom;

    // Set canvas high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);
    const pVal = Math.sin(pulseRef.current);

    // Clear Canvas with a deep space translucent layer
    ctx.clearRect(0, 0, width, height);

    // --- MATH HELPERS ---
    // Converts 3D space on Unit Sphere to rotated Canvas coordinates
    const project = (lat: number, lng: number) => {
      const latRad = lat * (Math.PI / 180);
      const lngRad = lng * (Math.PI / 180);

      // Unit sphere 3D Cartesian coordinates
      const x = Math.cos(latRad) * Math.cos(lngRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.sin(lngRad);

      // 3D rotation around Y (Yaw)
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // 3D rotation around X (Pitch)
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX; // positive = front, negative = back

      return {
        cx: center.x + x1 * radius,
        cy: center.y - y2 * radius,
        depth: z2, // visibility depth
      };
    };

    // --- DRAW BACKGROUND GLOW ---
    const radGlow = ctx.createRadialGradient(center.x, center.y, radius * 0.6, center.x, center.y, radius * 1.15);
    radGlow.addColorStop(0, "rgba(120, 80, 40, 0.15)"); // warm core
    radGlow.addColorStop(0.7, "rgba(80, 50, 25, 0.05)"); // warm outer ring
    radGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // --- PART 1: DRAW BACK-FACING OVERLAYS (BEHIND GLOBE) ---
    if (filters.grid) {
      ctx.lineWidth = 0.5;

      // Back-facing parallels (Latitude lines)
      const lats = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
      lats.forEach((lat) => {
        ctx.beginPath();
        let bFirst = true;
        for (let lng = -180; lng <= 180; lng += 5) {
          const { cx, cy, depth } = project(lat, lng);
          if (depth <= 0) {
            if (bFirst) {
              ctx.moveTo(cx, cy);
              bFirst = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            bFirst = true;
          }
        }
        ctx.strokeStyle = "rgba(180, 120, 70, 0.03)";
        ctx.stroke();
      });

      // Back-facing meridians (Longitude lines)
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let bFirst = true;
        for (let lat = -90; lat <= 90; lat += 5) {
          const { cx, cy, depth } = project(lat, lng);
          if (depth <= 0) {
            if (bFirst) {
              ctx.moveTo(cx, cy);
              bFirst = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            bFirst = true;
          }
        }
        ctx.strokeStyle = "rgba(180, 120, 70, 0.03)";
        ctx.stroke();
      }
    }

    if (filters.plates) {
      TECTONIC_PLATES.forEach((plate) => {
        // Back-facing boundaries as extremely subtle dots
        ctx.beginPath();
        let bFirst = true;
        plate.boundary.forEach((coord) => {
          const { cx, cy, depth } = project(coord.lat, coord.lng);
          if (depth <= 0) {
            if (bFirst) {
              ctx.moveTo(cx, cy);
              bFirst = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            bFirst = true;
          }
        });
        ctx.strokeStyle = `${plate.color}10`; // Backwards faint
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.setLineDash([]); // reset dash
      });
    }

    // --- PART 2: DRAW PHYSICAL SOLID GLOBE (OCEAN & REALISTIC LANDMASSES) ---
    // Solid ocean body masking out everything behind the globe
    ctx.save();
    ctx.fillStyle = "rgba(22, 17, 14, 0.95)"; // Deep dark earth-950 tone
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Soft glowing radial ocean gradient to give realistic depth and volumetric feel
    const oceanGlow = ctx.createRadialGradient(center.x, center.y, radius * 0.35, center.x, center.y, radius);
    oceanGlow.addColorStop(0, "rgba(26, 36, 43, 0.75)"); // Oceanic subtle deep blue-gray
    oceanGlow.addColorStop(0.7, "rgba(35, 25, 20, 0.4)"); // Blends into warm earth tones
    oceanGlow.addColorStop(1, "rgba(22, 17, 14, 0.95)"); // Dark edge
    ctx.fillStyle = oceanGlow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Realistic Landmasses represented by a 3D projected dot-matrix
    LAND_POINTS.forEach((pt) => {
      const { cx, cy, depth } = project(pt.lat, pt.lng);
      if (depth > 0) {
        // Shading: alpha fades out near the horizon (Lambertian-like diffuse shading)
        const alpha = depth * 0.82 + 0.18;
        
        // Match specific realistic earth tones (Moss Green, Sand Beige, Polar Ice)
        let color = `rgba(105, 145, 77, ${alpha})`; // Temperate Moss Green (#69914d)
        
        if (pt.type === "ice") {
          color = `rgba(242, 235, 230, ${alpha})`; // Polar Snowy White (#f2ebe6)
        } else if (pt.type === "desert") {
          color = `rgba(192, 150, 80, ${alpha})`; // Desert Clay/Beige (#c09650)
        }

        ctx.fillStyle = color;

        // Dynamic dot sizing to simulate spherical curvature and perspective foreshortening
        // Dots are larger in the center (facing the camera) and compress/scale down near the curved edges
        const dotSize = Math.max(0.4, 1.4 * zoom * (depth * 0.65 + 0.35));

        ctx.beginPath();
        ctx.arc(cx, cy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // --- PART 2.5: D3-BASED HEATMAP LAYER (TECTONIC ACTIVITY OVER THE LAST 24 HOURS) ---
    if (filters.heatmap) {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Select tectonic events (earthquakes & volcanoes)
      const tectonicNodes = nodes.filter((node) => node.type === "earthquake" || node.type === "volcano");
      
      if (tectonicNodes.length > 0) {
        const latStep = 6; // finer grid for a smooth heatmap feel
        const lngStep = 6;
        const gridPoints: Array<{ lat: number; lng: number; density: number }> = [];

        for (let lat = -80; lat <= 80; lat += latStep) {
          for (let lng = -180; lng < 180; lng += lngStep) {
            let density = 0;

            tectonicNodes.forEach((node) => {
              const dLat = lat - node.lat;
              const dLng = lng - node.lng;
              const adjDLng = Math.abs(dLng) > 180 ? 360 - Math.abs(dLng) : Math.abs(dLng);
              const dist = Math.sqrt(dLat * dLat + adjDLng * adjDLng);

              // 28 degrees radius of influence (about 3100km)
              const radiusOfInfluence = 28;
              if (dist < radiusOfInfluence) {
                // Spherical distance decay kernel
                const kernelWeight = Math.pow(1 - dist / radiusOfInfluence, 2.2);

                // Magnitude weight
                let intensity = 1.0;
                if (node.type === "earthquake") {
                  const mag = node.magnitude || 4.0;
                  intensity = Math.pow(mag / 4.0, 2);
                } else if (node.type === "volcano") {
                  intensity = node.status === "critical" ? 2.5 : 1.25;
                }

                // Last 24 hours weighting
                const ageMs = now - new Date(node.timestamp).getTime();
                const recencyWeight = ageMs <= oneDayMs ? 1.0 : Math.max(0.15, 1.0 - (ageMs / (2.5 * oneDayMs)));

                density += kernelWeight * intensity * recencyWeight;
              }
            });

            if (density > 0.08) {
              gridPoints.push({ lat, lng, density });
            }
          }
        }

        if (gridPoints.length > 0) {
          const maxDensity = d3.max(gridPoints, (d) => d.density) || 1.0;

          // D3 scale to normalize density values
          const densityScale = d3.scaleLinear()
            .domain([0, maxDensity])
            .range([0, 1]);

          // D3 sequential scale mapping to deep geothermal/volcanic hues
          // Deep Red -> Vibrant Red -> Fire Orange -> Solar Yellow
          const colorScale = d3.scaleLinear<string>()
            .domain([0, maxDensity * 0.15, maxDensity * 0.55, maxDensity])
            .range(["#450a0a", "#dc2626", "#ea580c", "#fde047"]);

          gridPoints.forEach((pt) => {
            const { cx, cy, depth } = project(pt.lat, pt.lng);
            if (depth > 0.05) {
              const norm = densityScale(pt.density);
              const d3Color = d3.color(colorScale(pt.density));
              
              if (d3Color) {
                const rgb = d3Color.rgb();
                
                // Opacity fades with perspective near the horizon
                const horizonFade = depth;
                const baseOpacity = norm * 0.72 * horizonFade;
                
                const c0 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseOpacity})`;
                const c1 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseOpacity * 0.4})`;
                const c2 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`;

                // Size of glow ring scales with density value and zoom
                const glowRadius = Math.max(1.5, 9.5 * norm * zoom * (depth * 0.65 + 0.35));

                ctx.save();
                ctx.globalCompositeOperation = "screen";

                // Radial geothermic glow gradient
                const heatGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
                heatGlow.addColorStop(0, c0);
                heatGlow.addColorStop(0.35, c1);
                heatGlow.addColorStop(1, c2);

                ctx.fillStyle = heatGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          });
        }
      }
    }

    // --- PART 3: DRAW FRONT-FACING OVERLAYS (ON SURFACE OF GLOBE) ---
    if (filters.grid) {
      ctx.lineWidth = 0.5;

      // Front-facing parallels (Latitude lines)
      const lats = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
      lats.forEach((lat) => {
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 5) {
          const { cx, cy, depth } = project(lat, lng);
          if (depth > 0) {
            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            first = true; // start new segment
          }
        }
        ctx.strokeStyle = lat === 0 ? "rgba(234, 179, 8, 0.3)" : "rgba(180, 120, 70, 0.12)";
        ctx.stroke();
      });

      // Front-facing meridians (Longitude lines)
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 5) {
          const { cx, cy, depth } = project(lat, lng);
          if (depth > 0) {
            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = "rgba(180, 120, 70, 0.12)";
        ctx.stroke();
      }
    }

    if (filters.plates) {
      TECTONIC_PLATES.forEach((plate) => {
        // Front-facing boundaries
        ctx.beginPath();
        let first = true;
        plate.boundary.forEach((coord) => {
          const { cx, cy, depth } = project(coord.lat, coord.lng);
          if (depth > 0) {
            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            first = true;
          }
        });
        ctx.strokeStyle = `${plate.color}40`; // Neon low-opacity overlay
        ctx.lineWidth = 1.5;
        ctx.shadowColor = plate.color;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset blur
      });
    }

    // --- DRAW CONTINENTS & ISLAND OUTLINES & 3D PROJECTED INFO TAGS ---
    if (filters.continents) {
      ctx.save();
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]); // Clean dashed sci-fi outlines
      ctx.strokeStyle = "rgba(163, 230, 53, 0.4)"; // Moss Green high-contrast contour
      ctx.shadowColor = "rgba(163, 230, 53, 0.2)";
      ctx.shadowBlur = 2;

      Object.values(LAND_POLYGONS).forEach((poly) => {
        ctx.beginPath();
        let first = true;
        poly.forEach((coord) => {
          const { cx, cy, depth } = project(coord.lat, coord.lng);
          if (depth > 0) {
            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            first = true;
          }
        });
        ctx.stroke();
      });
      ctx.restore();

      // Render information tag overlays for major continents
      CONTINENTS_DATA.forEach((cont) => {
        const { cx, cy, depth } = project(cont.lat, cont.lng);
        // Only render labels when decently facing the viewer to prevent edge clutter
        if (depth > 0.15) {
          ctx.save();
          
          // Shading/opacity based on rotation angle (fades out as it moves to back hemisphere)
          const alpha = Math.min(1.0, (depth - 0.15) * 1.5);
          
          // Draw target node center
          ctx.fillStyle = `rgba(163, 230, 53, ${alpha * 0.95})`; // bright moss green
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Target reticle circular border
          ctx.strokeStyle = `rgba(163, 230, 53, ${alpha * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
          ctx.stroke();

          // Diagnostic extension leader/pointer line
          ctx.strokeStyle = `rgba(163, 230, 53, ${alpha * 0.4})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 12, cy - 9);
          ctx.lineTo(cx + 34, cy - 9);
          ctx.stroke();

          // Semi-translucent info box container
          ctx.fillStyle = `rgba(18, 14, 11, ${alpha * 0.88})`; // Extra deep earth brown/dark
          ctx.strokeStyle = `rgba(163, 230, 53, ${alpha * 0.5})`;
          ctx.lineWidth = 0.8;
          
          const labelText = cont.name;
          ctx.font = "bold 9px monospace";
          const labelWidth = ctx.measureText(labelText).width;
          const boxWidth = Math.max(82, labelWidth + 8);
          const boxHeight = 22;
          const bx = cx + 34;
          const by = cy - 19;

          // Capsule box
          ctx.beginPath();
          ctx.rect(bx, by, boxWidth, boxHeight);
          ctx.fill();
          ctx.stroke();

          // Draw neon label border accents
          ctx.fillStyle = `rgba(163, 230, 53, ${alpha * 0.8})`;
          ctx.fillRect(bx, by, 2.5, boxHeight); // Left accent bar

          // Print continent name
          ctx.fillStyle = `rgba(244, 244, 245, ${alpha})`; // Zinc-100
          ctx.font = "bold 8px monospace";
          ctx.fillText(labelText, bx + 6, by + 9);

          // Print plate classification subtext
          ctx.fillStyle = `rgba(163, 230, 53, ${alpha * 0.8})`;
          ctx.font = "7px monospace";
          ctx.fillText(cont.code, bx + 6, by + 18);

          ctx.restore();
        }
      });
    }

    // --- DRAW GLOBE BOUNDARY/HORIZON RING ---
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
    ctx.shadowColor = "rgba(217, 119, 6, 0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Outer cosmetic scanner ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(217, 119, 6, 0.15)";
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Scan Reticle ticks on outer rim
    ctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
    ctx.lineWidth = 2;
    // Top tick
    ctx.beginPath(); ctx.moveTo(center.x, center.y - radius - 12); ctx.lineTo(center.x, center.y - radius - 4); ctx.stroke();
    // Bottom tick
    ctx.beginPath(); ctx.moveTo(center.x, center.y + radius + 4); ctx.lineTo(center.x, center.y + radius + 12); ctx.stroke();
    // Left tick
    ctx.beginPath(); ctx.moveTo(center.x - radius - 12, center.y); ctx.lineTo(center.x - radius - 4, center.y); ctx.stroke();
    // Right tick
    ctx.beginPath(); ctx.moveTo(center.x + radius + 4, center.y); ctx.lineTo(center.x + radius + 12, center.y); ctx.stroke();

    // --- DRAW GEOLOGICAL NODES ---
    nodes.forEach((node) => {
      // Skip rendering if filtered out
      if (node.type === "earthquake" && !filters.earthquakes) return;
      if (node.type === "volcano" && !filters.volcanoes) return;
      if (node.type === "mineral" && !filters.minerals) return;

      const { cx, cy, depth } = project(node.lat, node.lng);

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Visibility scales
      const opacity = depth > 0 ? 1 : 0.2;
      const glowScale = 1 + (isSelected ? Math.abs(pVal) * 0.4 : 0);

      ctx.save();
      ctx.globalAlpha = opacity;

      if (node.type === "earthquake") {
        // --- EARTHQUAKE NODE (Pulsing glowing expanding circles with depth-based color coding) ---
        const mag = node.magnitude || 5.0;
        const ndepth = node.depth || 10;
        
        // Depth colorization mapping: 
        // - Ultra-shallow (<10km) = Warm Gold
        // - Shallow (10km - 35km) = Bright Amber
        // - Medium (35km - 100km) = Deep Orange
        // - Deep (>100km) = Terracotta Red
        let color = "rgba(245, 158, 11, "; // amber
        let strokeColor = "#f59e0b";
        if (ndepth < 10) {
          color = "rgba(253, 224, 71, "; // gold-300
          strokeColor = "#fde047";
        } else if (ndepth > 35 && ndepth <= 100) {
          color = "rgba(234, 88, 12, "; // terra-600
          strokeColor = "#ea580c";
        } else if (ndepth > 100) {
          color = "rgba(220, 38, 38, "; // red-600
          strokeColor = "#dc2626";
        }

        const rMax = mag * 3;

        // Draw core node point
        ctx.fillStyle = `${color}${depth > 0 ? "1.0" : "0.4"})`;
        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Expanding seismic shockwaves (if front facing or selected)
        if (depth > 0 || isSelected) {
          ctx.strokeStyle = `${color}${depth > 0 ? 0.6 - (pulseRef.current / (Math.PI * 2)) : 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, (pulseRef.current / (Math.PI * 2)) * rMax * 2.5 * glowScale, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `${color}${depth > 0 ? 0.3 - (pulseRef.current / (Math.PI * 2)) : 0.08})`;
          ctx.beginPath();
          ctx.arc(cx, cy, ((pulseRef.current + Math.PI) % (Math.PI * 2)) / (Math.PI * 2) * rMax * 2.5 * glowScale, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Highlight ring if hovered or selected
        if (isHovered || isSelected) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, isSelected ? 8 : 6, 0, Math.PI * 2);
          ctx.stroke();
        }

      } else if (node.type === "volcano") {
        // --- VOLCANO NODE (Glowing Triangle) ---
        const color = node.status === "critical" ? "#ef4444" : "#f97316";
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Draw Triangle
        const size = isSelected ? 8 : 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx - size, cy + size * 0.8);
        ctx.lineTo(cx + size, cy + size * 0.8);
        ctx.closePath();

        if (depth > 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = isSelected ? 12 : 6;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        } else {
          ctx.stroke();
        }

        // Pulse warning halo
        if ((node.status === "critical" || isSelected) && depth > 0) {
          ctx.strokeStyle = `${color}50`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy + 2, (12 + Math.sin(pulseRef.current * 2) * 4) * glowScale, 0, Math.PI * 2);
          ctx.stroke();
        }

      } else if (node.type === "mineral") {
        // --- MINERAL DEPOSIT (Diamond Shape) ---
        let color = "#10b981"; // default green (emerald)
        if (node.mineralType === "gold") color = "#fbbf24"; // gold yellow
        if (node.mineralType === "lithium") color = "#a855f7"; // purple lithium
        if (node.mineralType === "uranium") color = "#22c55e"; // bright neon green
        if (node.mineralType === "platinum") color = "#e2e8f0"; // platinum slate

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Draw Diamond
        const size = isSelected ? 7 : 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();

        if (depth > 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = isSelected ? 10 : 5;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.stroke();
        }
      }

      // Selected Node Lock-on Reticle
      if (isSelected && depth > 0) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1;
        // Rotating bracket style
        const bracketAngle = pulseRef.current;
        const bracketSize = 14;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(bracketAngle);
        ctx.beginPath();
        // Top-left
        ctx.moveTo(-bracketSize, -bracketSize + 4);
        ctx.lineTo(-bracketSize, -bracketSize);
        ctx.lineTo(-bracketSize + 4, -bracketSize);
        // Top-right
        ctx.moveTo(bracketSize - 4, -bracketSize);
        ctx.lineTo(bracketSize, -bracketSize);
        ctx.lineTo(bracketSize, -bracketSize + 4);
        // Bottom-right
        ctx.moveTo(bracketSize, bracketSize - 4);
        ctx.lineTo(bracketSize, bracketSize);
        ctx.lineTo(bracketSize - 4, bracketSize);
        // Bottom-left
        ctx.moveTo(-bracketSize + 4, bracketSize);
        ctx.lineTo(-bracketSize, bracketSize);
        ctx.lineTo(-bracketSize, bracketSize - 4);
        ctx.stroke();
        ctx.restore();

        // Cosmetic locked line
        ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 25, cy - 25);
        ctx.lineTo(cx + 45, cy - 25);
        ctx.stroke();

        ctx.fillStyle = "#f59e0b";
        ctx.font = "8px monospace";
        ctx.fillText("LOCK ACTIVE", cx + 27, cy - 29);
      }

      ctx.restore();
    });

  }, [dimensions, rotationX, rotationY, zoom, nodes, selectedNode, hoveredNode, filters]);

  // Request continuous frames for pulsing animations
  useEffect(() => {
    let animId: number;
    const loop = () => {
      // Force trigger re-render of canvas by incrementing animation reference values
      pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);
      const canvas = canvasRef.current;
      if (canvas) {
        // Simple trick to trigger re-paint loop
        setRotationX((r) => r);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- MOUSE & TOUCH EVENT HANDLERS FOR DRAGGING ---
  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    prevMouseX.current = clientX;
    prevMouseY.current = clientY;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) {
      // Mouse move hover checks
      checkHoverState(clientX, clientY);
      return;
    }

    const deltaX = clientX - prevMouseX.current;
    const deltaY = clientY - prevMouseY.current;

    setRotationY((prev) => (prev + deltaX * 0.007) % (Math.PI * 2));
    setRotationX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev - deltaY * 0.007)));

    prevMouseX.current = clientX;
    prevMouseY.current = clientY;
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const checkHoverState = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const width = dimensions.width;
    const height = dimensions.height;
    const center = { x: width / 2, y: height / 2 };
    const radius = (Math.min(width, height) / 2 - 20) * zoom;

    // Check if hovered any node
    let found: GeologicalNode | null = null;
    let minDistance = 15; // click/hover radius threshold in pixels

    nodes.forEach((node) => {
      if (node.type === "earthquake" && !filters.earthquakes) return;
      if (node.type === "volcano" && !filters.volcanoes) return;
      if (node.type === "mineral" && !filters.minerals) return;

      const latRad = node.lat * (Math.PI / 180);
      const lngRad = node.lng * (Math.PI / 180);

      // Sphere to rotated 3D Cartesian
      const nx = Math.cos(latRad) * Math.cos(lngRad);
      const ny = Math.sin(latRad);
      const nz = Math.cos(latRad) * Math.sin(lngRad);

      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x1 = nx * cosY - nz * sinY;
      const z1 = nx * sinY + nz * cosY;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y2 = ny * cosX - z1 * sinX;
      const z2 = ny * sinX + z1 * cosX;

      // Only selectable on the front hemisphere
      if (z2 > 0) {
        const cx = center.x + x1 * radius;
        const cy = center.y - y2 * radius;

        const distance = Math.hypot(x - cx, y - cy);
        if (distance < minDistance) {
          minDistance = distance;
          found = node;
        }
      }
    });

    setHoveredNode(found);
  };

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    // If we dragged quite a lot, don't trigger click selection
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    checkHoverState(e.clientX, e.clientY);
    if (hoveredNode) {
      onSelectNode(hoveredNode);
    } else {
      // Clear selection if clicked blank space on globe
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const distToCenter = Math.hypot(x - dimensions.width / 2, y - dimensions.height / 2);
      if (distToCenter > (dimensions.width / 2 - 30) * zoom) {
        // clicked outside globe boundaries
      } else {
        onSelectNode(null);
      }
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div id="globe_viewport_container" className="flex flex-col items-center justify-between h-full w-full relative">
      {/* Globe Top HUD indicators */}
      <div id="globe_hud_header" className="absolute top-2 left-4 right-4 flex items-center justify-between text-xs font-mono text-sand-500 select-none pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-earth-950/80 border border-earth-800/80 px-2 py-1 rounded shadow">
          <Globe className={`w-3.5 h-3.5 text-sand-500 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '20s' }} />
          <span>CRUST-MATRIX GLOBE: ACTIVE</span>
        </div>
        <div className="bg-earth-950/80 border border-earth-800/80 px-2 py-1 rounded shadow flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-moss-500 rounded-full animate-ping" />
          <span>SYS_FEED_SYNCED: OK</span>
        </div>
      </div>

      {/* Main Canvas rendering container */}
      <div
        ref={containerRef}
        id="globe_canvas_container"
        className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden relative"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEnd}
          onClick={handleClick}
          className="max-w-full max-h-full block transition-transform duration-200"
        />

        {/* Floating Node Tooltip HUD */}
        {hoveredNode && (
          <div
            id="node_floating_tooltip"
            className="absolute bottom-16 bg-earth-950/95 border border-sand-500/60 p-2.5 rounded shadow-xl max-w-[280px] text-xs font-mono select-none pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-20"
          >
            <div className="flex items-center gap-1.5 font-bold border-b border-earth-800 pb-1.5 mb-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hoveredNode.type === "earthquake"
                    ? "bg-sand-500"
                    : hoveredNode.type === "volcano"
                    ? "bg-terra-500"
                    : "bg-moss-400"
                }`}
              />
              <span className="text-sand-100 uppercase truncate">
                {hoveredNode.name}
              </span>
            </div>
            <div className="space-y-0.5 text-earth-300">
              <div className="flex justify-between">
                <span>TYPE:</span>
                <span className="text-sand-500 uppercase font-bold">{hoveredNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span>COORDS:</span>
                <span className="text-earth-100">
                  {hoveredNode.lat.toFixed(2)}°, {hoveredNode.lng.toFixed(2)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span>DEPTH:</span>
                <span className="text-sand-500">{hoveredNode.depth} km</span>
              </div>
              {hoveredNode.type === "earthquake" && (
                <div className="flex justify-between font-bold">
                  <span>MAGNITUDE:</span>
                  <span className="text-red-400">{hoveredNode.magnitude} Richter</span>
                </div>
              )}
              {hoveredNode.type === "mineral" && (
                <div className="flex justify-between font-bold">
                  <span>ORE YIELD:</span>
                  <span className="text-moss-400 capitalize">{hoveredNode.mineralType}</span>
                </div>
              )}
              {hoveredNode.type === "volcano" && (
                <div className="flex justify-between font-bold">
                  <span>ALERT STATE:</span>
                  <span className={hoveredNode.status === "critical" ? "text-red-500 animate-pulse" : "text-terra-400"}>
                    {hoveredNode.status?.toUpperCase() || "ACTIVE"}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-1.5 text-[10px] text-sand-500 text-center animate-pulse border-t border-earth-800/80 pt-1">
              CLICK TO LOCK-ON DIAGNOSTICS
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div id="globe_bottom_controls" className="w-full bg-earth-950/90 border-t border-earth-900 px-4 py-2 flex items-center justify-between gap-4 z-10 font-mono text-xs text-earth-300">
        {/* Rotation switch */}
        <button
          id="btn_rotation_toggle"
          onClick={() => setIsRotating((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition cursor-pointer ${
            isRotating
              ? "bg-terra-950/50 border border-sand-500/40 text-sand-300"
              : "bg-earth-900 border border-earth-800 hover:bg-earth-850 hover:text-earth-200"
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} style={{ animationDuration: '4s' }} />
          <span>{isRotating ? "ROTATION: AUTO" : "ROTATION: MAN"}</span>
        </button>

        {/* Lat/Lng readout */}
        <div id="coordinate_readout" className="hidden sm:flex flex-col text-right">
          <span className="text-[10px] text-earth-400">SURVEYOR HEADING</span>
          <span className="text-sand-500/90 text-xs">
            PITCH: {((rotationX * 180) / Math.PI).toFixed(0)}° | YAW: {((rotationY * 180) / Math.PI).toFixed(0)}°
          </span>
        </div>

        {/* Zoom controls */}
        <div id="zoom_slider_panel" className="flex items-center gap-2">
          <Minimize2 className="w-3.5 h-3.5 text-earth-400" />
          <input
            id="slider_globe_zoom"
            type="range"
            min="0.6"
            max="1.6"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 sm:w-28 accent-sand-500 bg-earth-800 h-1 rounded cursor-pointer"
          />
          <Maximize2 className="w-3.5 h-3.5 text-earth-400" />
        </div>
      </div>
    </div>
  );
}
