# GeoPulse

GeoPulse is a source-aware geological visualization dashboard. Its operational event feed displays only preliminary earthquakes retrieved by the server from the USGS magnitude 2.5+ daily GeoJSON feed. The plate and Earth-layer graphics remain educational context rather than live event records.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:3000>. A Gemini API key is optional for the dashboard and required only for MantleMind chat.

## Commands

```bash
npm run lint       # Type-check
npm test           # Test USGS normalization and validation
npm run build      # Build the Vite client and ESM Express server
npm start          # Serve the production build
```

## Data integrity model

- The browser receives earthquake observations from `GET /api/earthquakes`; it does not contact USGS directly.
- Each earthquake retains its USGS identifier, event URL, retrieval time, update time, magnitude type, and review status.
- Incomplete upstream features are rejected rather than filled with invented values.
- The server caches successful USGS responses for 30 seconds to avoid one upstream request per browser.
- If a later refresh fails, the server marks and returns the last successful snapshot as stale instead of presenting it as current.
- Built-in earthquake, volcano, mineral, and simulated events are excluded from the operational event feed.
- Gemini responses are generated interpretations, not official observations, predictions, or emergency guidance.

Earthquake parameters can be preliminary, delayed, or revised. GeoPulse is not a replacement for alerts or instructions issued by emergency authorities.
