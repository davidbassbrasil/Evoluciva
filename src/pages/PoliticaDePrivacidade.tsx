import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';
import { formatBRDateTime } from '@/lib/dates';

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
          
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground mb-6">
              Última atualização: {formatBRDateTime(new Date())}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground">
                A Edu Sampaio Cursos está comprometida com a proteção da privacidade de seus usuários. 
                Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Dados Coletados</h2>
              <p className="text-muted-foreground mb-4">Coletamos os seguintes tipos de informações:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Dados de cadastro: nome, e-mail, telefone, CPF</li>
                <li>Dados de pagamento: informações necessárias para processamento de compras</li>
                <li>Dados de uso: histórico de acesso, progresso nos cursos, preferências</li>
                <li>Dados técnicos: endereço IP, tipo de navegador, dispositivo utilizado</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Uso das Informações</h2>
              <p className="text-muted-foreground mb-4">Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fornecer acesso aos cursos e serviços contratados</li>
                <li>Processar pagamentos e emitir notas fiscais</li>
                <li>Enviar comunicações sobre seus cursos e novidades</li>
                <li>Melhorar nossa plataforma e experiência do usuário</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
                processadores de pagamento, serviços de hospedagem, autoridades quando exigido por lei, 
                e prestadores de serviços essenciais para operação da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground">
                Implementamos medidas técnicas e organizacionais para proteger suas informações, 
                incluindo criptografia, controle de acesso e monitoramento de segurança.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
              <p className="text-muted-foreground mb-4">Você tem direito a:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou incorretos</li>
                <li>Solicitar exclusão de seus dados</li>
                <li>Revogar consentimento para uso de dados</li>
                <li>Solicitar portabilidade de dados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies para melhorar sua experiência na plataforma, lembrar preferências 
                e analisar o uso do site. Você pode configurar seu navegador para recusar cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
              <p className="text-muted-foreground">
                Para questões sobre privacidade, entre em contato: contato@edusampaio.com
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
