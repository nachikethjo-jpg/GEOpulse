/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, GeologicalNode } from "../types";
import { Send, Terminal, Cpu, Sparkles, HelpCircle, Loader2, AlertCircle } from "lucide-react";

interface ChatProps {
  selectedNode: GeologicalNode | null;
  onClearNodeSelection: () => void;
  // External prompt injection from clicking other panels
  externalPrompt: string;
  onClearExternalPrompt: () => void;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-msg",
    role: "assistant",
    content: `Greetings, Surveyor. I am **MantleMind**, your tactical planetary surveyor AI. 

I monitor active plate dynamics, volcanic plumes, and rare mineral strata. Select any incident on the left feed, lock onto any node on the **CrustMatrix 3D Globe**, or inspect core layers to transmit telemetry directly into my diagnostic core. 

How shall we survey the lithosphere today?`,
    timestamp: new Date().toISOString()
  }
];

const SCAN_MESSAGES = [
  "Broadcasting lithosphere telemetry...",
  "Calibrating subduction shear stress...",
  "Running tectonic fluid models...",
  "Querying geothermic gradient database...",
  "Synthesizing geochemical ore assay...",
  "MantleMind compiling diagnostic report..."
];

export default function MantleMindChat({
  selectedNode,
  onClearNodeSelection,
  externalPrompt,
  onClearExternalPrompt,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, loadingText]);

  // Handle external prompts (e.g. from Core Strata clicks)
  useEffect(() => {
    if (externalPrompt) {
      handleSendPrompt(externalPrompt);
      onClearExternalPrompt();
    }
  }, [externalPrompt]);

  // Loading animation message cycler
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      setLoadingText(SCAN_MESSAGES[0]);
      loadingIntervalRef.current = setInterval(() => {
        index = (index + 1) % SCAN_MESSAGES.length;
        setLoadingText(SCAN_MESSAGES[index]);
      }, 2000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
      setLoadingText("");
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Send a text message to the server
  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          contextNode: selectedNode // inject selected globe node if locked on
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to establish neural diagnostic link.");
      }

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Diagnostic connection failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  // Trigger automated diagnostics for the locked-on node
  const handleTriggerNodeDiagnostics = () => {
    if (!selectedNode) return;

    let text = "";
    if (selectedNode.type === "earthquake") {
      text = `Analyze seismic anomaly "${selectedNode.name}" of magnitude ${selectedNode.magnitude} locked at depth ${selectedNode.depth}km. What are the potential faulting mechanics and tectonic implications?`;
    } else if (selectedNode.type === "volcano") {
      text = `Inspect volcanic plume and magma chamber at "${selectedNode.name}" (Status: ${selectedNode.status || "Active"}). Can you compile a short eruption profile?`;
    } else if (selectedNode.type === "mineral") {
      text = `Conduct deep geochem assay on the ore deposit "${selectedNode.name}" containing high-grade ${selectedNode.mineralType}. Explain its geological formation model and rarity.`;
    }

    handleSendPrompt(text);
  };

  // Suggest pre-made inquiries for exploration
  const handleSelectSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const suggestions = [
    "What is the Pacific Ring of Fire?",
    "Explain how subduction zones create gold deposits.",
    "What are slow-slip earthquakes?",
    "Explain the geodynamo effect in the Outer Core."
  ];

  return (
    <div id="mantlemind_chat_panel" className="flex flex-col h-full bg-earth-950/45 border border-earth-900 rounded-lg overflow-hidden font-mono text-xs select-none">
      {/* Panel Header */}
      <div className="bg-earth-950 border-b border-earth-900 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sand-500 animate-pulse" />
          <span className="font-bold text-earth-100">MANTLEMIND CO-PILOT [v3.5]</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-sand-400/80 bg-terra-950/40 border border-terra-800/40 px-2 py-0.5 rounded">
          <Sparkles className="w-3 h-3 text-sand-400" />
          <span>GEMINI ACTIVE</span>
        </div>
      </div>

      {/* Selected Node Status Bar */}
      {selectedNode ? (
        <div className="bg-terra-950/40 border-b border-terra-900/30 px-3 py-2 flex items-center justify-between text-[11px] animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 truncate text-sand-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sand-500"></span>
            </span>
            <span className="font-bold">GLOBE LOCK:</span>
            <span className="truncate max-w-[150px] uppercase">{selectedNode.name}</span>
            <span className="text-earth-400 text-[10px]">({selectedNode.type})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerNodeDiagnostics}
              className="bg-terra-900 hover:bg-terra-800 text-amber-100 px-2 py-1 rounded text-[10px] transition font-bold cursor-pointer"
            >
              RUN DIAGNOSTICS
            </button>
            <button
              onClick={onClearNodeSelection}
              className="text-earth-400 hover:text-earth-200 text-[10px] cursor-pointer"
            >
              CLEAR
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-earth-950/20 border-b border-earth-900/60 px-3 py-1.5 text-[10px] text-earth-400 text-center">
          LOCK ON ANY GLOBE NODE TO STREAM SEISMOLOGICAL METRICS DIRECTLY
        </div>
      )}

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-950/20 max-h-[400px] lg:max-h-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[90%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            {/* Sender bubble */}
            <div
              className={`p-3 rounded-lg leading-relaxed text-[11px] select-text whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-terra-950/50 border border-terra-800/40 text-amber-100 rounded-tr-none"
                  : "bg-earth-950 border border-earth-900 text-earth-100 rounded-tl-none"
              }`}
            >
              {/* Parse nested bold tags manually or let markdown render simply */}
              {msg.content.split("\n").map((line, idx) => {
                // simple parser for **bold** text in responses
                let formatted = line;
                const boldRegex = /\*\*(.*?)\*\*/g;
                let parts = [];
                let lastIndex = 0;
                let match;
                
                while ((match = boldRegex.exec(line)) !== null) {
                  if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                  }
                  parts.push(<strong key={match.index} className="text-sand-400 font-bold">{match[1]}</strong>);
                  lastIndex = boldRegex.lastIndex;
                }
                
                if (lastIndex < line.length) {
                  parts.push(line.substring(lastIndex));
                }

                return (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                    {parts.length > 0 ? parts : line}
                  </p>
                );
              })}
            </div>
            {/* Timestamp */}
            <span className="text-[9px] text-earth-500 mt-1 uppercase font-mono">
              {msg.role === "user" ? "SURVEYOR" : "MANTLEMIND"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col mr-auto max-w-[90%] items-start animate-pulse">
            <div className="bg-earth-950 border border-earth-900 p-3 rounded-lg rounded-tl-none text-earth-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-sand-500 animate-spin" />
              <span className="text-[10px] text-sand-500 font-bold animate-pulse uppercase tracking-wider">{loadingText}</span>
            </div>
          </div>
        )}

        {/* Error Notification inside Chat */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 p-3 rounded-lg flex items-start gap-2.5 max-w-[95%]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <span className="font-bold block text-red-400 uppercase font-mono">NEURAL CO-PROCESSOR FAILURE</span>
              <p className="font-sans leading-relaxed text-earth-200">{errorMessage}</p>
              {errorMessage.includes("API Key") && (
                <div className="mt-2 bg-earth-950/80 p-2 rounded text-[10px] text-earth-300 border border-earth-900">
                  To set up your API key, click on the <strong className="text-earth-100">Settings</strong> icon in the top right menu of AI Studio, navigate to <strong className="text-earth-100">Secrets</strong>, and input your Gemini API Key as <code className="text-sand-400 font-bold bg-earth-900 px-1 rounded">GEMINI_API_KEY</code>.
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* suggestion chips */}
      {!isLoading && messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-earth-900 bg-earth-950/10 space-y-1">
          <div className="text-[9px] text-earth-400 font-bold flex items-center gap-1 uppercase">
            <HelpCircle className="w-3 h-3 text-earth-500" />
            <span>SUGGESTED DIAGNOSTICS</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(s)}
                className="bg-earth-900 hover:bg-earth-850 border border-earth-800 text-[10px] text-earth-200 px-2 py-0.5 rounded cursor-pointer transition hover:text-sand-400"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t border-earth-900 bg-earth-950 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Co-pilot analyzing..." : "Query lithosphere matrix / ask MantleMind..."}
          disabled={isLoading}
          className="flex-1 bg-earth-950 border border-earth-800 rounded px-3 py-2 text-earth-100 focus:outline-none focus:border-sand-500/80 placeholder-earth-500 font-mono text-xs disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-terra-950 hover:bg-terra-900 disabled:bg-earth-900 text-sand-400 hover:text-sand-300 disabled:text-earth-500 border border-terra-800/60 hover:border-sand-500/50 disabled:border-earth-800 px-3.5 rounded transition cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
