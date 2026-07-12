import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useRealtime } from "@/hooks/useRealtime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import ExpenseDialog from "@/components/ExpenseDialog";
import AccountPayableDialog from "@/components/AccountPayableDialog";
import QuoteDialog from "@/components/QuoteDialog";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Bell, Gift } from "lucide-react";

const fmt = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = new Date().toISOString().split("T")[0];

export default function Financeiro() {
  const qc = useQueryClient();
  const [expDialog, setExpDialog] = useState({ open: false, item: null });
  const [apDialog, setApDialog] = useState({ open: false, item: null });
  const [quoteDialog, setQuoteDialog] = useState({ open: false, item: null });

  const { data: rentals = [] } = useQuery({ queryKey: ["rentals"], queryFn: () => base44.entities.Rental.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.Expense.list() });
  const { data: payables = [] } = useQuery({ queryKey: ["payables"], queryFn: () => base44.entities.AccountPayable.list() });
  const { data: quotes = [] } = useQuery({ queryKey: ["quotes"], queryFn: () => base44.entities.Quote.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: () => base44.entities.Equipment.list() });

  // Tempo real: qualquer mudança nessas tabelas atualiza a tela na hora.
  useRealtime(["rentals", "expenses", "accounts_payable", "quotes", "clients", "equipment"], () => qc.invalidateQueries());

  // Cash flow calculations
  const paidRentals = rentals.filter(r => r.payment_status === "Pago" && !r.is_bonus);
  const pendingRentals = rentals.filter(r => ["Pendente", "Parcial"].includes(r.payment_status) && !r.is_bonus);
  const overdueRentals = rentals.filter(r => r.payment_status === "Atrasado" && !r.is_bonus);
  const bonusRentals = rentals.filter(r => r.is_bonus);
  const totalReceived = paidRentals.reduce((s, r) => s + (r.total_value || 0), 0);
  const totalPending = pendingRentals.reduce((s, r) => s + (r.total_value || 0), 0);
  const totalOverdue = overdueRentals.reduce((s, r) => s + (r.total_value || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.value || 0), 0);
  const totalPayables = payables.filter(p => p.status === "Pendente").reduce((s, p) => s + (p.value || 0), 0);

  // Receivables grouped by client
  const receivablesByClient = clients.map(c => {
    const clientRentals = pendingRentals.filter(r => r.client_id === c.id);
    const total = clientRentals.reduce((s, r) => s + (r.total_value || 0), 0);
    return { ...c, total, count: clientRentals.length };
  }).filter(c => c.total > 0);

  // Notifications
  const notifications = [
    ...overdueRentals.map(r => ({ type: "danger", msg: `Locação de ${r.client_name} está ATRASADA — ${fmt(r.total_value)}` })),
    ...payables.filter(p => p.status === "Pendente" && p.due_date <= today).map(p => ({ type: "danger", msg: `Conta a pagar vencida: ${p.description} — ${fmt(p.value)}` })),
    ...payables.filter(p => p.status === "Pendente" && p.due_date > today && p.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]).map(p => ({ type: "warning", msg: `Conta a pagar vence em breve: ${p.description} — ${fmt(p.value)} (${p.due_date})` })),
    ...pendingRentals.filter(r => r.end_date < today).map(r => ({ type: "warning", msg: `Locação encerrada com pagamento pendente: ${r.client_name} — ${fmt(r.total_value)}` })),
  ];

  const expenseColumns = [
    { key: "date", label: "Data", accessor: "date" },
    { key: "description", label: "Descrição", accessor: "description" },
    { key: "category", label: "Categoria", render: r => <Badge variant="secondary">{r.category}</Badge> },
    { key: "value", label: "Valor", render: r => <span className="font-semibold text-destructive">{fmt(r.value)}</span> },
  ];

  const payableColumns = [
    { key: "due_date", label: "Vencimento", accessor: "due_date" },
    { key: "description", label: "Descrição", accessor: "description" },
    { key: "category", label: "Categoria", render: r => <Badge variant="secondary">{r.category}</Badge> },
    { key: "value", label: "Valor", render: r => <span className="font-semibold">{fmt(r.value)}</span> },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
  ];

  const quoteColumns = [
    { key: "client_name", label: "Cliente", accessor: "client_name" },
    { key: "equipment_names", label: "Equipamentos", accessor: "equipment_names" },
    { key: "start_date", label: "Início", accessor: "start_date" },
    { key: "total_value", label: "Total", render: r => <span className="font-semibold text-primary">{fmt(r.total_value)}</span> },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
  ];

  const bonusColumns = [
    { key: "client_name", label: "Cliente", accessor: "client_name" },
    { key: "equipment_names", label: "Equipamentos", accessor: "equipment_names" },
    { key: "start_date", label: "Início", accessor: "start_date" },
    { key: "end_date", label: "Fim", accessor: "end_date" },
    { key: "rental_status", label: "Status", render: r => <StatusBadge status={r.rental_status} /> },
    { key: "bonus", label: "Tipo", render: () => <Badge className="bg-purple-100 text-purple-700">🎁 Bonificação</Badge> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão financeira completa do negócio</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg text-sm font-medium">
            <Bell className="w-4 h-4" />
            {notifications.length} alerta{notifications.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-muted-foreground">Recebido</p><p className="text-lg font-bold text-green-600">{fmt(totalReceived)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-yellow-600" /></div>
            <div><p className="text-xs text-muted-foreground">A Receber</p><p className="text-lg font-bold text-yellow-600">{fmt(totalPending)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-muted-foreground">Em Atraso</p><p className="text-lg font-bold text-red-600">{fmt(totalOverdue)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">Contas a Pagar</p><p className="text-lg font-bold text-blue-600">{fmt(totalPayables)}</p></div>
          </div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="fluxo">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="contas">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamentos</TabsTrigger>
          <TabsTrigger value="bonificacao">Bonificações</TabsTrigger>
          <TabsTrigger value="alertas" className="relative">
            Alertas
            {notifications.length > 0 && <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">{notifications.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* FLUXO DE CAIXA */}
        <TabsContent value="fluxo" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">A Receber por Cliente</CardTitle></CardHeader>
              <CardContent>
                {receivablesByClient.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum valor pendente</p>
                ) : receivablesByClient.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.count} locação{c.count > 1 ? "ões" : ""} pendente{c.count > 1 ? "s" : ""}</p>
                    </div>
                    <span className="font-bold text-yellow-600">{fmt(c.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Resumo do Fluxo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Recebido</span>
                  <span className="font-bold text-green-600">{fmt(totalReceived)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">A Receber</span>
                  <span className="font-bold text-yellow-600">{fmt(totalPending)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Em Atraso</span>
                  <span className="font-bold text-red-600">{fmt(totalOverdue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Gastos</span>
                  <span className="font-bold text-blue-600">- {fmt(totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-muted/50 rounded-lg px-2">
                  <span className="text-sm font-semibold">Saldo Atual</span>
                  <span className={`font-bold text-lg ${totalReceived - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(totalReceived - totalExpenses)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GASTOS */}
        <TabsContent value="gastos" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 mb-2">
            {["Transporte", "Montagem", "Imposto"].map(cat => {
              const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.value || 0), 0);
              return (
                <Card key={cat}><CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">{cat}</p>
                  <p className="text-xl font-bold text-destructive">{fmt(total)}</p>
                </CardContent></Card>
              );
            })}
          </div>
          <DataTable
            columns={expenseColumns}
            data={expenses}
            onAdd={() => setExpDialog({ open: true, item: null })}
            addLabel="Novo Gasto"
            searchPlaceholder="Buscar gastos..."
            onRowClick={r => setExpDialog({ open: true, item: r })}
          />
        </TabsContent>

        {/* CONTAS A PAGAR */}
        <TabsContent value="contas" className="mt-4">
          <DataTable
            columns={payableColumns}
            data={payables}
            onAdd={() => setApDialog({ open: true, item: null })}
            addLabel="Nova Conta"
            searchPlaceholder="Buscar contas..."
            onRowClick={r => setApDialog({ open: true, item: r })}
          />
        </TabsContent>

        {/* ORÇAMENTOS */}
        <TabsContent value="orcamento" className="mt-4">
          <DataTable
            columns={quoteColumns}
            data={quotes}
            onAdd={() => setQuoteDialog({ open: true, item: null })}
            addLabel="Novo Orçamento"
            searchPlaceholder="Buscar orçamentos..."
            onRowClick={r => setQuoteDialog({ open: true, item: r })}
          />
        </TabsContent>

        {/* BONIFICAÇÕES */}
        <TabsContent value="bonificacao" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <Gift className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-purple-700 dark:text-purple-300">Locações marcadas como bonificação não entram no fluxo de caixa e são registradas sem custo (parcerias).</p>
          </div>
          <DataTable
            columns={bonusColumns}
            data={bonusRentals}
            searchPlaceholder="Buscar bonificações..."
          />
        </TabsContent>

        {/* ALERTAS */}
        <TabsContent value="alertas" className="mt-4">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum alerta no momento. Tudo em dia!</p>
              </div>
            ) : notifications.map((n, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${n.type === "danger" ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" : "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300"}`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{n.msg}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ExpenseDialog open={expDialog.open} onOpenChange={o => setExpDialog(p => ({ ...p, open: o }))} item={expDialog.item} onSaved={() => qc.invalidateQueries({ queryKey: ["expenses"] })} />
      <AccountPayableDialog open={apDialog.open} onOpenChange={o => setApDialog(p => ({ ...p, open: o }))} item={apDialog.item} onSaved={() => qc.invalidateQueries({ queryKey: ["payables"] })} />
      <QuoteDialog open={quoteDialog.open} onOpenChange={o => setQuoteDialog(p => ({ ...p, open: o }))} item={quoteDialog.item} clients={clients} equipment={equipment} onSaved={() => qc.invalidateQueries({ queryKey: ["quotes"] })} />
    </div>
  );
}