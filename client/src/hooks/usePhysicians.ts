import { useQuery } from "@tanstack/react-query";
import type { Physician, PhysicianAffiliation } from "@shared/schema";

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function usePhysicians(params?: { specialty?: string; city?: string; state?: string; hospitalId?: number; search?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.specialty) searchParams.set("specialty", params.specialty);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.state) searchParams.set("state", params.state);
  if (params?.hospitalId) searchParams.set("hospitalId", String(params.hospitalId));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  
  const url = `/api/physicians?${searchParams.toString()}`;
  
  return useQuery<PaginatedResult<Physician>>({
    queryKey: [url],
  });
}

export function usePhysician(idOrSlug: string | number) {
  return useQuery<Physician>({
    queryKey: [`/api/physicians/${idOrSlug}`],
    enabled: !!idOrSlug,
  });
}

export function usePhysicianAffiliations(physicianId: number) {
  return useQuery<(PhysicianAffiliation & { hospitalName: string; hospitalCity: string; hospitalState: string })[]>({
    queryKey: [`/api/physicians/${physicianId}/affiliations`],
    enabled: !!physicianId,
  });
}

export function usePhysicianSpecialties() {
  return useQuery<string[]>({
    queryKey: ["/api/physicians/specialties"],
  });
}

export function usePhysicianCities() {
  return useQuery<string[]>({
    queryKey: ["/api/physicians/cities"],
  });
}

export function useHospitalPhysicians(hospitalId: number) {
  return useQuery<(Physician & { role: string; department: string | null })[]>({
    queryKey: [`/api/hospitals/${hospitalId}/physicians`],
    enabled: !!hospitalId,
  });
}
