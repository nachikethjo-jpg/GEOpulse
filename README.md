# GeoPulse

GeoPulse is a source-aware geological visualization dashboard. It displays preliminary earthquakes retrieved by the server from the USGS magnitude 2.5+ daily GeoJSON feed and keeps the built-in volcano, mineral, plate, and Earth-layer content clearly labeled as reference data.

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
npm run build      # Build the Vite client and ESM Express server
npm start          # Serve the production build
```

## Data integrity model

- The browser receives earthquake observations from `GET /api/earthquakes`; it does not contact USGS directly.
- Each earthquake retains its USGS identifier, event URL, retrieval time, update time, magnitude type, and review status.
- Incomplete upstream features are rejected rather than filled with invented values.
- The server caches successful USGS responses for 30 seconds to avoid one upstream request per browser.
- Built-in earthquake demonstrations and the event simulator are excluded from operational display.
- Built-in volcano and mineral entries are explicitly marked `STATIC REFERENCE · NOT LIVE`.
- Gemini responses are generated interpretations, not official observations, predictions, or emergency guidance.

Earthquake parameters can be preliminary, delayed, or revised. GeoPulse is not a replacement for alerts or instructions issued by emergency authorities.
