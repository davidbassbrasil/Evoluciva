import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';
import { formatBRDateTime } from '@/lib/dates';

export default function LGPD() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">LGPD - Lei Geral de Proteção de Dados</h1>
          
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground mb-6">
              Última atualização: {formatBRDateTime(new Date())}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. O que é a LGPD?</h2>
              <p className="text-muted-foreground">
                A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) estabelece regras sobre coleta, 
                armazenamento, tratamento e compartilhamento de dados pessoais, garantindo mais proteção 
                e transparência aos cidadãos brasileiros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Nosso Compromisso</h2>
              <p className="text-muted-foreground">
                A Edu Sampaio Cursos está em conformidade com a LGPD. Tratamos seus dados pessoais com 
                responsabilidade, transparência e segurança, respeitando seus direitos como titular dos dados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Base Legal para Tratamento</h2>
              <p className="text-muted-foreground mb-4">Tratamos seus dados com base nas seguintes hipóteses legais:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados</li>
                <li><strong>Consentimento:</strong> quando você autoriza expressamente o uso</li>
                <li><strong>Legítimo interesse:</strong> para melhorar nossos serviços</li>
                <li><strong>Obrigação legal:</strong> para cumprir exigências legais</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Direitos do Titular</h2>
              <p className="text-muted-foreground mb-4">Conforme a LGPD, você tem os seguintes direitos:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização ou eliminação:</strong> tornar anônimos ou excluir dados desnecessários</li>
                <li><strong>Portabilidade:</strong> transferir seus dados para outro serviço</li>
                <li><strong>Informação:</strong> saber com quem compartilhamos seus dados</li>
                <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> opor-se a tratamento em desacordo com a lei</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Como Exercer Seus Direitos</h2>
              <p className="text-muted-foreground">
                Para exercer qualquer um dos seus direitos, entre em contato com nosso Encarregado 
                de Proteção de Dados (DPO) através do e-mail: contato@edusampaiocursos.com.br
              </p>
              <p className="text-muted-foreground mt-4">
                Responderemos sua solicitação em até 15 dias, conforme estabelecido pela LGPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Encarregado de Dados (DPO)</h2>
              <p className="text-muted-foreground">
                Nosso Encarregado de Proteção de Dados é responsável por receber suas solicitações 
                e garantir o cumprimento da LGPD. Contato: contato@edusampaiocursos.com.br
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Segurança e Incidentes</h2>
              <p className="text-muted-foreground">
                Adotamos medidas técnicas e administrativas para proteger seus dados. 
                Em caso de incidente de segurança que possa causar risco ou dano, 
                comunicaremos você e a ANPD conforme exigido pela lei.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. ANPD</h2>
              <p className="text-muted-foreground">
                Caso entenda que o tratamento de seus dados não está em conformidade com a LGPD, 
                você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD): 
                <a href="https://www.gov.br/anpd" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                  www.gov.br/anpd
                </a>
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
