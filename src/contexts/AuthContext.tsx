import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with your actual auth check (e.g., supabase.auth.getSession())
    // Simulating auth check
    const checkAuth = async () => {
      setIsLoading(true);
      // Placeholder: set to null for now (not signed in)
      setUser(null);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password?: string) => {
    // TODO: Hook up your backend sign-in logic here
    console.log("signIn called with:", email, password);
  };

  const signOut = async () => {
    // TODO: Hook up your backend sign-out logic here
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
