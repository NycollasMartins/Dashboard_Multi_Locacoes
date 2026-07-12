import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useRealtime } from "@/hooks/useRealtime";
import DataTable from "@/components/DataTable";
import ClientDialog from "@/components/ClientDialog";

export default function Clients() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => base44.entities.Client.list("-created_date").then(d => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, []);
  useRealtime("clients", load);

  const columns = [
    { key: "name", label: "Nome", accessor: "name" },
    { key: "company", label: "Empresa", accessor: "company" },
    { key: "email", label: "E-mail", accessor: "email" },
    { key: "phone", label: "Telefone", accessor: "phone" },
    { key: "cpf_cnpj", label: "CPF/CNPJ", accessor: "cpf_cnpj" },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seus clientes</p>
      </div>
      <DataTable
        columns={columns}
        data={items}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        addLabel="Novo Cliente"
        searchPlaceholder="Buscar clientes..."
        onRowClick={row => { setEditing(row); setDialogOpen(true); }}
      />
      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} onSaved={load} />
    </div>
  );
}