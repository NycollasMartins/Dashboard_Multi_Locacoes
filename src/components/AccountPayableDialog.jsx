import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const CATEGORIES = ["Fornecedor", "Imposto", "Aluguel", "Serviço", "Equipamento", "Outro"];
const STATUSES = ["Pendente", "Pago", "Atrasado", "Cancelado"];

export default function AccountPayableDialog({ open, onOpenChange, item, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item || { status: "Pendente", category: "Fornecedor", due_date: new Date().toISOString().split("T")[0] });
  }, [item, open]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (item?.id) await base44.entities.AccountPayable.update(item.id, form);
    else await base44.entities.AccountPayable.create(form);
    setSaving(false); onOpenChange(false); onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir esta conta?")) return;
    await base44.entities.AccountPayable.delete(item.id);
    onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div><Label>Descrição *</Label><Input value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label>
              <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.value || ""} onChange={e => set("value", Number(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Vencimento *</Label><Input type="date" value={form.due_date || ""} onChange={e => set("due_date", e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={form.status || "Pendente"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {form.status === "Pago" && (
            <div><Label>Data de Pagamento</Label><Input type="date" value={form.payment_date || ""} onChange={e => set("payment_date", e.target.value)} /></div>
          )}
          <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.description || !form.value || !form.due_date}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}