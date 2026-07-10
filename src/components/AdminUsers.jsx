import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Administrador", desc: "Acesso total" },
  { value: "user", label: "Operador", desc: "Acesso operacional" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("ativos");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const invite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole, inviteName);
    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviting(false); setInviteOpen(false); setInviteName(""); setInviteEmail(""); setInviteRole("user");
    base44.entities.User.list().then(setUsers);
  };

  const updateRole = async (userId, role) => {
    await base44.entities.User.update(userId, { role });
    toast.success("Função atualizada");
    base44.entities.User.list().then(setUsers);
  };

  const toggleArchive = async (u) => {
    const archiving = !u.archived;
    const nome = u.full_name || u.email;
    const msg = archiving
      ? `Arquivar ${nome}? A pessoa perde o acesso ao sistema, mas o cadastro é mantido e pode ser reativado depois.`
      : `Reativar ${nome}? A pessoa volta a ter acesso ao sistema.`;
    if (!confirm(msg)) return;
    try {
      await base44.users.setArchived(u.id, archiving);
      toast.success(archiving ? "Usuário arquivado" : "Usuário reativado");
      base44.entities.User.list().then(setUsers);
    } catch (e) {
      toast.error(e?.message || "Não foi possível concluir a ação.");
    }
  };

  const removeUser = async (u) => {
    const nome = u.full_name || u.email;
    if (!confirm(`Excluir o usuário ${nome}? Esta ação é PERMANENTE e não pode ser desfeita.`)) return;
    try {
      await base44.users.deleteUser(u.id);
      toast.success("Usuário excluído");
      base44.entities.User.list().then(setUsers);
    } catch (e) {
      toast.error(e?.message || "Não foi possível excluir o usuário.");
    }
  };

  const isAdmin = currentUser?.role === "admin";

  const renderRow = (u) => {
    const pending = !u.archived && !u.confirmed_at;
    const canManage = isAdmin && u.id !== currentUser?.id;
    return (
      <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 ${u.archived ? "opacity-70" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {(u.full_name || u.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              {u.full_name || "Sem nome"}
              {u.archived && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Arquivado</Badge>}
              {pending && <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">Convite pendente</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <Select value={u.role || "user"} onValueChange={v => updateRole(u.id, v)}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {!pending && (
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title={u.archived ? "Reativar" : "Arquivar"}
                  onClick={() => toggleArchive(u)}
                >
                  {u.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </Button>
              )}
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title={pending ? "Cancelar convite" : "Excluir"}
                onClick={() => removeUser(u)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="text-xs">{u.role === "admin" ? "Admin" : "Operador"}</Badge>
          )}
        </div>
      </div>
    );
  };

  const activeUsers = users.filter(u => !u.archived && u.confirmed_at);
  const archivedUsers = users.filter(u => u.archived);
  const pendingUsers = users.filter(u => !u.archived && !u.confirmed_at);
  const TABS = [
    { value: "ativos", label: "Ativos", list: activeUsers, empty: "Nenhum usuário ativo." },
    { value: "arquivados", label: "Arquivados", list: archivedUsers, empty: "Nenhum usuário arquivado." },
    { value: "pendentes", label: "Pendentes", list: pendingUsers, empty: "Nenhum convite pendente." },
  ];

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
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                  {t.label}
                  <span className={t.value === tab ? "text-foreground/70" : "text-muted-foreground"}>{t.list.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map(t => (
              <TabsContent key={t.value} value={t.value} className="space-y-3 mt-0">
                {t.list.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-8">{t.empty}</p>
                  : t.list.map(renderRow)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome completo</Label><Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="João da Silva" /></div>
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
            <Button onClick={invite} disabled={inviting || !inviteName || !inviteEmail}>{inviting ? "Enviando..." : "Enviar Convite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}