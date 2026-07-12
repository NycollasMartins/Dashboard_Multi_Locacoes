import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useRealtime } from "@/hooks/useRealtime";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import EquipmentDialog from "@/components/EquipmentDialog";

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => base44.entities.Equipment.list("-created_date").then(d => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, []);
  useRealtime("equipment", load);

  const columns = [
    { key: "name", label: "Nome", accessor: "name" },
    { key: "category", label: "Categoria", accessor: "category" },
    { key: "location", label: "Localização", accessor: "location" },
    { key: "quantity", label: "Qtd", accessor: "quantity" },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
    { key: "purchase_price", label: "Valor", render: r => r.purchase_price ? `R$ ${r.purchase_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu inventário de equipamentos</p>
      </div>
      <DataTable
        columns={columns}
        data={items}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        addLabel="Novo Equipamento"
        searchPlaceholder="Buscar equipamentos..."
        onRowClick={row => { setEditing(row); setDialogOpen(true); }}
      />
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} onSaved={load} />
    </div>
  );
}