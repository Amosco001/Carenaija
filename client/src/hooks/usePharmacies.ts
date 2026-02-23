import { useQuery } from "@tanstack/react-query";
import type { Pharmacy } from "@shared/schema";

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function usePharmacies(params?: { state?: string; city?: string; search?: string; verified?: boolean; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.state) searchParams.set("state", params.state);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.verified !== undefined) searchParams.set("verified", String(params.verified));
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  
  const url = `/api/pharmacies?${searchParams.toString()}`;
  
  return useQuery<PaginatedResult<Pharmacy>>({
    queryKey: [url],
  });
}

export function usePharmacy(idOrSlug: string | number) {
  return useQuery<Pharmacy>({
    queryKey: [`/api/pharmacies/${idOrSlug}`],
    enabled: !!idOrSlug,
  });
}
