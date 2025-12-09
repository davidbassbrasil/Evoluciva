import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';

export default function PoliticaDeReembolso() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Política de Reembolso</h1>
          
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Garantia de Satisfação</h2>
              <p className="text-muted-foreground">
                A ConcursaPlus oferece garantia de satisfação de 7 (sete) dias corridos a partir da data 
                da compra, conforme estabelecido pelo Código de Defesa do Consumidor para compras online.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Prazo para Solicitação</h2>
              <p className="text-muted-foreground">
                O reembolso pode ser solicitado em até 7 (sete) dias corridos após a confirmação do pagamento. 
                Após este período, não será possível solicitar reembolso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Como Solicitar Reembolso</h2>
              <p className="text-muted-foreground mb-4">Para solicitar o reembolso:</p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                <li>Envie um e-mail para reembolso@concursaplus.com.br</li>
                <li>Informe seu nome completo, e-mail de cadastro e número do pedido</li>
                <li>Descreva brevemente o motivo da solicitação</li>
                <li>Aguarde a confirmação da solicitação em até 3 dias úteis</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Processamento do Reembolso</h2>
              <p className="text-muted-foreground mb-4">O reembolso será processado da seguinte forma:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Cartão de crédito:</strong> estorno em até 2 faturas subsequentes (prazo da operadora)</li>
                <li><strong>PIX:</strong> devolução em até 5 dias úteis na mesma conta</li>
                <li><strong>Boleto:</strong> transferência em até 10 dias úteis para conta indicada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Valor do Reembolso</h2>
              <p className="text-muted-foreground">
                O reembolso será no valor integral pago, sem nenhum desconto ou taxa. 
                Cupons de desconto utilizados não serão restituídos como crédito.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Cancelamento do Acesso</h2>
              <p className="text-muted-foreground">
                Após a confirmação do reembolso, o acesso ao curso será imediatamente cancelado. 
                Todo o progresso e materiais baixados serão perdidos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Casos Especiais</h2>
              <p className="text-muted-foreground mb-4">Não são elegíveis para reembolso:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Cursos com mais de 30% do conteúdo assistido</li>
                <li>Materiais digitais já baixados</li>
                <li>Certificados já emitidos</li>
                <li>Solicitações após o prazo de 7 dias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Problemas Técnicos</h2>
              <p className="text-muted-foreground">
                Em caso de problemas técnicos que impeçam o acesso ao curso, entre em contato com 
                nosso suporte antes de solicitar reembolso. Faremos o possível para resolver o problema.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas sobre reembolso: reembolso@concursaplus.com.br<br />
                Suporte técnico: suporte@concursaplus.com.br
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
