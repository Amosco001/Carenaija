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

export function useTrendingHospitals() {
  return useQuery<(Hospital & { recentReviewCount: number; latestReviewDate: string | null })[]>({
    queryKey: ["/api/hospitals/trending"],
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

// Trust building hooks
export function useTrustStats() {
  return useQuery<{
    totalReviews: number;
    verifiedReviews: number;
    totalHospitals: number;
    verifiedHospitals: number;
    activeUsersMonth: number;
  }>({
    queryKey: ["/api/trust-stats"],
  });
}

export function useTestimonials() {
  return useQuery<Array<{
    id: number;
    name: string;
    role: string | null;
    location: string | null;
    quote: string;
    rating: number | null;
    avatarUrl: string | null;
  }>>({
    queryKey: ["/api/testimonials"],
  });
}

export function usePressMentions() {
  return useQuery<Array<{
    id: number;
    title: string;
    source: string;
    sourceLogoUrl: string | null;
    articleUrl: string | null;
    excerpt: string | null;
    mentionType: string;
  }>>({
    queryKey: ["/api/press-mentions"],
  });
}

export function useUserHelpfulVotes() {
  return useQuery<Array<{
    reviewId: number;
    reviewType: string;
  }>>({
    queryKey: ["/api/user/helpful-votes"],
  });
}

export function useVoteReviewHelpful() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, reviewType }: { reviewId: number; reviewType: string }) => {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        body: JSON.stringify({ reviewType }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/helpful-votes"] });
    },
  });
}

export function useRemoveHelpfulVote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, reviewType }: { reviewId: number; reviewType: string }) => {
      const res = await fetch(`/api/reviews/${reviewId}/helpful?reviewType=${reviewType}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/helpful-votes"] });
    },
  });
}

export function useHospitalResponseRate(hospitalId: number) {
  return useQuery<{ responseRate: number }>({
    queryKey: [`/api/hospitals/${hospitalId}/response-rate`],
    enabled: !!hospitalId,
  });
}

export function useHospitalResponses(hospitalId: number) {
  return useQuery<Array<{
    id: number;
    reviewId: number;
    reviewType: string;
    responseText: string;
    responderName: string;
    responderTitle: string | null;
    createdAt: string;
  }>>({
    queryKey: [`/api/hospitals/${hospitalId}/responses`],
    enabled: !!hospitalId,
  });
}

export function useHospitalComments(hospitalId: number) {
  return useQuery<Array<{
    id: number;
    hospitalId: number;
    userId: string;
    displayName: string;
    isAnonymous: boolean;
    commentText: string;
    recommends: boolean | null;
    helpfulCount: number;
    createdAt: string;
  }>>({
    queryKey: [`/api/hospitals/${hospitalId}/comments`],
    enabled: !!hospitalId,
  });
}

export function useCreateHospitalComment(hospitalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { commentText: string; recommends?: boolean; isAnonymous: boolean }) => {
      const res = await fetch(`/api/hospitals/${hospitalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}/comments`] });
    },
  });
}

export function useDeleteHospitalComment(hospitalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/hospitals/${hospitalId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospitalId}/comments`] });
    },
  });
}
