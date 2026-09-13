import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import type { EarthquakeFeedResponse } from "./src/types.js";
import { normalizeUsgsFeed, USGS_FEED_URL } from "./src/usgs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FEED_CACHE_MS = 30_000;

let earthquakeCache: { expiresAt: number; payload: EarthquakeFeedResponse } | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/earthquakes", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (earthquakeCache && earthquakeCache.expiresAt > Date.now()) {
      return res.json(earthquakeCache.payload);
    }

    try {
      const response = await fetch(USGS_FEED_URL, {
        headers: { Accept: "application/geo+json, application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`USGS returned HTTP ${response.status}`);

      const retrievedAt = new Date().toISOString();
      const payload = normalizeUsgsFeed(await response.json(), retrievedAt);
      earthquakeCache = { expiresAt: Date.now() + FEED_CACHE_MS, payload };
      return res.json(payload);
    } catch (error: any) {
      console.error("USGS ingestion error:", error);
      if (earthquakeCache) {
        return res.json({
          ...earthquakeCache.payload,
          source: {
            ...earthquakeCache.payload.source,
            stale: true,
            warning: "USGS refresh failed; displaying the last successfully retrieved observations.",
          },
        });
      }
      return res.status(502).json({
        error: "The authoritative USGS feed is currently unavailable.",
        details: error.message,
      });
    }
  });

  // Lazy initialize Gemini client inside the API endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "Gemini API Key is missing. Please add your GEMINI_API_KEY in the Settings > Secrets panel of AI Studio to activate the geological co-pilot diagnostics."
        });
      }

      const { messages, contextNode } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Construct a tailored system instruction based on whether there is a context node
      let systemInstruction = `You are "MantleMind", an advanced sci-fi planetary geological diagnostics AI and tactical seismological co-pilot.
Your tone is intelligent, sophisticated, slightly futuristic, yet highly precise, clear, and scientific.
You assist the user in surveying the Earth's crust (Lithosphere), evaluating seismic hazards, active volcanism, mineral deposit locations, and deep core strata (Crust, Mantle, Outer Core, Inner Core).

Rules:
1. Speak as a highly capable AI engine, addressing the user as "Surveyor".
2. Use precise geoscientific terms (subduction zones, plate tectonics, seismic velocities, lithostatic pressure, geothermal gradient).
3. Keep responses clean, concise, structured, and easy to read using markdown (such as bold headers, bullet points).
4. If the user refers to a specific node or scanned location, integrate that data into your analysis.
5. Do not invent or hallucinate coordinates that contradict what the user provides, but do provide rich geological narratives around them.
6. Clearly distinguish preliminary observations, static reference data, and interpretation. Never present your response as an official warning, forecast, or emergency instruction.`;

      // Format the messages for chat. Gemini SDK expects `{ role: 'user' | 'model', parts: [{ text: '...' }] }`
      // Convert standard client-side chat format to the SDK's expected format
      const chatContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Add context about the selected node to the final user prompt if present
      if (contextNode && chatContents.length > 0) {
        const lastMsg = chatContents[chatContents.length - 1];
        lastMsg.parts[0].text = `[SURVEYOR SEISMIC SCAN ACTIVE: Type=${contextNode.type}, Classification=${contextNode.name}, Location=Lat ${contextNode.lat.toFixed(2)}, Lng ${contextNode.lng.toFixed(2)}, Depth=${contextNode.depth}km, Activity/Value=${contextNode.magnitude || contextNode.value || "N/A"}]

User Inquiry: ${lastMsg.parts[0].text}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Diagnostic stream connection lost. Please retry.";
      return res.json({ content: replyText });

    } catch (error: any) {
      console.error("Gemini API Error in /api/gemini/chat:", error);
      return res.status(500).json({
        error: "An error occurred while generating diagnostics with MantleMind.",
        details: error.message || error
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GeoPulse Engine Server running on port ${PORT}`);
  });
}

startServer();
