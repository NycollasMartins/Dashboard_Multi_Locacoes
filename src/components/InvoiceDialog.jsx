import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Trash2, Upload } from "lucide-react";

export default function InvoiceDialog({ open, onOpenChange, item, clients, rentals, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(item || { status: "Emitida" }); }, [item, open]);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_url", file_url);
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const client = clients.find(c => c.id === form.client_id);
    const data = { ...form, client_name: client?.name || form.client_name || "" };
    if (item?.id) await base44.entities.Invoice.update(item.id, data);
    else await base44.entities.Invoice.create(data);
    setSaving(false); onOpenChange(false); onSaved();
  };

  const remove = async () => {
    if (!confirm("Excluir esta nota fiscal?")) return;
    await base44.entities.Invoice.delete(item.id);
    onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nº da NF *</Label><Input value={form.number || ""} onChange={e => set("number", e.target.value)} /></div>
            <div><Label>Cliente</Label>
              <Select value={form.client_id || ""} onValueChange={v => set("client_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.value || ""} onChange={e => set("value", Number(e.target.value))} /></div>
            <div><Label>Data Emissão *</Label><Input type="date" value={form.issue_date || ""} onChange={e => set("issue_date", e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={form.status || "Emitida"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Emitida", "Paga", "Cancelada", "Vencida"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Locação</Label>
            <Select value={form.rental_id || ""} onValueChange={v => set("rental_id", v)}>
              <SelectTrigger><SelectValue placeholder="Vincular a uma locação (opcional)" /></SelectTrigger>
              <SelectContent>{rentals.map(r => <SelectItem key={r.id} value={r.id}>{r.client_name} — {r.equipment_names}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={2} /></div>
          <div>
            <Label>Arquivo PDF</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer gap-2"><Upload className="w-4 h-4" />{uploading ? "Enviando..." : "Upload"}<input type="file" className="hidden" accept=".pdf" onChange={uploadFile} /></label>
              </Button>
              {form.file_url && <a href={form.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Ver arquivo</a>}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {item && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.number || !form.value || !form.issue_date}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}