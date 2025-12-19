import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Hospital } from "@shared/schema";

const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = "carenaija_compare_hospitals";

interface ComparisonContextType {
  compareList: Hospital[];
  addToCompare: (hospital: Hospital) => boolean;
  removeFromCompare: (hospitalId: number) => void;
  clearCompare: () => void;
  isInCompare: (hospitalId: number) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Hospital[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    } catch {
    }
  }, [compareList]);

  const addToCompare = (hospital: Hospital): boolean => {
    if (compareList.length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    if (compareList.some((h) => h.id === hospital.id)) {
      return false;
    }
    setCompareList((prev) => [...prev, hospital]);
    return true;
  };

  const removeFromCompare = (hospitalId: number) => {
    setCompareList((prev) => prev.filter((h) => h.id !== hospitalId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (hospitalId: number): boolean => {
    return compareList.some((h) => h.id === hospitalId);
  };

  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  return (
    <ComparisonContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
