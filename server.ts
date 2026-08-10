import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
5. Do not invent or hallucinate coordinates that contradict what the user provides, but do provide rich geological narratives around them.`;

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
