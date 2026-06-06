import { Button } from "@/components/ui/button";
import { Users, BookOpen, Award, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StudentsPage() {
  // Dados de exemplo
  const students = [
    {
      id: 1,
      name: "Pedro Gomes",
      email: "pedro@example.com",
      course: "Grooming Básico",
      enrollmentDate: "2026-01-15",
      status: "ativo",
      progress: 75,
    },
    {
      id: 2,
      name: "Lucas Ferreira",
      email: "lucas@example.com",
      course: "Grooming Avançado",
      enrollmentDate: "2026-02-20",
      status: "ativo",
      progress: 45,
    },
    {
      id: 3,
      name: "Juliana Rocha",
      email: "juliana@example.com",
      course: "Grooming Básico",
      enrollmentDate: "2025-12-10",
      status: "concluído",
      progress: 100,
    },
    {
      id: 4,
      name: "Rafael Santos",
      email: "rafael@example.com",
      course: "Grooming Especializado",
      enrollmentDate: "2026-03-05",
      status: "ativo",
      progress: 30,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-blue-100 text-blue-800";
      case "concluído":
        return "bg-green-100 text-green-800";
      case "pausado":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Alunos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus alunos e cursos</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full">
            + Novo Aluno
          </Button>
          <Button variant="outline" className="rounded-full">Filtrar</Button>
          <Button variant="outline" className="rounded-full">Relatório</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-accent">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cursos</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border-l-4 border-l-accent">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/5">
                  <TableHead className="text-foreground font-semibold">Nome</TableHead>
                  <TableHead className="text-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-foreground font-semibold">Curso</TableHead>
                  <TableHead className="text-foreground font-semibold">Data de Inscrição</TableHead>
                  <TableHead className="text-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-foreground font-semibold">Progresso</TableHead>
                  <TableHead className="text-foreground font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-accent/5 transition-colors border-b-2 border-b-accent/10 py-2">
                    <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-muted-foreground">{student.course}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-accent/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs rounded-lg">
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs rounded-lg">
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
