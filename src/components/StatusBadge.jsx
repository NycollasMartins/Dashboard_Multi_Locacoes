import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  "Disponível": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Alugado": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Manutenção": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Indisponível": "bg-red-500/10 text-red-700 border-red-200",
  "Pendente": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Pago": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Parcial": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Atrasado": "bg-red-500/10 text-red-700 border-red-200",
  "Reservado": "bg-violet-500/10 text-violet-700 border-violet-200",
  "Em andamento": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Devolvido": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Cancelado": "bg-gray-500/10 text-gray-700 border-gray-200",
  "Emitida": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Vencida": "bg-red-500/10 text-red-700 border-red-200",
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`font-medium text-xs ${STATUS_COLORS[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </Badge>
  );
}