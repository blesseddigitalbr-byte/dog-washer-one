import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    email?: string;
    course?: string;
    class_group?: string;
    academic_status?: string;
    is_authorized: boolean;
  };
  onEdit: (student: any) => void;
  onDelete: (id: string) => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  return (
    <div className="border-l-4 border-l-amber-600 bg-white rounded-[16px] shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="font-bold text-gray-900">{student.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{student.email || "-"}</p>
      </div>

      <div className="grid grid-cols-3 gap-8 flex-1 ml-8">
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Curso</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{student.course || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Turma</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{student.class_group || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{student.academic_status || "-"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Badge variant={student.is_authorized ? "default" : "secondary"}>
          {student.is_authorized ? "Autorizado" : "Bloqueado"}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(student)}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(student.id)}
          className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
