import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import InvoiceDialog from "@/components/InvoiceDialog";
import moment from "moment";

export default function Invoices() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => Promise.all([
    base44.entities.Invoice.list("-created_date"),
    base44.entities.Client.list(),
    base44.entities.Rental.list(),
  ]).then(([i, c, r]) => { setItems(i); setClients(c); setRentals(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const fmt = v => v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

  const columns = [
    { key: "number", label: "Nº NF", accessor: "number" },
    { key: "client", label: "Cliente", accessor: "client_name" },
    { key: "value", label: "Valor", render: r => fmt(r.value) },
    { key: "date", label: "Emissão", render: r => r.issue_date ? moment(r.issue_date).format("DD/MM/YYYY") : "—" },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
    { key: "desc", label: "Descrição", accessor: "description" },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notas Fiscais</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de notas fiscais</p>
      </div>
      <DataTable
        columns={columns}
        data={items}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        addLabel="Nova Nota Fiscal"
        searchPlaceholder="Buscar notas fiscais..."
        onRowClick={row => { setEditing(row); setDialogOpen(true); }}
      />
      <InvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} clients={clients} rentals={rentals} onSaved={load} />
    </div>
  );
}