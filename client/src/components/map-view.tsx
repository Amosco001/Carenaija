/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Star, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistance, getGoogleMapsDirectionsUrl } from "@/hooks/useGeolocation";
import { Link } from "wouter";
import type { Hospital } from "@/lib/types";

interface MapViewProps {
  hospitals: Hospital[];
  userLocation: { lat: number; lng: number } | null;
  selectedRadius: number;
  onHospitalSelect?: (hospital: Hospital) => void;
  className?: string;
  getDistance?: (hospital: Hospital) => number | null;
}

const NIGERIA_CENTER = { lat: 9.0820, lng: 8.6753 };
const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

export function MapView({ 
  hospitals, 
  userLocation, 
  selectedRadius,
  onHospitalSelect,
  className = "",
  getDistance 
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (hospitals.length > 0 && hospitals[0].latitude && hospitals[0].longitude) {
      return { lat: hospitals[0].latitude, lng: hospitals[0].longitude };
    }
    return LAGOS_CENTER;
  }, [userLocation, hospitals]);

  useEffect(() => {
    if (typeof google === "undefined") {
      setLoadError("Google Maps is not available. Please check if the API key is configured.");
      return;
    }

    if (!mapRef.current) return;

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: userLocation ? 13 : 10,
        styles: [
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "poi.medical",
            stylers: [{ visibility: "on" }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(mapInstance);
      setIsLoaded(true);

      if (userLocation) {
        new google.maps.Circle({
          map: mapInstance,
          center: userLocation,
          radius: selectedRadius * 1000,
          fillColor: "#10b981",
          fillOpacity: 0.1,
          strokeColor: "#10b981",
          strokeOpacity: 0.4,
          strokeWeight: 2,
        });

        new google.maps.Marker({
          position: userLocation,
          map: mapInstance,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          title: "Your Location",
          zIndex: 1000,
        });
      }
    } catch (error) {
      setLoadError("Failed to initialize the map. Please try again.");
    }
  }, [center, userLocation, selectedRadius]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    if (userLocation) {
      bounds.extend(userLocation);
    }

    hospitals.forEach((hospital) => {
      if (!hospital.latitude || !hospital.longitude) return;

      const position = { lat: hospital.latitude, lng: hospital.longitude };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: hospital.name,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: hospital.verified ? "#10b981" : "#64748b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 22),
        },
      });

      marker.addListener("click", () => {
        setSelectedHospital(hospital);
        onHospitalSelect?.(hospital);
        map.panTo(position);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    if (newMarkers.length > 0 && !userLocation) {
      map.fitBounds(bounds);
    }
  }, [map, hospitals, isLoaded, onHospitalSelect]);

  if (loadError) {
    return (
      <div className={`bg-slate-100 rounded-xl flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-slate-600 text-center mb-4">{loadError}</p>
        <p className="text-sm text-slate-500 text-center">
          Try using the list view to find hospitals near you.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-xl"
        style={{ minHeight: "400px" }}
        data-testid="map-container"
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 rounded-xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      )}

      {selectedHospital && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 shadow-lg z-10">
          <button 
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1"
            onClick={() => setSelectedHospital(null)}
            aria-label="Close"
          >
            ×
          </button>
          
          <div className="pr-6">
            <div className="flex items-start gap-2 mb-2">
              {selectedHospital.verified && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Verified</Badge>
              )}
              <Badge variant="outline" className="text-xs">{selectedHospital.ownership}</Badge>
            </div>
            
            <h3 className="font-bold text-slate-900 line-clamp-2 mb-1">
              {selectedHospital.name}
            </h3>
            
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {selectedHospital.lga}, {selectedHospital.state}
            </p>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{(selectedHospital.averageRating || 0).toFixed(1)}</span>
              </div>
              {getDistance && getDistance(selectedHospital) !== null && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Navigation className="w-3 h-3" />
                  <span className="text-sm">{formatDistance(getDistance(selectedHospital)!)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link href={`/hospital/${selectedHospital.id}`} className="flex-1">
                <Button size="sm" className="w-full" data-testid="map-view-details">
                  View Details
                </Button>
              </Link>
              
              {selectedHospital.latitude && selectedHospital.longitude && (
                <a
                  href={getGoogleMapsDirectionsUrl(
                    { lat: selectedHospital.latitude, lng: selectedHospital.longitude },
                    userLocation || undefined
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" data-testid="map-get-directions">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </a>
              )}
              
              {selectedHospital.phone && (
                <a href={`tel:${selectedHospital.phone}`}>
                  <Button size="sm" variant="outline" data-testid="map-call">
                    <Phone className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {userLocation && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-4 right-4 shadow-md"
          onClick={() => map?.panTo(userLocation)}
          data-testid="map-center-on-me"
        >
          <Navigation className="w-4 h-4 mr-1" /> Center on me
        </Button>
      )}
    </div>
  );
}

export function StaticMapFallback({ 
  hospitals,
  userLocation,
  className = "" 
}: { 
  hospitals: Hospital[];
  userLocation: { lat: number; lng: number } | null;
  className?: string;
}) {
  const center = userLocation || LAGOS_CENTER;
  
  return (
    <div className={`bg-slate-100 rounded-xl flex flex-col items-center justify-center p-8 ${className}`}>
      <MapPin className="w-12 h-12 text-emerald-600 mb-4" />
      <h3 className="font-semibold text-slate-900 mb-2">Map View</h3>
      <p className="text-sm text-slate-600 text-center mb-4">
        {hospitals.length} hospitals found in this area
      </p>
      <a
        href={`https://www.google.com/maps/search/hospitals/@${center.lat},${center.lng},12z`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Open in Google Maps
        </Button>
      </a>
    </div>
  );
}
