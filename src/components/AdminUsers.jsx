import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Administrador", desc: "Acesso total" },
  { value: "user", label: "Operador", desc: "Acesso operacional" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const invite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviting(false); setInviteOpen(false); setInviteEmail(""); setInviteRole("user");
    base44.entities.User.list().then(setUsers);
  };

  const updateRole = async (userId, role) => {
    await base44.entities.User.update(userId, { role });
    toast.success("Função atualizada");
    base44.entities.User.list().then(setUsers);
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
        {isAdmin && (
          <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Convidar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {(u.full_name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && u.id !== currentUser?.id ? (
                    <Select value={u.role || "user"} onValueChange={v => updateRole(u.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-xs">{u.role === "admin" ? "Admin" : "Operador"}</Badge>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>}
          </div>
        )}
      </CardContent>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>E-mail</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div><Label>Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label} — {r.desc}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={invite} disabled={inviting || !inviteEmail}>{inviting ? "Enviando..." : "Enviar Convite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}