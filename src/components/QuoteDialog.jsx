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

const STATUSES = ["Rascunho", "Enviado", "Aprovado", "Recusado"];

export default function QuoteDialog({ open, onOpenChange, item, clients, equipment, onSaved }) {
  const [form, setForm] = useState({});
  const [selectedEquip, setSelectedEquip] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) { setForm(item); setSelectedEquip(item.equipment_ids || []); }
    else { setForm({ status: "Rascunho", tax_percent: 0, transport_cost: 0, assembly_cost: 0, subtotal: 0, total_value: 0 }); setSelectedEquip([]); }
  }, [item, open]);

  const set = (k, v) => setForm(prev => {
    const updated = { ...prev, [k]: v };
    const sub = Number(updated.subtotal) || 0;
    const tr = Number(updated.transport_cost) || 0;
    const as = Number(updated.assembly_cost) || 0;
    const tx = Number(updated.tax_percent) || 0;
    updated.total_value = sub + tr + as + (sub * tx / 100);
    return updated;
  });

  const toggleEquip = (id) => setSelectedEquip(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const save = async () => {
    setSaving(true);
    const client = clients.find(c => c.id === form.client_id);
    const equipNames = equipment.filter(e => selectedEquip.includes(e.id)).map(e => e.name).join(", ");
    const data = { ...form, client_name: client?.name || form.client_name || "", equipment_ids: selectedEquip, equipment_names: equipNames };
    if (item?.id) await base44.entities.Quote.update(item.id, data);
    else await base44.entities.Quote.create(data);
    setSaving(false); onOpenChange(false); onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir este orçamento?")) return;
    await base44.entities.Quote.delete(item.id);
    onOpenChange(false); onSaved();
  };

  const fmt = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cliente</Label>
              <Select value={form.client_id || ""} onValueChange={v => set("client_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status || "Rascunho"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Equipamentos</Label>
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2 mt-1">
              {equipment.map(e => (
                <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedEquip.includes(e.id)} onCheckedChange={() => toggleEquip(e.id)} />
                  {e.name}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início *</Label><Input type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
            <div><Label>Data Fim *</Label><Input type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <p className="text-sm font-semibold text-foreground">Composição do Valor</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subtotal (Locação)</Label><Input type="number" step="0.01" value={form.subtotal || ""} onChange={e => set("subtotal", Number(e.target.value))} /></div>
              <div><Label>Transporte (R$)</Label><Input type="number" step="0.01" value={form.transport_cost || ""} onChange={e => set("transport_cost", Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Montagem (R$)</Label><Input type="number" step="0.01" value={form.assembly_cost || ""} onChange={e => set("assembly_cost", Number(e.target.value))} /></div>
              <div><Label>Imposto (%)</Label><Input type="number" step="0.1" value={form.tax_percent || ""} onChange={e => set("tax_percent", Number(e.target.value))} /></div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-sm">Total</span>
              <span className="font-bold text-primary text-lg">{fmt(form.total_value)}</span>
            </div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.start_date || !form.end_date}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}