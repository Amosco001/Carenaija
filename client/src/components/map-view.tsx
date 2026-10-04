import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "wouter";
import { MapPin, Navigation, Phone, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGoogleMapsDirectionsUrl } from "@/hooks/useGeolocation";
import { hasValidCoordinates, getHospitalDistanceKm, formatDistance, type Coordinates } from "@/lib/distance";
import type { Hospital } from "@/lib/types";
import { getHospitalUrl } from "@shared/schema";

interface MapViewProps {
  hospitals: Hospital[];
  userLocation: Coordinates | null;
  selectedRadius?: number;
  className?: string;
}

// This module (including Leaflet and its CSS) is imported only after map view is opened.
export default function MapView({ hospitals, userLocation, selectedRadius = 0, className = "" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [tileError, setTileError] = useState(false);
  const mappedHospitals = hospitals.filter(hasValidCoordinates);
  const missingCoordinates = hospitals.length - mappedHospitals.length;
  const distance = selectedHospital ? getHospitalDistanceKm(selectedHospital, userLocation) : null;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView([9.082, 8.6753], 6);
    mapRef.current = map;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    const bounds = L.latLngBounds([]);
    const hospitalIcon = L.divIcon({
      className: "",
      html: '<span style="display:block;width:20px;height:20px;border:3px solid white;border-radius:50%;background:#059669;box-shadow:0 1px 5px #0006"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    hospitals.filter(hasValidCoordinates).forEach((hospital) => {
      const position: L.LatLngTuple = [hospital.latitude!, hospital.longitude!];
      bounds.extend(position);
      L.marker(position, { icon: hospitalIcon, title: hospital.name, keyboard: true })
        .on("click", () => setSelectedHospital(hospital))
        .addTo(layer);
    });
    if (userLocation) {
      const position: L.LatLngTuple = [userLocation.lat, userLocation.lng];
      bounds.extend(position);
      L.circleMarker(position, { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 })
        .bindTooltip("Your location").addTo(layer);
      if (selectedRadius > 0) {
        L.circle(position, { radius: selectedRadius * 1000, color: "#059669", fillOpacity: 0.08 }).addTo(layer);
      }
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    setSelectedHospital(null);
    return () => { layer.remove(); };
  }, [hospitals, userLocation, selectedRadius]);

  return (
    <div className={`space-y-3 ${className}`} data-testid="hospital-map">
      <p className="text-sm text-slate-500">
        {mappedHospitals.length} hospitals shown on the map.
        {missingCoordinates > 0 && ` ${missingCoordinates} without coordinates are available in list view.`}
        {userLocation && " Blue marker: your location."}
      </p>
      {tileError && (
        <p role="alert" className="text-sm text-red-600">Some map tiles could not load. Use list view if the map is unavailable.</p>
      )}
      <div className="relative isolate rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
        <div ref={containerRef} className="w-full h-[480px]" style={{ fontFamily: "inherit" }} data-testid="map-container" aria-label="Hospital locations map" />
        {userLocation && (
          <Button size="sm" variant="secondary" className="absolute top-3 right-3 z-[1000] shadow-md"
            onClick={() => mapRef.current?.setView([userLocation.lat, userLocation.lng], 13)}
            data-testid="map-center-on-me">
            <Navigation className="w-4 h-4 mr-1" /> Center on me
          </Button>
        )}
        {selectedHospital && (
          <Card className="absolute bottom-8 left-3 right-3 md:left-auto md:w-80 p-4 shadow-lg z-[1000]">
            <button aria-label="Close hospital details" onClick={() => setSelectedHospital(null)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <div className="pr-5">
              <Badge variant="outline" className="text-xs mb-2">{selectedHospital.ownership}</Badge>
              <h3 className="font-bold text-slate-900 mb-1">{selectedHospital.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" /> {selectedHospital.lga}, {selectedHospital.state}
              </p>
              <div className="flex items-center gap-3 text-sm mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {selectedHospital.averageRating?.toFixed(1) ?? "No ratings"}
                {distance !== null && <span className="text-emerald-700">{formatDistance(distance)} away</span>}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1"><Link href={getHospitalUrl(selectedHospital)}>View Details</Link></Button>
                <Button asChild size="sm" variant="outline">
                  <a aria-label="Get directions" href={getGoogleMapsDirectionsUrl(
                    { lat: selectedHospital.latitude!, lng: selectedHospital.longitude! }, userLocation ?? undefined
                  )} target="_blank" rel="noopener noreferrer"><Navigation className="w-4 h-4" /></a>
                </Button>
                {selectedHospital.phone && <Button asChild size="sm" variant="outline">
                  <a href={`tel:${selectedHospital.phone}`} aria-label="Call hospital"><Phone className="w-4 h-4" /></a>
                </Button>}
              </div>
            </div>
          </Card>
        )}
      </div>
      <p className="text-xs text-slate-500">Distances are straight-line estimates, not driving distances.</p>
    </div>
  );
}