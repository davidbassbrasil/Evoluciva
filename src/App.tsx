import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cursos from "./pages/Cursos";
import CursoDetalhe from "./pages/CursoDetalhe";
import ProfessorDetalhe from "./pages/ProfessorDetalhe";
import Sobre from "./pages/Sobre";
import AlunoLogin from "./pages/aluno/Login";
import AlunoDashboard from "./pages/aluno/Dashboard";
import CursoPlayer from "./pages/aluno/CursoPlayer";
import AlunoConfiguracoes from "./pages/aluno/Configuracoes";
import AlunoModulos from "./pages/aluno/Modulos";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import Links from "./pages/Links";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCursos from "./pages/admin/Cursos";
import AdminTurmas from "./pages/admin/Turmas";
import AdminAulas from "./pages/admin/Aulas";
import { AdminBanners, AdminProfessores, AdminTags, AdminDepoimentos, AdminFAQ, AdminPopups } from "./pages/admin/Pages";
import AdminAlunos from "./pages/admin/Alunos";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminAcesso from "./pages/admin/Acesso";
import AdminModulos from "./pages/admin/Modulos";
import AdminCupons from "./pages/admin/Cupons";
import AdminAppSettings from "./pages/admin/AppSettings";
import AdminImpersonarAluno from "./pages/admin/ImpersonarAluno";
import CheckoutCart from "./pages/CheckoutCart";
import Cart from "./pages/Cart";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import LGPD from "./pages/LGPD";
import PoliticaDeReembolso from "./pages/PoliticaDeReembolso";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => {
  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/curso/:courseId" element={<CursoDetalhe />} />
          <Route path="/professor/:professorId" element={<ProfessorDetalhe />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/:courseId" element={<Checkout />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/lgpd" element={<LGPD />} />
          <Route path="/politica-de-reembolso" element={<PoliticaDeReembolso />} />
          <Route path="/links" element={<Links />} />
          <Route path="/aluno/login" element={<AlunoLogin />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
          <Route path="/aluno/curso/:turmaId" element={<CursoPlayer />} />
          <Route path="/aluno/configuracoes" element={<AlunoConfiguracoes />} />
          <Route path="/aluno/modulos" element={<AlunoModulos />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute requiredPermission="dashboard"><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/cursos" element={<ProtectedAdminRoute requiredPermission="cursos"><AdminCursos /></ProtectedAdminRoute>} />
          <Route path="/admin/turmas" element={<ProtectedAdminRoute requiredPermission="turmas"><AdminTurmas /></ProtectedAdminRoute>} />
          <Route path="/admin/aulas" element={<ProtectedAdminRoute requiredPermission="aulas"><AdminAulas /></ProtectedAdminRoute>} />
          <Route path="/admin/banners" element={<ProtectedAdminRoute requiredPermission="banners"><AdminBanners /></ProtectedAdminRoute>} />
          <Route path="/admin/popups" element={<ProtectedAdminRoute requiredPermission="popups"><AdminPopups /></ProtectedAdminRoute>} />
          <Route path="/admin/professores" element={<ProtectedAdminRoute requiredPermission="professores"><AdminProfessores /></ProtectedAdminRoute>} />
          <Route path="/admin/tags" element={<ProtectedAdminRoute requiredPermission="tags"><AdminTags /></ProtectedAdminRoute>} />
          <Route path="/admin/depoimentos" element={<ProtectedAdminRoute requiredPermission="depoimentos"><AdminDepoimentos /></ProtectedAdminRoute>} />
          <Route path="/admin/faq" element={<ProtectedAdminRoute requiredPermission="faq"><AdminFAQ /></ProtectedAdminRoute>} />
          <Route path="/admin/alunos" element={<ProtectedAdminRoute requiredPermission="alunos"><AdminAlunos /></ProtectedAdminRoute>} />
          <Route path="/admin/alunos/impersonate/:profileId" element={<ProtectedAdminRoute requiredPermission="alunos"><AdminImpersonarAluno /></ProtectedAdminRoute>} />
          <Route path="/admin/cupons" element={<ProtectedAdminRoute requiredPermission="admin_only"><AdminCupons /></ProtectedAdminRoute>} />
          <Route path="/admin/financeiro" element={<ProtectedAdminRoute requiredPermission="financeiro"><AdminFinanceiro /></ProtectedAdminRoute>} />
          <Route path="/admin/acesso" element={<ProtectedAdminRoute requiredPermission="admin_only"><AdminAcesso /></ProtectedAdminRoute>} />
          <Route path="/admin/modulos" element={<ProtectedAdminRoute requiredPermission="modulos"><AdminModulos /></ProtectedAdminRoute>} />
          <Route path="/admin/app-settings" element={<ProtectedAdminRoute requiredPermission="app_settings"><AdminAppSettings /></ProtectedAdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
