/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import * as d3 from "d3";
import { GeologicalNode } from "../types";
import { BarChart2, Activity, Info } from "lucide-react";

interface MagnitudeBarChartProps {
  events: GeologicalNode[];
  selectedNode?: GeologicalNode | null;
  onSelectNode?: (node: GeologicalNode | null) => void;
}

interface MagnitudeBin {
  id: string;
  label: string;
  sublabel: string;
  min: number;
  max: number;
  count: number;
  color: string;
  gradientId: string;
  events: GeologicalNode[];
}

export default function MagnitudeBarChart({
  events,
  selectedNode,
  onSelectNode,
}: MagnitudeBarChartProps) {
  const [viewMode, setViewMode] = useState<"bins" | "events">("bins");
  const [hoveredBin, setHoveredBin] = useState<MagnitudeBin | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<GeologicalNode | null>(null);

  // Extract events that possess a seismic magnitude
  const seismicEvents = useMemo(() => {
    return events.filter(
      (e) => typeof e.magnitude === "number" && !isNaN(e.magnitude)
    );
  }, [events]);

  // Aggregate into magnitude distribution brackets
  const bins: MagnitudeBin[] = useMemo(() => {
    const definitions = [
      {
        id: "bin-mod",
        label: "< 6.0",
        sublabel: "MODERATE",
        min: 0,
        max: 6.0,
        color: "#f59e0b",
        gradientId: "grad-mod",
      },
      {
        id: "bin-str",
        label: "6.0–6.9",
        sublabel: "STRONG",
        min: 6.0,
        max: 7.0,
        color: "#ea580c",
        gradientId: "grad-str",
      },
      {
        id: "bin-maj",
        label: "7.0–7.9",
        sublabel: "MAJOR",
        min: 7.0,
        max: 8.0,
        color: "#dc2626",
        gradientId: "grad-maj",
      },
      {
        id: "bin-ext",
        label: "8.0+",
        sublabel: "GREAT",
        min: 8.0,
        max: 10.0,
        color: "#ef4444",
        gradientId: "grad-ext",
      },
    ];

    return definitions.map((def) => {
      const matching = seismicEvents.filter((e) => {
        const mag = e.magnitude!;
        if (def.max === 10.0) {
          return mag >= def.min;
        }
        return mag >= def.min && mag < def.max;
      });

      return {
        ...def,
        count: matching.length,
        events: matching,
      };
    });
  }, [seismicEvents]);

  // Summary statistics
  const stats = useMemo(() => {
    if (seismicEvents.length === 0) {
      return { count: 0, max: "0.0", avg: "0.0" };
    }
    const mags = seismicEvents.map((e) => e.magnitude!);
    const maxVal = mags.reduce((acc, curr) => Math.max(acc, curr), 0);
    const avgVal = mags.reduce((acc, curr) => acc + curr, 0) / mags.length;
    return {
      count: seismicEvents.length,
      max: maxVal.toFixed(1),
      avg: avgVal.toFixed(1),
    };
  }, [seismicEvents]);

  // SVG dimensions for D3 chart
  const width = 290;
  const height = 118;
  const margin = { top: 18, right: 14, bottom: 24, left: 24 };

  // D3 Scales for Bins Mode
  const xBinScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(bins.map((b) => b.label))
      .range([margin.left, width - margin.right])
      .padding(0.28);
  }, [bins]);

  const maxBinCount = useMemo(() => {
    const mx = d3.max(bins, (b) => b.count) || 0;
    return Math.max(mx, 3); // minimum y domain of 3 for nice visual headroom
  }, [bins]);

  const yBinScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, maxBinCount])
      .range([height - margin.bottom, margin.top]);
  }, [maxBinCount]);

  const yTicks = useMemo(() => {
    return yBinScale.ticks(Math.min(maxBinCount, 4)).filter((t) => Number.isInteger(t));
  }, [yBinScale, maxBinCount]);

  // D3 Scales for Event Sequence Mode
  const xEventScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(seismicEvents.map((_, i) => String(i)))
      .range([margin.left, width - margin.right])
      .padding(0.24);
  }, [seismicEvents]);

  const yEventScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([4.0, 9.5])
      .range([height - margin.bottom, margin.top]);
  }, []);

  return (
    <div
      id="session_history_magnitude_chart"
      className="bg-earth-950 border-t border-earth-900 flex flex-col select-none font-mono text-xs"
    >
      {/* Header with Title and Mode Switcher */}
      <div className="px-3 py-2 border-b border-earth-900/80 flex items-center justify-between bg-earth-950/90">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-terra-500 shrink-0" />
          <span className="text-[10px] font-bold text-earth-200 uppercase tracking-wide">
            MAGNITUDE DISTRIBUTION
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("bins")}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition cursor-pointer ${
              viewMode === "bins"
                ? "bg-terra-950 border border-terra-800/60 text-sand-400"
                : "text-earth-500 hover:text-earth-300"
            }`}
          >
            Bins
          </button>
          <button
            onClick={() => setViewMode("events")}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition cursor-pointer ${
              viewMode === "events"
                ? "bg-terra-950 border border-terra-800/60 text-sand-400"
                : "text-earth-500 hover:text-earth-300"
            }`}
          >
            Sequence
          </button>
        </div>
      </div>

      {/* Main Chart Canvas / SVG Container */}
      <div className="relative px-2 py-1.5 bg-earth-950/40 flex flex-col items-center">
        {seismicEvents.length === 0 ? (
          <div className="h-[118px] w-full flex flex-col items-center justify-center text-center p-3 text-earth-500">
            <Activity className="w-5 h-5 text-earth-700 mb-1.5 animate-pulse" />
            <span className="text-[10px] text-earth-400 font-bold">NO SEISMIC EVENTS STORED</span>
            <span className="text-[9px] text-earth-600 mt-0.5">
              Simulate pulse events to generate magnitude data
            </span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            aria-label="Seismic magnitude distribution bar chart"
          >
            <defs>
              {/* Gradients for Bins */}
              <linearGradient id="grad-mod" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="grad-str" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#c2410c" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="grad-maj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="grad-ext" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="1.0" />
                <stop offset="100%" stopColor="#881337" stopOpacity="0.75" />
              </linearGradient>
              {/* Hover Glow Filter */}
              <filter id="glow-bar" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Gridlines */}
            {viewMode === "bins" ? (
              yTicks.map((tick) => {
                const yPos = yBinScale(tick);
                return (
                  <g key={`tick-${tick}`}>
                    <line
                      x1={margin.left}
                      y1={yPos}
                      x2={width - margin.right}
                      y2={yPos}
                      stroke="rgba(68, 64, 60, 0.4)"
                      strokeDasharray="2,3"
                      strokeWidth="0.7"
                    />
                    <text
                      x={margin.left - 4}
                      y={yPos + 3}
                      fill="rgba(168, 162, 158, 0.6)"
                      fontSize="7.5"
                      textAnchor="end"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })
            ) : (
              [5, 6, 7, 8, 9].map((magVal) => {
                const yPos = yEventScale(magVal);
                return (
                  <g key={`mag-tick-${magVal}`}>
                    <line
                      x1={margin.left}
                      y1={yPos}
                      x2={width - margin.right}
                      y2={yPos}
                      stroke="rgba(68, 64, 60, 0.35)"
                      strokeDasharray="2,3"
                      strokeWidth="0.7"
                    />
                    <text
                      x={margin.left - 4}
                      y={yPos + 3}
                      fill="rgba(168, 162, 158, 0.6)"
                      fontSize="7.5"
                      textAnchor="end"
                    >
                      M{magVal}
                    </text>
                  </g>
                );
              })
            )}

            {/* Baseline X-Axis */}
            <line
              x1={margin.left}
              y1={height - margin.bottom}
              x2={width - margin.right}
              y2={height - margin.bottom}
              stroke="rgba(120, 113, 108, 0.7)"
              strokeWidth="1"
            />

            {/* BARS: VIEW MODE = BINS */}
            {viewMode === "bins" &&
              bins.map((bin) => {
                const xPos = xBinScale(bin.label) || 0;
                const barWidth = xBinScale.bandwidth();
                const yPos = yBinScale(bin.count);
                const barHeight = Math.max(0, height - margin.bottom - yPos);
                const isHovered = hoveredBin?.id === bin.id;
                const hasSelected = bin.events.some((e) => e.id === selectedNode?.id);

                return (
                  <g
                    key={bin.id}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredBin(bin)}
                    onMouseLeave={() => setHoveredBin(null)}
                    onClick={() => {
                      if (bin.events.length > 0 && onSelectNode) {
                        onSelectNode(bin.events[0]);
                      }
                    }}
                  >
                    {/* Background hit slot */}
                    <rect
                      x={xPos - 2}
                      y={margin.top}
                      width={barWidth + 4}
                      height={height - margin.top - margin.bottom}
                      fill="transparent"
                    />

                    {/* Bar Rectangle */}
                    <rect
                      x={xPos}
                      y={bin.count > 0 ? yPos : height - margin.bottom - 2}
                      width={barWidth}
                      height={bin.count > 0 ? barHeight : 2}
                      rx="2"
                      ry="2"
                      fill={bin.count > 0 ? `url(#${bin.gradientId})` : "rgba(87, 83, 78, 0.3)"}
                      stroke={
                        isHovered || hasSelected
                          ? "#ffffff"
                          : bin.count > 0
                          ? bin.color
                          : "rgba(120, 113, 108, 0.4)"
                      }
                      strokeWidth={isHovered || hasSelected ? 1.4 : 0.8}
                      filter={isHovered ? "url(#glow-bar)" : undefined}
                      className="transition-all duration-150"
                    />

                    {/* Count text label above bar */}
                    {bin.count > 0 && (
                      <text
                        x={xPos + barWidth / 2}
                        y={Math.max(margin.top - 3, yPos - 3)}
                        fill={isHovered ? "#ffffff" : bin.color}
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {bin.count}
                      </text>
                    )}

                    {/* X-Axis Category Label */}
                    <text
                      x={xPos + barWidth / 2}
                      y={height - margin.bottom + 11}
                      fill={isHovered ? "#f5f5f4" : "rgba(214, 211, 209, 0.8)"}
                      fontSize="7.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {bin.label}
                    </text>

                    {/* Sublabel classification */}
                    <text
                      x={xPos + barWidth / 2}
                      y={height - margin.bottom + 19}
                      fill="rgba(168, 162, 158, 0.55)"
                      fontSize="6"
                      textAnchor="middle"
                    >
                      {bin.sublabel}
                    </text>
                  </g>
                );
              })}

            {/* BARS: VIEW MODE = EVENT SEQUENCE */}
            {viewMode === "events" &&
              seismicEvents.map((evt, idx) => {
                const xPos = xEventScale(String(idx)) || 0;
                const barWidth = xEventScale.bandwidth();
                const mag = evt.magnitude || 5.0;
                const yPos = yEventScale(mag);
                const barHeight = Math.max(0, height - margin.bottom - yPos);
                const isSelected = selectedNode?.id === evt.id;
                const isHovered = hoveredEvent?.id === evt.id;

                // Color by severity
                let barColor = "#f59e0b";
                if (mag >= 8.0) barColor = "#ef4444";
                else if (mag >= 7.0) barColor = "#dc2626";
                else if (mag >= 6.0) barColor = "#ea580c";

                return (
                  <g
                    key={evt.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredEvent(evt)}
                    onMouseLeave={() => setHoveredEvent(null)}
                    onClick={() => onSelectNode && onSelectNode(evt)}
                  >
                    {/* Background hit area */}
                    <rect
                      x={xPos - 1}
                      y={margin.top}
                      width={barWidth + 2}
                      height={height - margin.top - margin.bottom}
                      fill="transparent"
                    />

                    {/* Magnitude Bar */}
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barHeight}
                      rx="1.5"
                      ry="1.5"
                      fill={barColor}
                      fillOpacity={isHovered || isSelected ? 1 : 0.75}
                      stroke={isSelected ? "#ffffff" : barColor}
                      strokeWidth={isSelected ? 1.5 : 0.6}
                      filter={isHovered || isSelected ? "url(#glow-bar)" : undefined}
                      className="transition-all duration-150"
                    />

                    {/* Magnitude Value Text */}
                    <text
                      x={xPos + barWidth / 2}
                      y={yPos - 3}
                      fill={isSelected || isHovered ? "#ffffff" : barColor}
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {mag.toFixed(1)}
                    </text>

                    {/* Sequence Index Label */}
                    <text
                      x={xPos + barWidth / 2}
                      y={height - margin.bottom + 11}
                      fill="rgba(168, 162, 158, 0.7)"
                      fontSize="7"
                      textAnchor="middle"
                    >
                      #{idx + 1}
                    </text>
                  </g>
                );
              })}
          </svg>
        )}

        {/* Dynamic Tooltip / Indicator for hovered item */}
        {hoveredBin && (
          <div className="absolute top-1 right-2 bg-earth-900/95 border border-earth-700/80 rounded px-2 py-1 text-[9px] shadow-lg pointer-events-none z-10 text-earth-200">
            <div className="font-bold text-sand-400">
              {hoveredBin.label} ({hoveredBin.sublabel})
            </div>
            <div className="text-earth-300">
              {hoveredBin.count} event{hoveredBin.count === 1 ? "" : "s"} (
              {((hoveredBin.count / (seismicEvents.length || 1)) * 100).toFixed(0)}%)
            </div>
          </div>
        )}

        {hoveredEvent && (
          <div className="absolute top-1 right-2 bg-earth-900/95 border border-earth-700/80 rounded px-2 py-1 text-[9px] shadow-lg pointer-events-none z-10 text-earth-200 max-w-[170px] truncate">
            <div className="font-bold text-terra-400 truncate">{hoveredEvent.name}</div>
            <div className="text-earth-300">
              MAG: M{hoveredEvent.magnitude?.toFixed(1)} • DEPTH: {hoveredEvent.depth}km
            </div>
          </div>
        )}
      </div>

      {/* Telemetry Summary Stats Row */}
      <div className="px-3 py-1.5 bg-earth-950 border-t border-earth-900/80 flex items-center justify-between text-[9px] text-earth-400">
        <div className="flex items-center gap-3">
          <span>
            PEAK: <strong className="text-red-400">M{stats.max}</strong>
          </span>
          <span className="text-earth-700">•</span>
          <span>
            MEAN: <strong className="text-sand-400">M{stats.avg}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-earth-500">
          <Info className="w-2.5 h-2.5" />
          <span>{stats.count}/10 STORED</span>
        </div>
      </div>
    </div>
  );
}
