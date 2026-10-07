import { Card, CardContent } from "@/components/ui/card";

interface StudentStatsProps {
  total: number;
  active: number;
  courses: number;
}

export function StudentStats({ total, active, courses }: StudentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 rounded-[16px] shadow-sm" style={{ borderLeftColor: "var(--secondary)" }}>
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Total de Alunos</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{total}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 rounded-[16px] shadow-sm" style={{ borderLeftColor: "var(--secondary)" }}>
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Alunos Ativos</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{active}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 rounded-[16px] shadow-sm" style={{ borderLeftColor: "var(--secondary)" }}>
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Cursos</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{courses}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
