import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import RentalDialog from "@/components/RentalDialog";
import moment from "moment";

export default function Rentals() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => Promise.all([
    base44.entities.Rental.list("-created_date"),
    base44.entities.Client.list(),
    base44.entities.Equipment.list(),
  ]).then(([r, c, e]) => { setItems(r); setClients(c); setEquipment(e); setLoading(false); });
  useEffect(() => { load(); }, []);

  const fmt = v => v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

  const columns = [
    { key: "client", label: "Cliente", accessor: "client_name" },
    { key: "equip", label: "Equipamentos", accessor: "equipment_names" },
    { key: "start", label: "Início", render: r => r.start_date ? moment(r.start_date).format("DD/MM/YYYY") : "—" },
    { key: "end", label: "Devolução", render: r => r.end_date ? moment(r.end_date).format("DD/MM/YYYY") : "—" },
    { key: "value", label: "Valor", render: r => fmt(r.total_value) },
    { key: "payment", label: "Pagamento", render: r => <StatusBadge status={r.payment_status} /> },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.rental_status} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locações</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de locações de equipamentos</p>
      </div>
      <DataTable
        columns={columns}
        data={items}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        addLabel="Nova Locação"
        searchPlaceholder="Buscar locações..."
        onRowClick={row => { setEditing(row); setDialogOpen(true); }}
      />
      <RentalDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} clients={clients} equipment={equipment} onSaved={load} />
    </div>
  );
}