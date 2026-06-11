import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Users, FileText, Receipt, Settings, ChevronLeft, ChevronRight, LogOut, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/equipamentos", label: "Equipamentos", icon: Package },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/locacoes", label: "Locações", icon: FileText },
  { path: "/notas-fiscais", label: "Notas Fiscais", icon: Receipt },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <div className="flex h-screen bg-background font-inter">
      <aside className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col`}>
        <div className={`h-16 flex items-center ${collapsed ? "justify-center" : "px-5"} border-b border-sidebar-border`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-sidebar-foreground tracking-tight">StageGear</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>}
          </button>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}