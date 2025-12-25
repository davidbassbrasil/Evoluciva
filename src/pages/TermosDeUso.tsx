import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { formatBRDateTime } from '@/lib/dates';
import { FloatingButtons } from '@/components/landing/FloatingButtons';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
          
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground mb-6">
              Última atualização: {formatBRDateTime(new Date())}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e utilizar a plataforma Edu Sampaio Cursos, você concorda com estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Descrição dos Serviços</h2>
              <p className="text-muted-foreground">
                A Edu Sampaio Cursos oferece cursos online preparatórios para concursos públicos, 
                incluindo videoaulas, materiais de estudo, simulados e outros recursos educacionais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta</h2>
              <p className="text-muted-foreground">
                Para acessar nossos cursos, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. 
                Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Uso da Plataforma</h2>
              <p className="text-muted-foreground mb-4">É proibido:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Compartilhar sua conta ou credenciais de acesso com terceiros</li>
                <li>Copiar, reproduzir ou distribuir o conteúdo dos cursos</li>
                <li>Utilizar a plataforma para fins ilegais ou não autorizados</li>
                <li>Tentar acessar áreas restritas do sistema</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todo o conteúdo disponibilizado na plataforma, incluindo textos, vídeos, imagens e materiais de estudo, 
                são protegidos por direitos autorais e pertencem à Edu Sampaio Cursos ou aos seus licenciadores.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Pagamentos</h2>
              <p className="text-muted-foreground">
                Os preços dos cursos são informados no momento da compra. O acesso ao conteúdo será liberado 
                após a confirmação do pagamento. Aceitamos diversos métodos de pagamento conforme indicado na página de checkout.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Modificações dos Termos</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após a publicação na plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
              <p className="text-muted-foreground">
                Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: contato@edusampaio.com
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
