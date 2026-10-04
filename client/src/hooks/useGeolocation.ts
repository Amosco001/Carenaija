import { useState, useEffect, useCallback, createContext, useContext, createElement, type ReactNode } from "react";
import { hasValidCoordinates, type Coordinates } from "@/lib/distance";
export { getDistanceFromLatLonInKm, formatDistance } from "@/lib/distance";

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
    
    if (hasValidCoordinates({ latitude: data.coords?.lat, longitude: data.coords?.lng }) &&
        Number.isFinite(data.timestamp) && now >= data.timestamp && now - data.timestamp < CACHE_TTL) {
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

function useGeolocationState() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    isLoading: false,
    permissionState: "prompt",
    lastUpdated: null,
  });

  useEffect(() => {
    let active = true;
    let permission: PermissionStatus | undefined;
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (!active) return;
        permission = result;
        const cached = result.state === "granted" ? getCachedLocation() : null;
        if (result.state !== "granted") clearLocationCache();
        setState(prev => ({
          ...prev,
          permissionState: result.state,
          coords: cached?.coords ?? null,
          lastUpdated: cached?.timestamp ?? null,
        }));
        result.onchange = () => {
          setState(prev => ({ ...prev, permissionState: result.state }));
          if (result.state !== "granted") {
            clearLocationCache();
            setState(prev => ({ ...prev, coords: null, lastUpdated: null }));
          }
        };
      }).catch(() => {
      });
    }

    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permissionState: "unavailable" }));
    }
    return () => {
      active = false;
      if (permission) permission.onchange = null;
    };
  }, []);

  const requestLocation = useCallback(async (forceRefresh = false): Promise<Coordinates | null> => {
    // Check if geolocation API exists
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser. Please search for hospitals by state or city instead.",
        permissionState: "unavailable",
        isLoading: false,
      }));
      return null;
    }

    if (!forceRefresh) {
      const permission = await navigator.permissions?.query({ name: "geolocation" }).catch(() => null);
      const cached = permission?.state === "granted" ? getCachedLocation() : null;
      if (cached) {
        setState(prev => ({
          ...prev,
          coords: cached.coords,
          lastUpdated: cached.timestamp,
          permissionState: "granted",
            error: null,
            isLoading: false,
        }));
        return cached.coords;
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
    try {
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
          resolve(coords);
        },
        (error) => {
          let errorMessage = "Unable to get your location";
          let permissionState: GeolocationState["permissionState"] = "prompt";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was blocked. Please allow location access in your browser, or search by state/city instead.";
              permissionState = "denied";
              clearLocationCache();
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable. Please search for hospitals by state or city instead.";
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
            coords: null,
            lastUpdated: null,
          }));
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: CACHE_TTL,
        }
      );
    } catch (e) {
      // Handle any synchronous errors (e.g., security policy blocks)
      setState(prev => ({
        ...prev,
        error: "Location access is blocked by browser security. Please search for hospitals by state or city instead.",
        isLoading: false,
        permissionState: "denied",
        coords: null,
        lastUpdated: null,
      }));
      resolve(null);
    }
    });
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

const GeolocationContext = createContext<ReturnType<typeof useGeolocationState> | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const location = useGeolocationState();
  return createElement(GeolocationContext.Provider, { value: location }, children);
}

export function useGeolocation() {
  const location = useContext(GeolocationContext);
  if (!location) throw new Error("useGeolocation must be used within GeolocationProvider");
  return location;
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
