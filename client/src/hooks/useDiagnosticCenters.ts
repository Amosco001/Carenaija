import { useQuery } from "@tanstack/react-query";
import type { DiagnosticCenter, DiagnosticTest } from "@shared/schema";

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useDiagnosticCenters(params?: { state?: string; city?: string; search?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.state) searchParams.set("state", params.state);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  
  const url = `/api/diagnostic-centers?${searchParams.toString()}`;
  
  return useQuery<PaginatedResult<DiagnosticCenter>>({
    queryKey: [url],
  });
}

export function useDiagnosticCenter(idOrSlug: string | number) {
  return useQuery<DiagnosticCenter>({
    queryKey: [`/api/diagnostic-centers/${idOrSlug}`],
    enabled: !!idOrSlug,
  });
}

export function useDiagnosticTests(centerId: number) {
  return useQuery<DiagnosticTest[]>({
    queryKey: [`/api/diagnostic-centers/${centerId}/tests`],
    enabled: !!centerId,
  });
}

export function useSearchDiagnosticTests(params?: { category?: string; search?: string; minPrice?: number; maxPrice?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.minPrice) searchParams.set("minPrice", String(params.minPrice));
  if (params?.maxPrice) searchParams.set("maxPrice", String(params.maxPrice));
  
  const url = `/api/diagnostic-tests/search?${searchParams.toString()}`;
  
  return useQuery<(DiagnosticTest & { centerName: string; centerCity: string; centerState: string })[]>({
    queryKey: [url],
  });
}
