import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function RentalDialog({ open, onOpenChange, item, clients, equipment, onSaved }) {
  const [form, setForm] = useState({});
  const [selectedEquip, setSelectedEquip] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm(item);
      setSelectedEquip(item.equipment_ids || []);
    } else {
      setForm({ payment_status: "Pendente", rental_status: "Reservado", payment_type: "Parcela Única" });
      setSelectedEquip([]);
    }
  }, [item, open]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleEquip = (id) => {
    setSelectedEquip(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    const client = clients.find(c => c.id === form.client_id);
    const equipNames = equipment.filter(e => selectedEquip.includes(e.id)).map(e => e.name).join(", ");
    const data = { ...form, client_name: client?.name || "", equipment_ids: selectedEquip, equipment_names: equipNames };
    if (item?.id) await base44.entities.Rental.update(item.id, data);
    else await base44.entities.Rental.create(data);
    setSaving(false); onOpenChange(false); onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir esta locação?")) return;
    await base44.entities.Rental.delete(item.id);
    onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar Locação" : "Nova Locação"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div><Label>Cliente *</Label>
            <Select value={form.client_id || ""} onValueChange={v => set("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipamentos</Label>
            <div className="border rounded-lg p-3 max-h-36 overflow-y-auto space-y-2 mt-1">
              {equipment.map(e => (
                <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedEquip.includes(e.id)} onCheckedChange={() => toggleEquip(e.id)} />
                  {e.name} <span className="text-muted-foreground">({e.status})</span>
                </label>
              ))}
              {equipment.length === 0 && <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início *</Label><Input type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
            <div><Label>Data Devolução *</Label><Input type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor Total *</Label><Input type="number" step="0.01" value={form.total_value || ""} onChange={e => set("total_value", Number(e.target.value))} /></div>
            <div><Label>Tipo Pagamento</Label>
              <Select value={form.payment_type || "Parcela Única"} onValueChange={v => set("payment_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Parcela Única">Parcela Única</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status Pagamento</Label>
              <Select value={form.payment_status || "Pendente"} onValueChange={v => set("payment_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Pendente", "Pago", "Parcial", "Atrasado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status Locação</Label>
              <Select value={form.rental_status || "Reservado"} onValueChange={v => set("rental_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Reservado", "Em andamento", "Devolvido", "Cancelado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <Checkbox id="is_bonus" checked={!!form.is_bonus} onCheckedChange={v => set("is_bonus", v)} />
            <label htmlFor="is_bonus" className="text-sm font-medium text-purple-700 dark:text-purple-300 cursor-pointer">🎁 Bonificação (sem custo — parceria)</label>
          </div>
          <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.client_id || !form.start_date || !form.end_date || !form.total_value}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}