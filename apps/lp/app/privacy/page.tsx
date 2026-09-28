import type { Metadata } from 'next';

import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacidade',
  description: 'Como a ContaGorda coleta, usa e protege os seus dados.',
  alternates: { canonical: '/privacy/' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacidade" updatedAt="28 de setembro de 2026">
      <h2>1. Dados que coletamos</h2>
      <p>
        Coletamos os dados necessários para a sua conta de acesso e para o funcionamento de cada produto: os lançamentos
        que você registra no ContaGorda Finanças e as configurações de gateway e cobranças do ContaGorda Pay.
      </p>

      <h2>2. Como usamos</h2>
      <p>
        Usamos os dados apenas para prestar os produtos, manter a segurança da sua conta e cumprir obrigações legais.
        Não vendemos os seus dados.
      </p>

      <h2>3. Compartilhamento</h2>
      <p>
        No ContaGorda Pay, os dados da cobrança são enviados ao gateway de pagamento que você configurou, pois é ele
        quem processa o pagamento.
      </p>

      <h2>4. Seus direitos</h2>
      <p>
        Conforme a Lei Geral de Proteção de Dados (LGPD), você pode solicitar acesso, correção ou exclusão dos seus
        dados a qualquer momento.
      </p>

      <h2>5. Contato</h2>
      <p>
        Solicitações sobre privacidade: <strong>contato@contagorda.com</strong>.
      </p>
    </LegalPage>
  );
}
