import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useRealtime } from "@/hooks/useRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, FileText, DollarSign, TrendingUp, CalendarDays, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import moment from "moment";

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const COLORS = ["hsl(25,95%,53%)", "hsl(173,58%,39%)", "hsl(197,37%,24%)", "hsl(43,74%,66%)"];

export default function Dashboard() {
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    base44.entities.Equipment.list(),
    base44.entities.Client.list(),
    base44.entities.Rental.list(),
    base44.entities.Invoice.list(),
  ]).then(([e, c, r, i]) => {
    setEquipment(e); setClients(c); setRentals(r); setInvoices(i);
    setLoading(false);
  });
  useEffect(() => { load(); }, []);
  useRealtime(["equipment", "clients", "rentals", "invoices"], load);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const monthlyRentals = rentals.filter(r => r.payment_type === "Mensal");
  const mrr = monthlyRentals.reduce((sum, r) => sum + (r.total_value || 0), 0);
  const tcv = rentals.filter(r => r.payment_type === "Parcela Única").reduce((sum, r) => sum + (r.total_value || 0), 0);
  const activeRentals = rentals.filter(r => r.rental_status === "Em andamento");
  const overduePayments = rentals.filter(r => r.payment_status === "Atrasado");

  const statusData = ["Disponível", "Alugado", "Manutenção", "Indisponível"].map(s => ({
    name: s,
    value: equipment.filter(e => e.status === s).length
  })).filter(d => d.value > 0);

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const m = moment().subtract(5 - i, "months");
    const monthRentals = rentals.filter(r => moment(r.start_date).isSame(m, "month"));
    return { name: m.format("MMM"), receita: monthRentals.reduce((s, r) => s + (r.total_value || 0), 0) };
  });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da sua operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR (Mensal)" value={fmt(mrr)} icon={TrendingUp} color="bg-primary/10 text-primary" subtitle={`${monthlyRentals.length} contratos mensais`} />
        <StatCard title="TCV (Parcela Única)" value={fmt(tcv)} icon={DollarSign} color="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Equipamentos" value={equipment.length} icon={Package} color="bg-blue-500/10 text-blue-600" subtitle={`${equipment.filter(e => e.status === "Disponível").length} disponíveis`} />
        <StatCard title="Locações Ativas" value={activeRentals.length} icon={CalendarDays} color="bg-violet-500/10 text-violet-600" />
      </div>

      {overduePayments.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">{overduePayments.length} pagamento(s) em atraso</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last6}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="receita" fill="hsl(25,95%,53%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status dos Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-16">Sem equipamentos</p>}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Clientes" value={clients.length} icon={Users} color="bg-amber-500/10 text-amber-600" />
        <StatCard title="Notas Fiscais" value={invoices.length} icon={FileText} color="bg-teal-500/10 text-teal-600" />
        <StatCard title="Receita Total" value={fmt(rentals.reduce((s, r) => s + (r.total_value || 0), 0))} icon={DollarSign} color="bg-primary/10 text-primary" />
      </div>
    </div>
  );
}