import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Hospital, PatientReview, EmployeeReview } from "@/lib/types";

export function useHospitals(searchQuery?: string) {
  const url = searchQuery 
    ? `/api/hospitals?search=${encodeURIComponent(searchQuery)}`
    : "/api/hospitals";
  
  return useQuery<Hospital[]>({
    queryKey: [url],
  });
}

export function useHospital(id: number) {
  return useQuery<Hospital>({
    queryKey: [`/api/hospitals/${id}`],
    enabled: !!id,
  });
}

export function usePatientReviews(hospitalId?: number) {
  const url = hospitalId 
    ? `/api/hospitals/${hospitalId}/patient-reviews`
    : "/api/reviews/patient";
  
  return useQuery<PatientReview[]>({
    queryKey: [url],
    enabled: hospitalId ? !!hospitalId : true,
  });
}

export function useAllPatientReviews() {
  return useQuery<PatientReview[]>({
    queryKey: ["/api/reviews/patient"],
  });
}

export function useEmployeeReviews(hospitalId: number) {
  return useQuery<EmployeeReview[]>({
    queryKey: [`/api/hospitals/${hospitalId}/employee-reviews`],
    enabled: !!hospitalId,
  });
}

export function useCreatePatientReview(hospitalId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/hospitals/${hospitalId}/patient-reviews`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}/patient-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}`] });
    },
  });
}

export function useCreateEmployeeReview(hospitalId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/hospitals/${hospitalId}/employee-reviews`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}/employee-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}`] });
    },
  });
}

export function useCreateHospitalSuggestion() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/hospital-suggestions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });
}

export function useCreateClaimRequest(hospitalId: number) {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/hospitals/${hospitalId}/claim-requests`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });
}
