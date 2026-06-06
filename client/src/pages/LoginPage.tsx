import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar se usuário existe
    const users = JSON.parse(localStorage.getItem("groomerflow_users") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      toast.error("Email ou senha inválidos");
      setIsLoading(false);
      return;
    }

    // Sessão com expiração de 24 horas
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const session = {
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem("groomerflow_user", JSON.stringify(user));
    localStorage.setItem("groomerflow_session", JSON.stringify(session));
    
    // Forçar re-render e navegação
    toast.success("Login realizado!");
    
    // Usar window.location para garantir navegação
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar to-sidebar/90 p-4">
      <Card className="w-full max-w-md p-8 bg-card border-2 border-primary/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">GroomerFlow</h1>
          <p className="text-muted-foreground mt-2">Acesse sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E8D5C4] hover:bg-[#D4C4B0] text-[#07111E] font-semibold"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Não tem conta?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Criar conta
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
