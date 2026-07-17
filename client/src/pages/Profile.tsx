import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  owner: "Proprietária",
  admin: "Administradora",
  manager: "Gerente",
  staff: "Equipe",
  student: "Aluna",
};

export default function Profile() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setFullName(user?.name ?? "");
    setDisplayName(user?.displayName ?? user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Perfil atualizado com sucesso");
    },
    onError: error => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateProfile.mutate({ fullName, displayName, phone });
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Meu Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize seus dados pessoais. Empresa, unidade e permissões são protegidas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>Essas informações aparecem dentro da DWO.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de exibição</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  maxLength={80}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  É o nome mostrado no topo do sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone ou WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  maxLength={30}
                />
              </div>

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Acesso</CardTitle>
            <CardDescription>Informações controladas pela administração.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Função</p>
              <p className="font-medium">{roleLabels[user?.role ?? ""] ?? user?.role}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
