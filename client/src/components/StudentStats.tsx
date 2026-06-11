import { Card, CardContent } from "@/components/ui/card";

interface StudentStatsProps {
  total: number;
  active: number;
  courses: number;
}

export function StudentStats({ total, active, courses }: StudentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-amber-600 rounded-[16px] shadow-sm">
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Total de Alunos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-600 rounded-[16px] shadow-sm">
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Alunos Ativos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{active}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-600 rounded-[16px] shadow-sm">
        <CardContent className="pt-6">
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Cursos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{courses}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
