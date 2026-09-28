import type { Metadata } from 'next';

import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso dos produtos ContaGorda: ContaGorda Pay e ContaGorda Finanças.',
  alternates: { canonical: '/terms/' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updatedAt="28 de setembro de 2026">
      <h2>1. Aceitação</h2>
      <p>
        Ao acessar ou usar os produtos da ContaGorda — o ContaGorda Pay e o ContaGorda Finanças — você concorda com
        estes termos. Se não concordar, não use os produtos.
      </p>

      <h2>2. Produtos</h2>
      <ul>
        <li>
          <strong>ContaGorda Pay</strong>: direciona as cobranças do seu aplicativo ao gateway de pagamento que você
          configurar. O processamento do pagamento é feito pelo gateway, sob os termos dele.
        </li>
        <li>
          <strong>ContaGorda Finanças</strong>: registra receitas e despesas e mostra o saldo do mês.
        </li>
      </ul>

      <h2>3. Conta de acesso</h2>
      <p>
        Os produtos compartilham a mesma conta de acesso. Você é responsável pelas atividades feitas com a sua conta e
        pela segurança das suas credenciais, inclusive das credenciais de gateway informadas no painel do Pay.
      </p>

      <h2>4. Uso aceitável</h2>
      <p>
        Não use os produtos para atividades ilegais, fraude, lavagem de dinheiro ou para violar os termos dos gateways
        de pagamento integrados.
      </p>

      <h2>5. Alterações</h2>
      <p>
        Podemos alterar estes termos. Quando a alteração for relevante, avisaremos pelos canais da sua conta antes de
        ela entrar em vigor.
      </p>

      <h2>6. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <strong>contato@contagorda.com</strong>.
      </p>
    </LegalPage>
  );
}
