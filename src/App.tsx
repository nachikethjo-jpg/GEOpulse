/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { EarthquakeFeedResponse, GeologicalNode } from "./types";
import { INITIAL_NODES } from "./data";
import SurveyFeed from "./components/SurveyFeed";
import CrustMatrixGlobe from "./components/CrustMatrixGlobe";
import DeepStrataScan from "./components/DeepStrataScan";
import MantleMindChat from "./components/MantleMindChat";
import { Radio, Calendar, Info, ShieldAlert, Thermometer, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { motion } from "motion/react";

const REFERENCE_NODES: GeologicalNode[] = INITIAL_NODES
  .filter((node) => node.type !== "earthquake")
  .map((node) => ({ ...node, dataKind: "reference" }));

export default function App() {
  // Application Data States
  const [nodes, setNodes] = useState<GeologicalNode[]>(REFERENCE_NODES);
  const [selectedNode, setSelectedNode] = useState<GeologicalNode | null>(null);

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

  // Notification overlay for manual feed refreshes and refresh-rate changes
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  // Server-proxied USGS polling feed state
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const [usgsCount, setUsgsCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(60000); // 30000, 60000, or 300000
  const [lastRetrievedAt, setLastRetrievedAt] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Refresh normalized USGS observations through the application server
  const fetchUSGSEarthquakes = async (quiet = false) => {
    if (!quiet) setIsSyncing(true);
    try {
      const response = await fetch("/api/earthquakes", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "USGS feed request failed");
      const feed = data as EarthquakeFeedResponse;

      setNodes([...feed.nodes, ...REFERENCE_NODES]);
      setUsgsCount(feed.nodes.length);
      setIsLiveSynced(true);
      setLastRetrievedAt(feed.source.retrievedAt);
      setFeedError(null);
      
      if (!quiet) {
        setAlertNotification(`SYNC COMPLETE: INGESTED ${feed.nodes.length} USGS OBSERVATIONS`);
        setTimeout(() => setAlertNotification(null), 4000);
      }
    } catch (err) {
      console.error("USGS connection pipeline error:", err);
      setIsLiveSynced(false);
      setFeedError(err instanceof Error ? err.message : "USGS feed unavailable");
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on mount and auto-refresh at the selected frequency
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
              <span className={`text-[10px] border px-1.5 py-0.5 rounded font-bold ${isLiveSynced ? "bg-moss-950 border-moss-500/40 text-moss-400" : "bg-red-950 border-red-500/40 text-red-300"}`}>
                {isLiveSynced ? "USGS CONNECTED" : "FEED OFFLINE"}
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

          {/* USGS polling feed status button */}
          <button
            id="btn_usgs_webhook_sync"
            onClick={() => fetchUSGSEarthquakes()}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[11px] transition cursor-pointer select-none ${
              isLiveSynced
                ? "bg-earth-900 border-moss-500/30 text-moss-400 hover:bg-earth-850"
                : "bg-red-950/90 border-red-500 text-red-200 hover:bg-red-900 hover:text-white hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse transition-all duration-300 font-black"
            }`}
            title="Refresh the server-proxied USGS earthquake feed"
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

        </div>
      </header>

      <div className="relative z-10 border-b border-sand-700/40 bg-sand-950/40 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono">
        <span className="text-sand-300">
          <strong>DATA NOTICE:</strong> Earthquakes are preliminary USGS observations. Volcano and mineral layers are labeled reference data. This is not official emergency guidance.
        </span>
        <span className={feedError ? "text-red-300" : "text-earth-400"}>
          {feedError ? `SOURCE ERROR: ${feedError}` : lastRetrievedAt ? `RETRIEVED ${new Date(lastRetrievedAt).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC` : "AWAITING FIRST SOURCE UPDATE"}
        </span>
      </div>

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
          <span>GeoPulse Surveyor Suite • Observations may be delayed or revised</span>
      </footer>

    </div>
  );
}
