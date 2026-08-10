/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EarthLayer } from "../types";
import { EARTH_LAYERS } from "../data";
import { Thermometer, Layers, ChevronRight, Activity } from "lucide-react";

interface StrataProps {
  onSelectedLayerMsg?: (message: string) => void;
}

export default function DeepStrataScan({ onSelectedLayerMsg }: StrataProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("crust");

  const activeLayer = EARTH_LAYERS.find((l) => l.id === selectedLayerId) || EARTH_LAYERS[0];

  const handleLayerClick = (layer: EarthLayer) => {
    setSelectedLayerId(layer.id);
    if (onSelectedLayerMsg) {
      onSelectedLayerMsg(
        `Perform strata analysis on the ${layer.name} (${layer.scifiTerm}) layer situated at depth ${layer.depthRange}.`
      );
    }
  };

  return (
    <div id="strata_cross_section_container" className="flex flex-col h-full bg-earth-950/45 border border-earth-900 rounded-lg p-4 font-mono select-none">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-earth-900 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-terra-500" />
          <span className="text-xs font-bold text-earth-100">DEEP STRATA CORE SCANNER</span>
        </div>
        <div className="text-[10px] text-earth-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-sand-500 rounded-full animate-pulse" />
          <span>LITHOSPHERE TRANSIT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
        {/* Interactive Earth layers diagram */}
        <div className="md:col-span-5 flex flex-col justify-between relative bg-earth-950 border border-earth-900 rounded p-3 overflow-hidden min-h-[220px]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,60,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,90,60,0.04)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

          <div className="relative flex flex-col items-stretch justify-center h-full gap-2 text-center z-10">
            {EARTH_LAYERS.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => handleLayerClick(layer)}
                  className={`relative group flex flex-col items-center justify-center rounded py-2.5 px-3 border transition-all text-left outline-none ${
                    isSelected
                      ? `bg-earth-900/90 ${layer.borderColor} shadow-lg shadow-sand-500/5`
                      : "bg-earth-950/60 border-earth-900 hover:border-earth-800 hover:bg-earth-900/30"
                  }`}
                >
                  {/* Neon Color Gradient Indicator on left edge */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l bg-gradient-to-b ${layer.color}`} />

                  {/* Layer Label */}
                  <div className="flex items-center justify-between w-full pl-2">
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${isSelected ? "text-sand-100" : "text-earth-300 group-hover:text-earth-200"}`}>
                      {layer.name}
                    </span>
                    <span className="text-[9px] text-earth-400 font-normal">
                      {layer.depthRange}
                    </span>
                  </div>

                  {/* Active lock glow */}
                  {isSelected && (
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-sand-400 rounded-full animate-ping" />
                      <span className="text-[8px] text-sand-400 font-bold font-mono">SELECTED</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display panel for inspected layer stats */}
        <div className="md:col-span-7 flex flex-col justify-between bg-earth-950/80 border border-earth-900 rounded p-3 font-mono text-xs">
          <div className="space-y-3.5">
            {/* Strata HUD Headers */}
            <div>
              <div className="text-[10px] text-earth-400 uppercase tracking-widest">TACTICAL IDENTIFIER</div>
              <div className="text-sm font-bold text-sand-400 tracking-tight flex items-center gap-1.5 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-sand-400 animate-pulse" />
                {activeLayer.scifiTerm}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 bg-earth-950/95 border border-earth-900 p-2.5 rounded text-[11px] leading-relaxed">
              <div>
                <span className="text-earth-400 block text-[9px] uppercase font-bold">DEPTH RADIUS</span>
                <span className="text-earth-100 font-bold">{activeLayer.depthRange}</span>
              </div>
              <div>
                <span className="text-earth-400 block text-[9px] uppercase font-bold">GEOTHERMAL TEMP</span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-400" />
                  ~{activeLayer.temperature}°C
                </span>
              </div>
              <div className="mt-1.5">
                <span className="text-earth-400 block text-[9px] uppercase font-bold">CORE PRESSURE</span>
                <span className="text-terra-400 font-bold">{activeLayer.pressure}</span>
              </div>
              <div className="mt-1.5">
                <span className="text-earth-400 block text-[9px] uppercase font-bold">PRIMARY SEGMENT</span>
                <span className="text-moss-400 truncate block font-bold">{activeLayer.name.split(" ")[0]}</span>
              </div>
            </div>

            {/* Mineral/Geological Composition */}
            <div>
              <span className="text-[9px] text-earth-400 block uppercase font-bold">ELEMENTAL COMPOSITION</span>
              <p className="text-earth-200 text-[11px] mt-0.5 leading-relaxed bg-earth-950/60 p-2 rounded border border-earth-900/60 font-mono">
                {activeLayer.composition}
              </p>
            </div>

            {/* Description Paragraph */}
            <div>
              <span className="text-[9px] text-earth-400 block uppercase font-bold">GEODYNAMIC DESCRIPTION</span>
              <p className="text-earth-300 text-[11px] leading-relaxed mt-1">
                {activeLayer.description}
              </p>
            </div>
          </div>

          {/* Quick Trigger button for diagnostic analysis */}
          <button
            onClick={() => handleLayerClick(activeLayer)}
            className="w-full mt-4 bg-earth-900 hover:bg-terra-950/40 text-[10px] text-sand-500 font-bold border border-terra-900/50 hover:border-sand-500/40 py-1.5 rounded flex items-center justify-center gap-1.5 transition uppercase cursor-pointer"
          >
            <span>TRANSMIT STRATA SAMPLES TO MANTLEMIND AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-sand-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
