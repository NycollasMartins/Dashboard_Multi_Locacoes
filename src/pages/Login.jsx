import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    // Se já houver sessão ativa, vai direto pro dashboard.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/", { replace: true });
    });
  }, [navigate]);

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    navigate("/", { replace: true });
  };

  const sendReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Informe seu e-mail.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível enviar o e-mail.");
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
    setResetMode(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background font-inter">
      {/* Painel de marca */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">StageGear</span>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Gestão completa da sua
            <span className="text-primary"> locação de equipamentos</span>.
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Equipamentos, clientes, locações, orçamentos, notas fiscais e o
            financeiro do seu negócio — tudo em um só lugar.
          </p>
        </div>
        <div className="relative text-sm text-slate-500">
          © {new Date().getFullYear()} StageGear · Painel administrativo
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StageGear</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {resetMode ? "Redefinir senha" : "Bem-vindo de volta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {resetMode
                ? "Informe seu e-mail para receber o link de redefinição."
                : "Entre com suas credenciais para acessar o painel."}
            </p>
          </div>

          <form onSubmit={resetMode ? sendReset : signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {!resetMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {resetMode ? "Enviar link" : "Entrar"}
            </Button>

            {resetMode && (
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar para o login
              </button>
            )}
          </form>

          <p className="text-xs text-center text-muted-foreground">
            O acesso é restrito a usuários cadastrados. Solicite um convite ao
            administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
