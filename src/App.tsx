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
import { AdminBanners, AdminProfessores, AdminTags, AdminDepoimentos, AdminFAQ } from "./pages/admin/Pages";
import AdminAlunos from "./pages/admin/Alunos";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminAcesso from "./pages/admin/Acesso";
import AdminModulos from "./pages/admin/Modulos";
import CheckoutCart from "./pages/CheckoutCart";
import Cart from "./pages/Cart";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import LGPD from "./pages/LGPD";
import PoliticaDeReembolso from "./pages/PoliticaDeReembolso";

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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/cursos" element={<AdminCursos />} />
          <Route path="/admin/turmas" element={<AdminTurmas />} />
          <Route path="/admin/aulas" element={<AdminAulas />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/professores" element={<AdminProfessores />} />
          <Route path="/admin/tags" element={<AdminTags />} />
          <Route path="/admin/depoimentos" element={<AdminDepoimentos />} />
          <Route path="/admin/faq" element={<AdminFAQ />} />
          <Route path="/admin/alunos" element={<AdminAlunos />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/acesso" element={<AdminAcesso />} />
          <Route path="/admin/modulos" element={<AdminModulos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
