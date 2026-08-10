/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { GeologicalNode } from "./types";
import { INITIAL_NODES } from "./data";
import SurveyFeed from "./components/SurveyFeed";
import CrustMatrixGlobe from "./components/CrustMatrixGlobe";
import DeepStrataScan from "./components/DeepStrataScan";
import MantleMindChat from "./components/MantleMindChat";
import { Radio, Calendar, Info, ShieldAlert, Thermometer, Database, Plus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Application Data States
  const [nodes, setNodes] = useState<GeologicalNode[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<GeologicalNode | null>(null);
  const [sessionHistory, setSessionHistory] = useState<GeologicalNode[]>([]);

  // Filter States for both Globe and Sidebar Feed
  const [filters, setFilters] = useState({
    earthquakes: true,
    volcanoes: true,
    minerals: true,
    plates: true,
    grid: true,
    continents: true,
    heatmap: true,
  });

  // Communication between DeepStrata and MantleMind Chat
  const [externalPrompt, setExternalPrompt] = useState<string>("");

  // System Time State (Dynamic Clock)
  const [systemTime, setSystemTime] = useState<string>("");

  // Notification overlay state when a new simulated event occurs
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  // USGS Webhook Feed Live States
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const [usgsCount, setUsgsCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(60000); // 30000, 60000, or 300000

  // Live USGS Earthquake Webhook Syncing Function
  const fetchUSGSEarthquakes = async (quiet = false) => {
    if (!quiet) setIsSyncing(true);
    try {
      const response = await fetch(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
      );
      if (!response.ok) throw new Error("USGS server responded with error code");
      const geoJson = await response.json();
      const features = geoJson.features || [];

      // Convert USGS features to GeologicalNode objects
      const liveQuakes: GeologicalNode[] = features.map((feat: any) => {
        const props = feat.properties;
        const geom = feat.geometry;
        const mag = props.mag || 2.5;
        const lon = geom.coordinates[0];
        const lat = geom.coordinates[1];
        const rawDepth = geom.coordinates[2] || 10;

        return {
          id: `usgs-${feat.id || Math.random().toString(36).substr(2, 9)}`,
          type: "earthquake",
          name: props.title ? props.title.replace(/^M\s*\d+(\.\d+)?\s*-\s*/i, "") : `M${mag.toFixed(1)} Rupture`,
          lat: lat,
          lng: lon,
          depth: parseFloat(rawDepth.toFixed(1)),
          magnitude: parseFloat(mag.toFixed(1)),
          status: mag >= 6.0 ? "critical" : mag >= 4.5 ? "pulsing" : "active",
          timestamp: new Date(props.time || Date.now()).toISOString(),
          details: `Real-time USGS Seismic Webhook alert. Event localized at: "${props.place || "Unclassified Oceanic Margin"}". Richter Magnitude: ${mag.toFixed(1)} Mw. Crustal Depth: ${rawDepth.toFixed(1)} km. Feed source: USGS.gov network station.`
        };
      });

      // Filter out only magnitude >= 2.5 to maintain peak rendering performance
      const filteredQuakes = liveQuakes.filter((q) => q.magnitude && q.magnitude >= 2.5);

      setNodes((prev) => {
        // Keep non-earthquake items from INITIAL_NODES (volcanoes, minerals)
        const baseStaticNodes = INITIAL_NODES.filter((n) => n.type !== "earthquake");
        
        // Remove any old USGS nodes from previous syncs to prevent duplicates, but keep active simulations
        const currentSimulatedOnly = prev.filter(
          (n) => n.type !== "earthquake" || n.id.startsWith("sim-")
        );
        
        // Return live quakes prepended, plus any active simulations and all base static volcano/mineral nodes
        const finalNodes = [...filteredQuakes, ...currentSimulatedOnly.filter((n) => n.type === "earthquake"), ...baseStaticNodes];
        return finalNodes;
      });

      setUsgsCount(filteredQuakes.length);
      setIsLiveSynced(true);
      
      if (!quiet) {
        setAlertNotification(`SYNC COMPLETE: INGESTED ${filteredQuakes.length} REAL-TIME EVENT FEEDS`);
        setTimeout(() => setAlertNotification(null), 4000);
      }
    } catch (err) {
      console.error("USGS connection pipeline error, defaulting to local simulated nodes:", err);
      setIsLiveSynced(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Run live USGS Webhook sync on component mount and auto-refresh dynamically based on frequency selection
  useEffect(() => {
    fetchUSGSEarthquakes(true);
    const syncInterval = setInterval(() => {
      fetchUSGSEarthquakes(true);
    }, refreshIntervalMs);
    return () => clearInterval(syncInterval);
  }, [refreshIntervalMs]);

  // Update Dynamic Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Layer/Filter Toggles
  const handleToggleFilter = (key: 'earthquakes' | 'volcanoes' | 'minerals' | 'plates' | 'grid' | 'continents' | 'heatmap') => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Select a geological node
  const handleSelectNode = (node: GeologicalNode | null) => {
    setSelectedNode(node);
  };

  // Inject Strata Sample into MantleMind chat
  const handleSelectedLayerMsg = (msg: string) => {
    setExternalPrompt(msg);
  };

  // Action: Simulate a brand-new live tectonic pulse
  const handleSimulatePulseEvent = () => {
    const eventTypes: Array<"earthquake" | "volcano" | "mineral"> = [
      "earthquake",
      "volcano",
      "mineral",
    ];
    const chosenType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    // Random coordinates centered on active regions
    const hotpots = [
      { name: "Ring of Fire Segment [Mariana Trench]", lat: 11.349, lng: 142.199 },
      { name: "Sunda subduction zone Segment", lat: -8.243, lng: 115.151 },
      { name: "Reykjanes Hydrothermal Trench", lat: 63.842, lng: -22.451 },
      { name: "Andean Volcanic Arc [Chile]", lat: -33.448, lng: -70.669 },
      { name: "Cascadia subduction zone Megathrust", lat: 48.428, lng: -125.331 },
    ];
    const spot = hotpots[Math.floor(Math.random() * hotpots.length)];

    let newNode: GeologicalNode;
    const uid = `sim-${Date.now()}`;

    if (chosenType === "earthquake") {
      const mag = parseFloat((5.5 + Math.random() * 3.2).toFixed(1));
      newNode = {
        id: uid,
        type: "earthquake",
        name: `${spot.name} - M${mag} Pulse`,
        lat: spot.lat + (Math.random() - 0.5) * 2,
        lng: spot.lng + (Math.random() - 0.5) * 2,
        depth: Math.floor(10 + Math.random() * 80),
        magnitude: mag,
        status: mag > 7.2 ? "critical" : "pulsing",
        timestamp: new Date().toISOString(),
        details: `Simulated high-frequency seismic rupture. Elastic strain energy release event registered on standard lithospheric arrays.`
      };
    } else if (chosenType === "volcano") {
      newNode = {
        id: uid,
        type: "volcano",
        name: `${spot.name.split(" ")[0]} Magma Vent`,
        lat: spot.lat + (Math.random() - 0.5) * 1.5,
        lng: spot.lng + (Math.random() - 0.5) * 1.5,
        depth: Math.floor(2 + Math.random() * 12),
        status: Math.random() > 0.5 ? "critical" : "active",
        timestamp: new Date().toISOString(),
        details: `Eruptive micro-gas emission detected. Thermal imaging scans indicate magma chamber expansion and elevated sulfur dioxide levels.`
      };
    } else {
      const minerals: Array<{ name: string; type: "gold" | "lithium" | "copper" | "platinum" | "rare_earth" | "uranium" }> = [
        { name: "Lithium Crystal Cluster", type: "lithium" },
        { name: "Deep Gold Hydrothermal Vein", type: "gold" },
        { name: "Rare Earth Carbonatite Dyke", type: "rare_earth" },
        { name: "High-grade Pitchblende Ore", type: "uranium" },
      ];
      const ore = minerals[Math.floor(Math.random() * minerals.length)];
      newNode = {
        id: uid,
        type: "mineral",
        name: ore.name,
        lat: spot.lat + (Math.random() - 0.5) * 3,
        lng: spot.lng + (Math.random() - 0.5) * 3,
        depth: parseFloat((0.2 + Math.random() * 4).toFixed(1)),
        value: "Unmapped Core Vein",
        mineralType: ore.type,
        timestamp: new Date().toISOString(),
        details: `Subterranean scans completed. Identified heavy concentration of ${ore.type} crystalline structures at shallow depths.`
      };
    }

    setNodes((prev) => [newNode, ...prev]);
    setSessionHistory((prev) => [newNode, ...prev].slice(0, 10));
    setSelectedNode(newNode); // Automatically lock-on globe coordinates to simulated event
    setAlertNotification(`LITHOSPHERIC SIGNAL CAPTURED: ${newNode.name}`);

    // Fade alert notification after 5 seconds
    setTimeout(() => {
      setAlertNotification(null);
    }, 5000);
  };

  return (
    <div id="root_app_container" className="min-h-screen bg-earth-950 text-sand-100 flex flex-col font-mono relative overflow-x-hidden selection:bg-terra-950 selection:text-sand-400">
      
      {/* Dynamic Grid Overlay (Warm Earthy Sand Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,60,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,90,60,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* --- MAIN HEADER PANEL --- */}
      <header id="main_dashboard_header" className="relative z-10 border-b border-earth-900 bg-earth-950/85 backdrop-blur-md px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        {/* Branding Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-terra-700 to-terra-600 rounded flex items-center justify-center shadow shadow-sand-500/10">
            <Radio className="w-5 h-5 text-sand-100 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-sand-100">
                GEOPULSE ENGINE
              </h1>
              <span className="text-[10px] bg-terra-950 border border-sand-500/30 text-sand-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-earth-300 tracking-wide">
              LITHOSPHERE SURVEYOR & DEEP STRATA RECONNAISSANCE GRID
            </p>
          </div>
        </div>

        {/* Global Live Tectonic Anomaly Tickers & Clock */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 self-start md:self-auto">
          {/* Clock */}
          <div className="flex items-center gap-1.5 bg-earth-900 border border-earth-850 rounded px-2.5 py-1 text-[11px] text-sand-400">
            <Calendar className="w-3.5 h-3.5 text-earth-400" />
            <span>{systemTime || "LOADING SYSTEM TIME..."}</span>
          </div>

          {/* Core Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-earth-900 border border-earth-850 rounded px-2.5 py-1 text-[11px] text-earth-300">
            <Database className="w-3.5 h-3.5 text-earth-400" />
            <span>DB_CORES: <strong className="text-moss-500">ONLINE</strong></span>
          </div>

          {/* USGS Webhook Feed Status Button */}
          <button
            id="btn_usgs_webhook_sync"
            onClick={() => fetchUSGSEarthquakes()}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[11px] transition cursor-pointer select-none ${
              isLiveSynced
                ? "bg-earth-900 border-moss-500/30 text-moss-400 hover:bg-earth-850"
                : "bg-red-950/90 border-red-500 text-red-200 hover:bg-red-900 hover:text-white hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse transition-all duration-300 font-black"
            }`}
            title="Click to force-sync real USGS earthquake webhooks"
          >
            {isLiveSynced ? (
              <Wifi className={`w-3.5 h-3.5 ${isSyncing ? "animate-pulse" : "text-moss-400"}`} />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-200" />
            )}
            <span>
              USGS_FEED:{" "}
              <strong className={isLiveSynced ? "text-sand-400 font-bold" : "text-red-100 font-black"}>
                {isSyncing ? "SYNCING..." : isLiveSynced ? `${usgsCount} EVENTS` : "OFFLINE"}
              </strong>
            </span>
            <motion.span
              animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isSyncing
                  ? { repeat: Infinity, ease: "linear", duration: 1.2 }
                  : { duration: 0.2 }
              }
              className="inline-flex shrink-0 ml-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLiveSynced ? "text-earth-400" : "text-red-300"} hover:text-white`} />
            </motion.span>
          </button>

          {/* USGS Refresh Frequency Dropdown */}
          <div className="flex items-center gap-1.5 bg-earth-900 border border-earth-850 hover:border-earth-800 rounded px-2.5 py-1 text-[11px] text-earth-300 transition">
            <span className="text-earth-400 font-bold select-none text-[10px]">AUTO_REFRESH:</span>
            <select
              id="select_usgs_refresh_rate"
              value={refreshIntervalMs}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRefreshIntervalMs(val);
                let label = "60 seconds";
                if (val === 30000) label = "30 seconds";
                if (val === 300000) label = "5 minutes";
                setAlertNotification(`FREQUENCY MODIFIED: AUTO-POLLING EACH ${label.toUpperCase()}`);
                setTimeout(() => setAlertNotification(null), 4000);
              }}
              className="bg-transparent border-none text-sand-400 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value={30000} className="bg-earth-950 text-sand-400 font-mono">30s</option>
              <option value={60000} className="bg-earth-950 text-sand-400 font-mono">60s</option>
              <option value={300000} className="bg-earth-950 text-sand-400 font-mono">5m</option>
            </select>
          </div>

          {/* Simulate Action Button */}
          <button
            id="btn_simulate_pulse_event"
            onClick={handleSimulatePulseEvent}
            className="bg-gradient-to-r from-terra-700 to-terra-600 hover:from-terra-600 hover:to-terra-500 text-sand-100 font-bold px-3.5 py-1.5 rounded text-xs transition duration-200 flex items-center gap-1.5 shadow-lg shadow-sand-500/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sand-100 font-bold" />
            <span>SIMULATE TECTONIC PULSE</span>
          </button>
        </div>
      </header>

      {/* --- LIVE SEISMIC NOTIFICATION POPUP --- */}
      {alertNotification && (
        <div
          id="alert_notification_overlay"
          className="absolute top-20 left-1/2 -translate-x-1/2 bg-earth-950 border-2 border-terra-600/80 p-3 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90%] w-[420px]"
        >
          <div className="w-7 h-7 bg-terra-950/50 border border-terra-800 rounded-full flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-sand-500 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] text-sand-500 font-bold uppercase tracking-widest">GRID SENSORS DETECTED PULSE</span>
            <span className="block text-earth-100 text-xs font-bold truncate mt-0.5">{alertNotification.replace("LITHOSPHERIC SIGNAL CAPTURED: ", "")}</span>
          </div>
          <button
            onClick={() => setAlertNotification(null)}
            className="text-earth-400 hover:text-earth-200 text-xs px-1.5 py-0.5 border border-earth-850 rounded"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* --- MAIN BENTO CONTENT GRID --- */}
      <main id="main_dashboard_bento_grid" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 z-10 relative">
        
        {/* SIDEBAR: Survey Incident Feed (Alarms) */}
        <section id="sidebar_feed_section" className="col-span-1 lg:col-span-3 h-[420px] lg:h-auto flex flex-col">
          <SurveyFeed
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            filters={filters}
            onToggleFilter={handleToggleFilter}
            sessionHistory={sessionHistory}
          />
        </section>

        {/* CENTER: CrustMatrix 3D interactive Globe Visualizer */}
        <section id="globe_visualizer_section" className="col-span-1 lg:col-span-5 h-[500px] lg:h-auto bg-earth-950/45 border border-earth-900 rounded-lg flex flex-col p-3 relative overflow-hidden">
          {/* Globe Quick Legend Filters */}
          <div className="absolute top-16 left-4 flex flex-col gap-1.5 z-20 bg-earth-950/90 border border-earth-900 p-2.5 rounded font-mono text-[10px] text-earth-300 select-none">
            <div className="text-[9px] text-earth-400 font-black border-b border-earth-900 pb-1 mb-1 uppercase">GRID RECON FILTERS</div>
            <button
              onClick={() => handleToggleFilter("heatmap")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.heatmap ? "text-orange-400 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.heatmap ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-earth-800"}`} />
              <span>D3 Activity Heatmap</span>
            </button>
            <button
              onClick={() => handleToggleFilter("continents")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.continents ? "text-moss-400 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.continents ? "bg-moss-400" : "bg-earth-800"}`} />
              <span>Continents Overlay</span>
            </button>
            <button
              onClick={() => handleToggleFilter("plates")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.plates ? "text-terra-600 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.plates ? "bg-terra-600" : "bg-earth-800"}`} />
              <span>Plates boundaries</span>
            </button>
            <button
              onClick={() => handleToggleFilter("grid")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.grid ? "text-sand-400 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.grid ? "bg-sand-400" : "bg-earth-800"}`} />
              <span>Grid Meridians</span>
            </button>
            <button
              onClick={() => handleToggleFilter("earthquakes")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.earthquakes ? "text-terra-400 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.earthquakes ? "bg-terra-400" : "bg-earth-800"}`} />
              <span>Seismic Sensors</span>
            </button>
            <button
              onClick={() => handleToggleFilter("volcanoes")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.volcanoes ? "text-sand-500 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.volcanoes ? "bg-sand-500" : "bg-earth-800"}`} />
              <span>Volcanic Chimneys</span>
            </button>
            <button
              onClick={() => handleToggleFilter("minerals")}
              className={`flex items-center gap-1.5 transition text-left cursor-pointer ${filters.minerals ? "text-moss-400 font-bold" : "text-earth-500"}`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.minerals ? "bg-moss-400" : "bg-earth-800"}`} />
              <span>Mineral Ore-VEINS</span>
            </button>
          </div>

          {/* Interactive Globe component */}
          <div className="flex-1 w-full flex items-center justify-center">
            <CrustMatrixGlobe
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              filters={filters}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: Earth Strata model & MantleMind AI copilot */}
        <section id="right_diagnostics_section" className="col-span-1 lg:col-span-4 flex flex-col gap-4">
          
          {/* Top Panel: Interactive Earth Strata core scanner */}
          <div className="flex-1 min-h-[280px]">
            <DeepStrataScan onSelectedLayerMsg={handleSelectedLayerMsg} />
          </div>

          {/* Bottom Panel: MantleMind AI Co-Pilot chat */}
          <div className="flex-1 min-h-[350px]">
            <MantleMindChat
              selectedNode={selectedNode}
              onClearNodeSelection={() => setSelectedNode(null)}
              externalPrompt={externalPrompt}
              onClearExternalPrompt={() => setExternalPrompt("")}
            />
          </div>

        </section>

      </main>

      {/* --- DASHBOARD QUICK GUIDE BANNER (HTML IDs guideline compatible) --- */}
      <footer id="dashboard_guide_footer" className="relative z-10 border-t border-earth-900 bg-earth-950 px-6 py-2 flex flex-col md:flex-row justify-between items-center text-[10px] text-earth-400 gap-2 select-none">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-earth-500 shrink-0" />
          <span>INSTRUCTIONS: DRAG globe to rotate coordinates. SCROLL or slider to zoom. CLICK any blinking incident to lock telemetry scans.</span>
        </div>
        <span>GeoPulse Surveyor Suite • Compiled successfully</span>
      </footer>

    </div>
  );
}
