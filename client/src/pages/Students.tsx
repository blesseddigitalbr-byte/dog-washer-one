import { Button } from "@/components/ui/button";
import { Users, BookOpen, Award, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 8;

export default function StudentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
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

  // Pagination logic
  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = students.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-accent">
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
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-accent">
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
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-accent">
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

        {/* Students Cards */}
        <div className="space-y-4">
          {paginatedStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                    student.status
                  )}`}
                >
                  {student.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CURSO</p>
                  <p className="text-sm font-medium text-foreground">{student.course}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">DATA DE INSCRIÇÃO</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PROGRESSO</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground">{student.progress}%</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button size="sm" variant="outline" className="text-xs rounded-lg">
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs rounded-lg">
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Navigation */}
        {students.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>👥 {students.length} alunos encontrados</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Itens por página: <span className="font-semibold">{ITEMS_PER_PAGE}</span></span>
              <span className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(endIndex, students.length)} de {students.length}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
