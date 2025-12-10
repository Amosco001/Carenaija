import { createContext, useContext, useState, ReactNode } from "react";
import { User, LoginCredentials, RegisterCredentials } from "./mockData";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock login logic
    if (credentials.email === "patient@example.com") {
      setUser({
        id: "1",
        name: "Chidi Okonkwo",
        email: "patient@example.com",
        role: "patient",
        createdAt: new Date().toISOString()
      });
      toast({ title: "Welcome back, Chidi!" });
    } else if (credentials.email === "admin@example.com") {
      setUser({
        id: "2",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        createdAt: new Date().toISOString()
      });
      toast({ title: "Admin dashboard access granted." });
    } else if (credentials.email === "doctor@example.com") {
      setUser({
        id: "3",
        name: "Dr. Amara",
        email: "doctor@example.com",
        role: "employee",
        createdAt: new Date().toISOString()
      });
      toast({ title: "Welcome back, Dr. Amara!" });
    } else {
      toast({ 
        title: "Login failed", 
        description: "Invalid credentials. Try patient@example.com / password",
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setUser({
      id: Math.random().toString(),
      name: credentials.name,
      email: credentials.email,
      role: credentials.role,
      createdAt: new Date().toISOString()
    });
    
    toast({ title: "Account created successfully!" });
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    toast({ title: "Logged out successfully" });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
