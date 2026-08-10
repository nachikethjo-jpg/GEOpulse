/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { GeologicalNode, NodeType } from "../types";
import { Search, ShieldAlert, Activity, Hammer, SlidersHorizontal, ArrowUpDown } from "lucide-react";

interface FeedProps {
  nodes: GeologicalNode[];
  selectedNode: GeologicalNode | null;
  onSelectNode: (node: GeologicalNode | null) => void;
  filters: {
    earthquakes: boolean;
    volcanoes: boolean;
    minerals: boolean;
  };
  onToggleFilter: (key: 'earthquakes' | 'volcanoes' | 'minerals') => void;
  sessionHistory: GeologicalNode[];
}

type SortOption = "newest" | "severity";

export default function SurveyFeed({
  nodes,
  selectedNode,
  onSelectNode,
  filters,
  onToggleFilter,
  sessionHistory,
}: FeedProps) {
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("severity");
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Filter and Search Nodes
  const filteredNodes = useMemo(() => {
    return nodes
      .filter((node) => {
        // filter by type toggle
        if (node.type === "earthquake" && !filters.earthquakes) return false;
        if (node.type === "volcano" && !filters.volcanoes) return false;
        if (node.type === "mineral" && !filters.minerals) return false;

        // filter by search term
        if (searchTerm.trim() === "") return true;
        const term = searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(term) ||
          node.details.toLowerCase().includes(term) ||
          node.type.toLowerCase().includes(term) ||
          (node.mineralType && node.mineralType.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          // Sort by "severity/value priority"
          // Earthquakes: higher magnitude first
          // Volcanoes: critical first, then active, then pulsing
          // Minerals: high yield first
          const getPriority = (node: GeologicalNode) => {
            if (node.type === "earthquake") {
              return (node.magnitude || 5.0) * 1.5; // weight earthquakes heavily by Richter mag
            }
            if (node.type === "volcano") {
              return node.status === "critical" ? 12 : node.status === "active" ? 9 : 6;
            }
            if (node.type === "mineral") {
              return node.value?.includes("Ultra") || node.value?.includes("Rare") ? 8 : 5;
            }
            return 1;
          };
          return getPriority(b) - getPriority(a);
        }
      });
  }, [nodes, searchTerm, sortBy, filters]);

  // Format timestamp relative indicator
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " UTC";
  };

  const displayedNodes = activeTab === "live" ? filteredNodes : sessionHistory;

  return (
    <div id="survey_feed_alarm_panel" className="flex flex-col h-full bg-earth-950/45 border border-earth-900 rounded-lg overflow-hidden font-mono text-xs select-none">
      {/* Header */}
      <div className="bg-earth-950 border-b border-earth-900 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-terra-600 animate-pulse" />
          <span className="font-bold text-earth-100">TACTICAL FEED & ALARMS</span>
        </div>
        <div className="text-[10px] text-earth-400">
          {activeTab === "live" ? "NODES FOUND:" : "SIMULATED:"} <span className="text-sand-500 font-bold">{activeTab === "live" ? filteredNodes.length : sessionHistory.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-earth-900 bg-earth-950/80">
        <button
          id="tab_live_feed"
          onClick={() => setActiveTab("live")}
          className={`flex-1 py-2 text-center font-bold text-[10px] tracking-wider transition-all border-b-2 uppercase cursor-pointer ${
            activeTab === "live"
              ? "border-sand-500 text-sand-400 bg-earth-950/40"
              : "border-transparent text-earth-500 hover:text-earth-300 hover:bg-earth-900/10"
          }`}
        >
          Live Feed
        </button>
        <button
          id="tab_session_history"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-center font-bold text-[10px] tracking-wider transition-all border-b-2 uppercase cursor-pointer relative ${
            activeTab === "history"
              ? "border-terra-600 text-terra-500 bg-earth-950/40"
              : "border-transparent text-earth-500 hover:text-earth-300 hover:bg-earth-900/10"
          }`}
        >
          Session History
          {sessionHistory.length > 0 && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 bg-terra-950 text-terra-400 border border-terra-900/60 text-[8px] font-black rounded-full min-w-[14px] text-center">
              {sessionHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar & Config Controls */}
      {activeTab === "live" && (
        <div className="p-3 border-b border-earth-900 bg-earth-950/80 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-earth-400 absolute left-2.5 top-2.5" />
              <input
                id="input_feed_search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by segment, ore, or event..."
                className="w-full bg-earth-950 border border-earth-800 rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-sand-500 text-earth-200 font-mono text-[11px]"
              />
            </div>
            <button
              id="btn_toggle_sorting_config"
              onClick={() => setShowConfig(!showConfig)}
              className={`px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
                showConfig
                  ? "bg-terra-950/40 border-sand-500/40 text-sand-300"
                  : "bg-earth-900 border-earth-800 text-earth-300 hover:text-earth-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expandable filter / sorting config options */}
          {showConfig && (
            <div className="p-2.5 bg-earth-950 border border-earth-900 rounded space-y-2 animate-in slide-in-from-top-1 duration-150">
              {/* Sorting */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-earth-400 font-bold uppercase flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" /> Sort priority
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSortBy("severity")}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      sortBy === "severity"
                        ? "bg-terra-950/40 border border-sand-500/40 text-sand-400 font-bold"
                        : "bg-earth-900 border border-transparent text-earth-400"
                    }`}
                  >
                    Priority Alert
                  </button>
                  <button
                    onClick={() => setSortBy("newest")}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      sortBy === "newest"
                        ? "bg-terra-950/40 border border-sand-500/40 text-sand-400 font-bold"
                        : "bg-earth-900 border border-transparent text-earth-400"
                    }`}
                  >
                    Chronological
                  </button>
                </div>
              </div>

              {/* Quick layer toggle chips */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-earth-400 font-bold uppercase">Active Sensors</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onToggleFilter('earthquakes')}
                    className={`px-1.5 py-0.5 rounded text-[9px] border transition cursor-pointer ${
                      filters.earthquakes
                        ? "border-terra-500/30 text-terra-400 bg-terra-950/20"
                        : "border-transparent text-earth-500 bg-earth-900"
                    }`}
                  >
                    Seismic
                  </button>
                  <button
                    onClick={() => onToggleFilter('volcanoes')}
                    className={`px-1.5 py-0.5 rounded text-[9px] border transition cursor-pointer ${
                      filters.volcanoes
                        ? "border-terra-600/30 text-sand-500 bg-terra-950/20"
                        : "border-transparent text-earth-500 bg-earth-900"
                    }`}
                  >
                    Volcano
                  </button>
                  <button
                    onClick={() => onToggleFilter('minerals')}
                    className={`px-1.5 py-0.5 rounded text-[9px] border transition cursor-pointer ${
                      filters.minerals
                        ? "border-moss-500/30 text-moss-400 bg-moss-950/20"
                        : "border-transparent text-earth-500 bg-earth-900"
                    }`}
                  >
                    Mineral
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List Feed viewport */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-earth-950/20 max-h-[300px] lg:max-h-none">
        {displayedNodes.length > 0 ? (
          displayedNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;

            // Define specific styles based on category
            let headerColor = "text-sand-500";
            let borderColor = "border-earth-900 hover:border-earth-800";
            let bgStyle = "bg-earth-950/40";
            let badgeText = "SEISMIC";
            let badgeBg = "bg-terra-950/50 border border-terra-850/40 text-sand-500";
            let secondaryValue = "";

            if (node.type === "earthquake") {
              headerColor = "text-terra-400";
              badgeText = `M${node.magnitude?.toFixed(1) || "5.0"}`;
              badgeBg = node.magnitude && node.magnitude > 7.0 
                ? "bg-red-950/60 border border-red-500/40 text-red-400 font-bold" 
                : "bg-terra-950/50 border border-terra-800/40 text-terra-400";
              secondaryValue = `DEPTH: ${node.depth}KM`;
              if (isSelected) {
                borderColor = "border-terra-500/60";
                bgStyle = "bg-terra-950/15";
              }
            } else if (node.type === "volcano") {
              headerColor = "text-sand-500";
              badgeText = node.status === "critical" ? "CRITICAL" : "VOLCANO";
              badgeBg = node.status === "critical" 
                ? "bg-red-950/60 border border-red-500/40 text-red-400 font-bold animate-pulse" 
                : "bg-terra-950/50 border border-terra-800/40 text-sand-500";
              secondaryValue = `DEPTH: ${node.depth}KM`;
              if (isSelected) {
                borderColor = "border-sand-500/60";
                bgStyle = "bg-terra-950/15";
              }
            } else if (node.type === "mineral") {
              headerColor = "text-moss-400";
              badgeText = node.mineralType?.toUpperCase() || "MINERAL";
              badgeBg = "bg-moss-950/50 border border-moss-800/40 text-moss-400";
              secondaryValue = node.value || "DEPOSIT";
              if (isSelected) {
                borderColor = "border-moss-500/60";
                bgStyle = "bg-moss-950/15";
              }
            }

            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(isSelected ? null : node)}
                className={`w-full text-left p-3 rounded border flex flex-col justify-between gap-1.5 transition-all outline-none cursor-pointer ${borderColor} ${bgStyle}`}
              >
                {/* Top Row: Title, Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-bold tracking-tight uppercase truncate flex-1 ${headerColor}`}>
                    {node.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 tracking-widest ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>

                {/* Description details snippet */}
                <p className="text-earth-300 text-[10.5px] leading-relaxed line-clamp-2 select-text font-sans">
                  {node.details}
                </p>

                {/* Bottom Row: Timestamp, Secondary Stats, Coords */}
                <div className="flex items-center justify-between border-t border-earth-900/80 pt-1.5 mt-0.5 text-[9px] text-earth-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>{formatTime(node.timestamp)}</span>
                    <span className="text-earth-700">•</span>
                    <span className="text-earth-300">{secondaryValue}</span>
                  </div>
                  <span className="text-earth-300 font-bold">
                    {node.lat.toFixed(1)}°, {node.lng.toFixed(1)}°
                  </span>
                </div>
              </button>
            );
          })
        ) : activeTab === "live" ? (
          <div className="text-center py-10 text-earth-400 border border-dashed border-earth-900 rounded p-4">
            <p>NO ACTIVE INCIDENTS MATCH SEARCH MATRIX.</p>
            <p className="text-[10px] text-earth-500 mt-1">Adjust search parameters or sensor filters.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-earth-400 border border-dashed border-earth-900 rounded p-4">
            <p>NO SIMULATED EVENTS RECORDED.</p>
            <p className="text-[10px] text-earth-500 mt-1">Click "SIMULATE PULSE" in the telemetry panel to record tectonic history.</p>
          </div>
        )}
      </div>

      {/* Live Audio-visual seismic alert tick footer */}
      <div className="bg-earth-950 border-t border-earth-900 p-2 text-[10px] text-earth-400 flex justify-between items-center px-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-moss-500 animate-pulse" />
          <span>SYS_STATUS: RECORDING</span>
        </div>
        <span className="text-sand-400 animate-pulse">LITHOSPHERE GRID_SYNCED</span>
      </div>
    </div>
  );
}
