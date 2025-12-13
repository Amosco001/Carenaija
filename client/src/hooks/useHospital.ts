import { useQuery } from "@tanstack/react-query";
import type { Hospital } from "@/lib/types";

export function useHospital(id: string) {
  return useQuery<Hospital>({
    queryKey: ["hospital", id],
    queryFn: async () => {
      const response = await fetch(`/api/hospitals/${id}`);
      if (!response.ok) {
        throw new Error("Hospital not found");
      }
      return response.json();
    },
    enabled: !!id,
  });
}
