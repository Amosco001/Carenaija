import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  permissionState: "prompt" | "granted" | "denied" | "unavailable";
  lastUpdated: number | null;
}

interface CachedLocation {
  coords: { lat: number; lng: number };
  timestamp: number;
}

const CACHE_KEY = "carenaija_user_location";
const CACHE_TTL = 30 * 60 * 1000;

function getCachedLocation(): CachedLocation | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedLocation = JSON.parse(cached);
    const now = Date.now();
    
    if (now - data.timestamp < CACHE_TTL) {
      return data;
    }
    
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedLocation(coords: { lat: number; lng: number }): void {
  try {
    const data: CachedLocation = {
      coords,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function clearLocationCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    isLoading: false,
    permissionState: "prompt",
    lastUpdated: null,
  });

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      setState(prev => ({
        ...prev,
        coords: cached.coords,
        lastUpdated: cached.timestamp,
        permissionState: "granted",
      }));
    }

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState(prev => ({ ...prev, permissionState: result.state }));
        result.onchange = () => {
          setState(prev => ({ ...prev, permissionState: result.state }));
          if (result.state === "denied") {
            clearLocationCache();
            setState(prev => ({ ...prev, coords: null, error: "Location permission denied" }));
          }
        };
      }).catch(() => {
      });
    }

    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permissionState: "unavailable" }));
    }
  }, []);

  const requestLocation = useCallback((forceRefresh = false) => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        permissionState: "unavailable",
      }));
      return;
    }

    if (!forceRefresh) {
      const cached = getCachedLocation();
      if (cached) {
        setState(prev => ({
          ...prev,
          coords: cached.coords,
          lastUpdated: cached.timestamp,
          permissionState: "granted",
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        setCachedLocation(coords);
        
        setState({
          coords,
          error: null,
          isLoading: false,
          permissionState: "granted",
          lastUpdated: Date.now(),
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        let permissionState: GeolocationState["permissionState"] = "prompt";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location permissions in your browser settings.";
            permissionState = "denied";
            clearLocationCache();
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          permissionState,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: CACHE_TTL,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    clearLocationCache();
    setState({
      coords: null,
      error: null,
      isLoading: false,
      permissionState: "prompt",
      lastUpdated: null,
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
    hasLocation: state.coords !== null,
  };
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function getGoogleMapsDirectionsUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string {
  const destParam = `${destination.lat},${destination.lng}`;
  
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destParam}`;
  }
  
  return `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
}
