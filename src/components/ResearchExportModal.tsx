/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { GeologicalNode } from "../types";
import {
  ExportFormat,
  ExportScope,
  exportResearchData,
  generateResearchJSON,
  generateResearchCSV,
  extractSeismicNodes,
} from "../utils/geologicalExport";
import {
  Download,
  FileCode,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  Database,
  Layers,
  Activity,
  History,
  Info,
} from "lucide-react";

interface ResearchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionHistory: GeologicalNode[];
  allNodes: GeologicalNode[];
  initialScope?: ExportScope;
  initialFormat?: ExportFormat;
}

export default function ResearchExportModal({
  isOpen,
  onClose,
  sessionHistory,
  allNodes,
  initialScope = "all",
  initialFormat = "json",
}: ResearchExportModalProps) {
  const [scope, setScope] = useState<ExportScope>(initialScope);
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const seismicNodes = useMemo(() => extractSeismicNodes(allNodes), [allNodes]);

  // Calculate counts
  const targetCount = useMemo(() => {
    if (scope === "history") return sessionHistory.length;
    if (scope === "seismic") return seismicNodes.length;
    return sessionHistory.length + seismicNodes.length;
  }, [scope, sessionHistory, seismicNodes]);

  // Generate real preview text (first ~12 lines)
  const previewText = useMemo(() => {
    if (format === "json") {
      const full = generateResearchJSON(sessionHistory, allNodes, scope);
      const lines = full.split("\n");
      return lines.slice(0, 18).join("\n") + (lines.length > 18 ? "\n  ... [truncated preview]" : "");
    } else {
      const full = generateResearchCSV(sessionHistory, allNodes, scope);
      const lines = full.split("\r\n");
      return lines.slice(0, 10).join("\n") + (lines.length > 10 ? "\n... [truncated preview]" : "");
    }
  }, [sessionHistory, allNodes, scope, format]);

  // Full content for clipboard copying
  const fullContent = useMemo(() => {
    if (format === "json") {
      return generateResearchJSON(sessionHistory, allNodes, scope);
    } else {
      return generateResearchCSV(sessionHistory, allNodes, scope);
    }
  }, [sessionHistory, allNodes, scope, format]);

  const handleDownload = () => {
    const result = exportResearchData(sessionHistory, allNodes, format, scope);
    setDownloadSuccess(`Exported ${result.filename} (${targetCount} records)`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="research_export_modal_backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-mono text-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="research_export_modal_content"
        className="bg-earth-950 border border-earth-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-earth-900/90 border-b border-earth-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terra-950 border border-terra-800 flex items-center justify-center text-terra-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sand-100 flex items-center gap-2">
                GEOLOGICAL RESEARCH EXPORT
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-earth-800 text-earth-300 rounded border border-earth-700">
                  WGS84 / EPSG:4326
                </span>
              </h2>
              <p className="text-[10px] text-earth-400">
                Format and extract lithospheric nodes and session history for computational analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-earth-400 hover:text-earth-200 p-1 rounded-md hover:bg-earth-800 transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Target Dataset Scope Selection */}
          <div>
            <label className="text-[10px] font-bold text-earth-300 uppercase tracking-wider block mb-1.5">
              1. SELECT TARGET DATASET
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="btn_scope_combined"
                onClick={() => setScope("all")}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  scope === "all"
                    ? "bg-terra-950/60 border-terra-600 text-sand-100 shadow-sm shadow-terra-900/30"
                    : "bg-earth-900/40 border-earth-850 text-earth-400 hover:border-earth-750 hover:text-earth-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className={`w-4 h-4 ${scope === "all" ? "text-sand-400" : "text-earth-500"}`} />
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-earth-800/80 rounded text-sand-400">
                    {sessionHistory.length + seismicNodes.length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-bold text-[11px] text-earth-100">Combined Dataset</div>
                  <div className="text-[9px] text-earth-400">History pulses + all active seismic nodes</div>
                </div>
              </button>

              <button
                type="button"
                id="btn_scope_history"
                onClick={() => setScope("history")}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  scope === "history"
                    ? "bg-terra-950/60 border-terra-600 text-sand-100 shadow-sm shadow-terra-900/30"
                    : "bg-earth-900/40 border-earth-850 text-earth-400 hover:border-earth-750 hover:text-earth-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <History className={`w-4 h-4 ${scope === "history" ? "text-sand-400" : "text-earth-500"}`} />
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-earth-800/80 rounded text-sand-400">
                    {sessionHistory.length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-bold text-[11px] text-earth-100">Session History Only</div>
                  <div className="text-[9px] text-earth-400">Simulated tectonic pulses from buffer</div>
                </div>
              </button>

              <button
                type="button"
                id="btn_scope_seismic"
                onClick={() => setScope("seismic")}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  scope === "seismic"
                    ? "bg-terra-950/60 border-terra-600 text-sand-100 shadow-sm shadow-terra-900/30"
                    : "bg-earth-900/40 border-earth-850 text-earth-400 hover:border-earth-750 hover:text-earth-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Activity className={`w-4 h-4 ${scope === "seismic" ? "text-sand-400" : "text-earth-500"}`} />
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-earth-800/80 rounded text-sand-400">
                    {seismicNodes.length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-bold text-[11px] text-earth-100">Seismic Nodes Only</div>
                  <div className="text-[9px] text-earth-400">Active USGS and surveyed earthquake faults</div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Format Selection */}
          <div>
            <label className="text-[10px] font-bold text-earth-300 uppercase tracking-wider block mb-1.5">
              2. CHOOSE EXPORT FORMAT
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn_format_json"
                onClick={() => setFormat("json")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-start gap-3 ${
                  format === "json"
                    ? "bg-terra-950/60 border-terra-600 text-sand-100 shadow-sm"
                    : "bg-earth-900/40 border-earth-850 text-earth-400 hover:border-earth-750 hover:text-earth-200"
                }`}
              >
                <FileCode className={`w-5 h-5 shrink-0 mt-0.5 ${format === "json" ? "text-sand-400" : "text-earth-500"}`} />
                <div>
                  <div className="font-bold text-xs text-earth-100 flex items-center gap-1.5">
                    Formatted JSON (.json)
                    <span className="text-[9px] bg-earth-800 text-sand-400 px-1 py-0.2 rounded font-bold">Standard</span>
                  </div>
                  <div className="text-[9px] text-earth-400 mt-0.5 leading-relaxed">
                    Includes schema metadata, EPSG:4326 CRS definition, statistics summary, and structured nodes.
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn_format_csv"
                onClick={() => setFormat("csv")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-start gap-3 ${
                  format === "csv"
                    ? "bg-terra-950/60 border-terra-600 text-sand-100 shadow-sm"
                    : "bg-earth-900/40 border-earth-850 text-earth-400 hover:border-earth-750 hover:text-earth-200"
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 shrink-0 mt-0.5 ${format === "csv" ? "text-sand-400" : "text-earth-500"}`} />
                <div>
                  <div className="font-bold text-xs text-earth-100 flex items-center gap-1.5">
                    Tabular CSV (.csv)
                    <span className="text-[9px] bg-earth-800 text-sand-400 px-1 py-0.2 rounded font-bold">RFC-4180</span>
                  </div>
                  <div className="text-[9px] text-earth-400 mt-0.5 leading-relaxed">
                    Optimal for tabular ingestion in Python (Pandas), R, Excel, QGIS, and ArcGIS.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Research Preview Terminal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-earth-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3 h-3 text-earth-400" />
                FILE PREVIEW ({format.toUpperCase()}) — {targetCount} RECORDS
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-earth-300 hover:text-sand-300 px-2 py-0.5 rounded border border-earth-800 hover:bg-earth-850 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-bold">COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY RAW</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-earth-950 border border-earth-850 rounded-lg p-2.5 overflow-x-auto max-h-[160px] text-[9.5px] leading-snug text-sand-300/90 font-mono select-text scrollbar-thin">
              <pre>{previewText}</pre>
            </div>
          </div>

          {/* Download Success Notice */}
          {downloadSuccess && (
            <div className="p-2.5 bg-green-950/60 border border-green-700/60 rounded-lg text-green-300 flex items-center gap-2 text-[10px] animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-earth-900/80 border-t border-earth-800 px-4 py-3 flex items-center justify-between">
          <div className="text-[10px] text-earth-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-earth-500" />
            <span>Target: <strong className="text-sand-400">{targetCount} records</strong> ready for download</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-earth-800 text-earth-300 hover:bg-earth-850 hover:text-white transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn_confirm_download_research_file"
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-terra-700 to-terra-600 hover:from-terra-600 hover:to-terra-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-terra-900/30 transition cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
