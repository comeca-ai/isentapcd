import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha } from '@/components/guia/boxes'

/** Conteúdo do capítulo Armadilhas (dossiê §2.5, §2.6, §8 e FAQ). */
export default function ArmadilhasContent() {
  return (
    <>
      <Secao id="debitos-em-aberto" numero="1" titulo="IPVA e multas em aberto">
        <p>
          O Convênio ICMS 38/2012 veda a isenção a quem tem <strong>qualquer débito</strong> com a
          fazenda estadual — IPVA atrasado, multa de trânsito, taxa esquecida. É a causa mais boba
          (e mais comum) de pedido travado.
        </p>
        <AlertaArmadilha>
          Quite tudo antes de protocolar — e guarde os comprovantes. Débito de veículo anterior
          também conta.
        </AlertaArmadilha>
      </Secao>

      <Secao id="laudo-fora-do-padrao" numero="2" titulo="Laudo fora do padrão">
        <p>
          O laudo precisa vir de emissor aceito (serviço público, conveniado SUS, Detran/credenciada
          ou serviço social autônomo) e trazer <strong>conclusão funcional</strong>: o impacto da
          condição na condução ou na mobilidade. Laudo só com CID, sem essa conclusão, é o campeão
          de indeferimento.
        </p>
        <p>
          Veja o passo a passo do laudo no capítulo de{' '}
          <a href="/guia/requisitos">requisitos</a>.
        </p>
      </Secao>

      <Secao id="prazos-expirados" numero="3" titulo="Prazos expirados">
        <p>
          A autorização de IPI vale <strong className="font-mono">270 dias</strong>; a de ICMS,{' '}
          <strong className="font-mono">180 dias</strong> (SP: 270). Depois da compra, a nota fiscal
          precisa chegar ao fisco até o <strong className="font-mono">15º dia útil</strong> do mês
          seguinte. Prazo perdido não se remenda: é pedido novo.
        </p>
      </Secao>

      <Secao id="carencia-ignorada" numero="4" titulo="Vender antes da carência">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>IPI:</strong> vender antes de <strong className="font-mono">2 anos</strong>{' '}
            exige devolução <strong>integral</strong> do imposto, com Selic desde a nota fiscal, e
            autorização prévia da Receita. Sem autorização: multa de mora; se a fiscalização chegar
            primeiro, multa de ofício de 75% (150% se houver fraude).
          </li>
          <li>
            <strong>ICMS:</strong> vender antes de{' '}
            <strong className="font-mono">4 anos</strong> gera recolhimento{' '}
            <strong>proporcional</strong> ao tempo restante.
          </li>
          <li>
            <strong>Alternativa:</strong> vender para outra pessoa com direito pode manter a
            isenção, com transferência formalizada.
          </li>
        </ul>
        <AlertaArmadilha>
          Falecimento: a Receita olha a data da transferência no RENAVAM. Dentro da{' '}
          <Glossario termo="carência">carência</Glossario>, herdeiro sem direito pode ter tributo a
          recolher — e em estados como SP e GO o benefício não se transmite a herdeiros.
        </AlertaArmadilha>
      </Secao>

      <Secao id="acima-do-teto" numero="5" titulo="Comprar acima do teto">
        <p>
          IPI: até <strong className="font-mono">R$ 200 mil</strong>. ICMS: total até{' '}
          <strong className="font-mono">R$ 70 mil</strong> e parcial até{' '}
          <strong className="font-mono">R$ 120 mil</strong>. IPVA: cada estado tem o seu (RJ, por
          exemplo, limita a R$ 55 mil). Passou do teto, não há "isenção de uma parte" no IPI — o
          benefício simplesmente não se aplica àquele carro.
        </p>
        <p>
          E atenção ao golpe contrário: fracionar a nota fiscal para fingir que o carro cabe no teto
          é vedado e invalida o benefício.
        </p>
      </Secao>

      <Secao id="despachante-que-garante" numero="6" titulo='O "despachante que garante"'>
        <p>
          Ninguém garante deferimento: quem decide é a Receita Federal e a SEFAZ do seu estado.
          Sinais clássicos de golpe:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>Pedir sua senha do Gov.br (o IsentaPCD nunca pede — ninguém sério pede);</li>
          <li>Prometer "isenção garantida" ou "isenção vitalícia";</li>
          <li>Cobrar "taxa da Receita" (o serviço federal é gratuito);</li>
          <li>Citar um "laudo digital unificado" ou "teto nacional único de R$ 120 mil" — regras que circulam em 2026 sem confirmação oficial.</li>
        </ul>
        <p>
          Na dúvida, compare com as <a href="/guia/fontes-oficiais">fontes oficiais</a> — ou pergunte
          pra gente no WhatsApp antes de pagar qualquer coisa.
        </p>
      </Secao>
    </>
  )
}
