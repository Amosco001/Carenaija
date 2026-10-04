import { test } from "node:test";
import assert from "node:assert/strict";
import { hasValidCoordinates, getHospitalDistanceKm, formatDistance } from "../client/src/lib/distance";

test("coordinates must be finite and in range; zero is valid", () => {
  assert.equal(hasValidCoordinates({ latitude: 0, longitude: 0 }), true);
  for (const coordinates of [
    { latitude: null, longitude: 3 },
    { latitude: 6, longitude: undefined },
    { latitude: 91, longitude: 3 },
    { latitude: 6, longitude: -181 },
    { latitude: NaN, longitude: 3 },
  ]) assert.equal(hasValidCoordinates(coordinates), false);
});

test("distance is unavailable without coordinates or user location", () => {
  assert.equal(getHospitalDistanceKm({ latitude: 6, longitude: 3 }, null), null);
  assert.equal(getHospitalDistanceKm({ latitude: null, longitude: 3 }, { lat: 6, lng: 3 }), null);
});

test("distance uses kilometres and includes co-located hospitals", () => {
  assert.equal(getHospitalDistanceKm({ latitude: 0, longitude: 0 }, { lat: 0, lng: 0 }), 0);
  const distance = getHospitalDistanceKm({ latitude: 0, longitude: 1 }, { lat: 0, lng: 0 })!;
  assert.ok(Math.abs(distance - 111.195) < 0.01);
  assert.equal(formatDistance(0), "0 m");
  assert.equal(formatDistance(0.5), "500 m");
  assert.equal(formatDistance(1.234), "1.2 km");
});

test("unknown distances sort after known distances", () => {
  const hospitals = [
    { id: "unknown", latitude: null, longitude: null },
    { id: "far", latitude: 0, longitude: 2 },
    { id: "near", latitude: 0, longitude: 0 },
  ];
  hospitals.sort((a, b) =>
    (getHospitalDistanceKm(a, { lat: 0, lng: 0 }) ?? Infinity) -
    (getHospitalDistanceKm(b, { lat: 0, lng: 0 }) ?? Infinity));
  assert.deepEqual(hospitals.map(h => h.id), ["near", "far", "unknown"]);
});