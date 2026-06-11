import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function ClientDialog({ open, onOpenChange, item, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(item || {}); }, [item, open]);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (item?.id) await base44.entities.Client.update(item.id, form);
    else await base44.entities.Client.create(form);
    setSaving(false); onOpenChange(false); onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir este cliente?")) return;
    await base44.entities.Client.delete(item.id);
    onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.name || ""} onChange={e => set("name", e.target.value)} /></div>
            <div><Label>Empresa</Label><Input value={form.company || ""} onChange={e => set("company", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>E-mail</Label><Input value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj || ""} onChange={e => set("cpf_cnpj", e.target.value)} /></div>
            <div><Label>Endereço</Label><Input value={form.address || ""} onChange={e => set("address", e.target.value)} /></div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}