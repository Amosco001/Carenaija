import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch user");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refetchUser = useCallback(async () => {
    setIsLoading(true);
    const userData = await fetchUser();
    setUser(userData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
