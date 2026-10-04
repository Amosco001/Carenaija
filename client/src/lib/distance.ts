export interface Coordinates {
  lat: number;
  lng: number;
}

type HospitalCoordinates = { latitude?: number | null; longitude?: number | null };

export function hasValidCoordinates(hospital: HospitalCoordinates): boolean {
  return typeof hospital.latitude === "number" && Number.isFinite(hospital.latitude) &&
    Math.abs(hospital.latitude) <= 90 &&
    typeof hospital.longitude === "number" && Number.isFinite(hospital.longitude) &&
    Math.abs(hospital.longitude) <= 180;
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const a = Math.sin(radians(lat2 - lat1) / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) *
    Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function getHospitalDistanceKm(hospital: HospitalCoordinates, location: Coordinates | null): number | null {
  if (!location || !hasValidCoordinates(hospital)) return null;
  return getDistanceFromLatLonInKm(location.lat, location.lng, hospital.latitude!, hospital.longitude!);
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}