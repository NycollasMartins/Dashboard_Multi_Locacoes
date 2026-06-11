import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const CATEGORIES = ["Iluminação", "Som", "Estrutura", "Palco", "Vídeo", "Elétrica", "Outro"];
const STATUSES = ["Disponível", "Alugado", "Manutenção", "Indisponível"];

export default function EquipmentDialog({ open, onOpenChange, item, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item || { status: "Disponível", quantity: 1 });
  }, [item, open]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (item?.id) {
      await base44.entities.Equipment.update(item.id, form);
    } else {
      await base44.entities.Equipment.create(form);
    }
    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir este equipamento?")) return;
    await base44.entities.Equipment.delete(item.id);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.name || ""} onChange={e => set("name", e.target.value)} /></div>
            <div><Label>Categoria *</Label>
              <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nº de Série</Label><Input value={form.serial_number || ""} onChange={e => set("serial_number", e.target.value)} /></div>
            <div><Label>Localização</Label><Input value={form.location || ""} onChange={e => set("location", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quantidade</Label><Input type="number" value={form.quantity || 1} onChange={e => set("quantity", Number(e.target.value))} /></div>
            <div><Label>Valor Compra</Label><Input type="number" step="0.01" value={form.purchase_price || ""} onChange={e => set("purchase_price", Number(e.target.value))} /></div>
            <div><Label>Data Compra</Label><Input type="date" value={form.purchase_date || ""} onChange={e => set("purchase_date", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label>
              <Select value={form.status || "Disponível"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>NF Compra</Label><Input value={form.invoice_number || ""} onChange={e => set("invoice_number", e.target.value)} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.category}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}