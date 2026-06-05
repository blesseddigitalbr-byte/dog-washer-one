import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Página de Listagem de Unidades
 * 
 * Nota: Para produção, você precisará:
 * 1. Implementar contexto de organização no usuário
 * 2. Passar organizationId real (UUID) em vez de user.id
 * 3. Adicionar validação de permissões no backend
 */
export default function UnitsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // TODO: Substituir por organizationId real do usuário
  // Por enquanto, não filtramos por organização para permitir testes
  const { data: unitsResponse, isLoading } = trpc.units.list.useQuery({
    organizationId: undefined,
  });

  const units = unitsResponse?.data || [];

  const handleNewUnit = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDeactivate = (id: string) => {
    toast.info("Em breve");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
          <p className="text-muted-foreground mt-2">Gerencie as unidades operacionais da sua organização</p>
        </div>
        <Button onClick={handleNewUnit} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.filter((u: any) => u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.filter((u: any) => !u.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Unidades */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Unidades</CardTitle>
          <CardDescription>Todas as unidades cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma unidade cadastrada</p>
              <Button onClick={handleNewUnit} variant="outline">
                Criar primeira unidade
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit: any) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.code}</TableCell>
                      <TableCell>{unit.city || "-"}</TableCell>
                      <TableCell>{unit.phone}</TableCell>
                      <TableCell>{unit.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            unit.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {unit.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(unit.id)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(unit.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário (quando implementado) */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Unidade" : "Criar Nova Unidade"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Formulário em breve</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
