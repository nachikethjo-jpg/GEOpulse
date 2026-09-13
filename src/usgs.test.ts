import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsgsFeed } from "./usgs.js";

test("normalizes valid USGS features and preserves provenance", () => {
  const retrievedAt = "2026-09-13T10:00:00.000Z";
  const result = normalizeUsgsFeed({
    metadata: { generated: 1_789_293_590_000 },
    features: [{
      id: "abcd1234",
      geometry: { coordinates: [-122.25, 38.1, 7.4] },
      properties: {
        mag: 4.2,
        magType: "mw",
        place: "Test location",
        time: 1_789_293_500_000,
        updated: 1_789_293_550_000,
        status: "reviewed",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/abcd1234",
      },
    }],
  }, retrievedAt);

  assert.equal(result.nodes.length, 1);
  assert.equal(result.nodes[0].id, "usgs-abcd1234");
  assert.equal(result.nodes[0].magnitudeType, "mw");
  assert.equal(result.nodes[0].provenance?.reviewStatus, "reviewed");
  assert.equal(result.nodes[0].provenance?.retrievedAt, retrievedAt);
});

test("drops incomplete features instead of inventing measurements", () => {
  const result = normalizeUsgsFeed({
    features: [
      { id: "missing-depth", geometry: { coordinates: [1, 2] }, properties: { mag: 3, time: 1 } },
      { id: "missing-mag", geometry: { coordinates: [1, 2, 3] }, properties: { mag: null, time: 1 } },
    ],
  }, "2026-09-13T10:00:00.000Z");

  assert.deepEqual(result.nodes, []);
});

test("rejects malformed feed envelopes", () => {
  assert.throws(() => normalizeUsgsFeed({}, "2026-09-13T10:00:00.000Z"), /features array/);
});
