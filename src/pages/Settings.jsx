import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, Shield } from "lucide-react";
import AdminUsers from "@/components/AdminUsers";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setProfileForm({ full_name: u.full_name, phone: u.phone || "", company: u.company || "" }); });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const saveProfile = async () => {
    setSaving(true);
    await base44.auth.updateMe(profileForm);
    toast.success("Perfil atualizado!");
    setSaving(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Aparência</TabsTrigger>
          <TabsTrigger value="admin" className="gap-2"><Shield className="w-4 h-4" /> Administração</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="max-w-lg border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Informações do Perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome</Label><Input value={profileForm.full_name || ""} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>E-mail</Label><Input value={user?.email || ""} disabled className="bg-muted" /></div>
              <div><Label>Telefone</Label><Input value={profileForm.phone || ""} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Empresa</Label><Input value={profileForm.company || ""} onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))} /></div>
              <Button onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card className="max-w-lg border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Modo Escuro</p>
                  <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
                </div>
                <Switch checked={isDark} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <AdminUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}