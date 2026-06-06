import { useState, useEffect } from "react";

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  loginTime: string;
}

export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar usuário do localStorage
    const storedUser = localStorage.getItem("groomerflow_user");
    const storedSession = localStorage.getItem("groomerflow_session");

    if (storedUser && storedSession) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const parsedSession = JSON.parse(storedSession);

        // Verificar se sessão não expirou
        const expiresAt = new Date(parsedSession.expiresAt);
        if (expiresAt > new Date()) {
          setUser(parsedUser);
        } else {
          // Sessão expirada
          localStorage.removeItem("groomerflow_user");
          localStorage.removeItem("groomerflow_session");
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("groomerflow_user");
    localStorage.removeItem("groomerflow_session");
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
