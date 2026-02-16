import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  role?: string;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  getReturnUrl: () => string | null;
  clearReturnUrl: () => void;
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

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || "Login failed" };
      }

      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Something went wrong. Please try again." };
    }
  };

  const register = async (registerData: { email: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || "Registration failed" };
      }

      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Something went wrong. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    window.location.href = "/";
  };

  const getReturnUrl = () => {
    return sessionStorage.getItem('returnTo');
  };

  const clearReturnUrl = () => {
    sessionStorage.removeItem('returnTo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refetchUser,
        getReturnUrl,
        clearReturnUrl,
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
