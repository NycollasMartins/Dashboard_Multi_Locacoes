import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import Clients from './pages/Clients';
import Rentals from './pages/Rentals';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Financeiro from './pages/Financeiro';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Protege as rotas internas: exige sessão autenticada.
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  if (isLoadingAuth || !authChecked) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/equipamentos" element={<Equipment />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/locacoes" element={<Rentals />} />
        <Route path="/notas-fiscais" element={<Invoices />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
