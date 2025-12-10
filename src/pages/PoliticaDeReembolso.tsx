import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';

export default function PoliticaDeReembolso() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Política de Desistência, Trancamento e Reembolso — Edu Sampaio Cursos</h1>

          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground mb-6">Esta política segue as diretrizes do Código de Defesa do Consumidor (CDC – Lei nº 8.078/1990), especialmente os princípios da boa-fé, transparência e equilíbrio nas relações de consumo.</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Desistência antes do início da turma</h2>
              <p className="text-muted-foreground">Se o aluno realizar a inscrição e comunicar sua desistência antes do início das aulas, por qualquer motivo, o Edu Sampaio Cursos fará:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Devolução integral imediata do valor pago via PIX; ou</li>
                <li>Cancelamento total do pagamento parcelado realizado por cartão de crédito.</li>
              </ul>
              <p className="text-muted-foreground"><em>(Base legal: arts. 6º, III e 51 do CDC — informação clara e vedação a práticas abusivas.)</em></p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Desistência até 15 dias após o início das aulas</h2>
              <p className="text-muted-foreground">Caso o aluno comunique desistência em até 15 dias após o início da turma, haverá:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Restituição do valor pago (ou cancelamento do pagamento no cartão),</li>
                <li>Com possível desconto proporcional aos dias de curso utilizados;</li>
                <li>E cobrança de uma taxa de R$ 120,00 referente ao material já disponibilizado, caso o módulo não seja devolvido.</li>
              </ul>
              <p className="text-muted-foreground"><em>(Base legal: princípios de proporcionalidade e equilíbrio contratual – arts. 6º, V e 51 do CDC.)</em></p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Desistência após 15 dias do início do curso</h2>
              <p className="text-muted-foreground">Se a desistência ocorrer após 15 dias do início das aulas, o valor remanescente pago será convertido em crédito integral, sem prazo de validade, para uso pelo próprio aluno em qualquer outra turma do Edu Sampaio Cursos.</p>
              <p className="text-muted-foreground"><em>(Boa prática de mercado alinhada ao art. 4º, III do CDC — harmonização e boa-fé nas relações de consumo.)</em></p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Desistência após 50% da carga horária do curso</h2>
              <p className="text-muted-foreground">Caso a desistência seja comunicada após o aluno ter ultrapassado 50% do curso, não haverá direito a reembolso, crédito ou compensação, considerando que a maior parte do serviço já foi disponibilizada.</p>
              <p className="text-muted-foreground"><em>(Base legal: art. 27 do CDC — responsabilidade limitada ao serviço efetivamente prestado.)</em></p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Concordância com os termos</h2>
              <p className="text-muted-foreground">Ao concluir sua inscrição, o aluno declara ter lido, compreendido e aceito integralmente esta Política de Desistência, Trancamento e Reembolso.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
