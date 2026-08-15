import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha, FonteOficial } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'

/** Conteúdo do capítulo Requisitos (dossiê §2.1, §2.2, §2.8 e §8). */
export default function RequisitosContent() {
  return (
    <>
      <Secao id="definicao-pcd" numero="1" titulo="Quem a lei considera PCD">
        <p>
          Para as isenções, vale o conceito da Lei Brasileira de Inclusão: pessoa com impedimento de{' '}
          <strong>longo prazo</strong> (físico, mental, intelectual ou sensorial) que, em interação
          com barreiras, limita sua participação plena na sociedade.
        </p>
        <p>
          Na prática, o Decreto 11.063/2022 define critérios objetivos por tipo de deficiência —
          por exemplo, perda auditiva bilateral de 41 dB ou mais, ou TEA com CID F84.0/F84.1. O{' '}
          <a href="/guia/ipi">capítulo de IPI</a> traz a lista completa.
        </p>
      </Secao>

      <Secao id="condutor-nao-condutor" numero="2" titulo="Condutor, não condutor e representante legal">
        <ul className="list-disc space-y-3 pl-5 marker:text-accent">
          <li>
            <strong>Condutor:</strong> a pessoa com deficiência dirige. Se a deficiência for física,
            a CNH precisa ter as restrições/observações compatíveis com o veículo (a perícia do
            Detran define os códigos).
          </li>
          <li>
            <strong><Glossario termo="não condutor">Não condutor</Glossario>:</strong> não precisa
            de CNH. O carro fica no nome da pessoa com deficiência e ela indica condutores
            autorizados — no ICMS, até 3, residentes na mesma localidade.
          </li>
          <li>
            <strong><Glossario termo="representante legal">Representante legal</Glossario>:</strong>{' '}
            pais, tutor ou curador fazem o pedido em nome da pessoa com deficiência, inclusive menor
            de 18 anos — e respondem junto com ela pelo correto uso do benefício.
          </li>
        </ul>
        <AlertaArmadilha>
          Para deficiência física com terceiro condutor, o ICMS exige laudo de incapacidade total
          para dirigir. Se a pessoa pode dirigir, o caminho é o de condutor — com a CNH adequada.
        </AlertaArmadilha>
      </Secao>

      <Secao id="laudo" numero="3" titulo="O laudo que funciona">
        <p>
          No processo administrativo, só valem laudos de: <strong>serviço público de saúde</strong>,{' '}
          <strong>serviço privado conveniado ao SUS</strong>, <strong>Detran ou clínica
          credenciada</strong>, ou <strong>serviço social autônomo criado por lei</strong> (APAE,
          Pestalozzi). Laudo de médico particular "puro" não é aceito no administrativo — embora já
          tenha sido aceito na Justiça como prova.
        </p>
        <p>
          Assinaturas: deficiência física/visual pede equipe médica com pelo menos 1 especialista;
          deficiência mental e TEA pedem <strong>médico e psicólogo em conjunto</strong>.
        </p>
        <AlertaArmadilha>
          A maior causa de indeferimento é laudo <strong>sem conclusão funcional</strong> — só com
          CID e diagnóstico, sem descrever o impacto na condução ou na mobilidade. Antes de
          protocolar, confira se o seu laudo responde: "o que essa condição impede ou limita?".
        </AlertaArmadilha>
        <FonteOficial
          nome="Decreto 11.063/2022 — critérios e laudos"
          url="https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/d11063.htm"
          verificadoEm="ago/2026"
        />
      </Secao>

      <Secao id="cnh" numero="4" titulo="CNH com restrições">
        <p>
          Não existe "CNH especial": existe a <strong>CNH com observações/restrições</strong>{' '}
          (códigos de A a Z), definida por uma junta de 3 peritos do Detran. Ela registra as
          adaptações que o condutor precisa — e o carro comprado com isenção deve combinar com esses
          códigos.
        </p>
        <p>
          Importante: para o IPI, o STJ decidiu em 2025 que a Receita <strong>não pode exigir</strong>{' '}
          restrição na CNH nem adaptação do veículo. Se o seu pedido for negado por esse motivo,
          há decisão favorável.
        </p>
      </Secao>

      <Secao id="casos-cinzentos" numero="5" titulo="Casos cinzentos, sem promessa vazia">
        <p>
          Alguns casos são negados no administrativo e ganhos na Justiça. A gente prefere te contar
          isso na largada:
        </p>
        <ul className="list-disc space-y-3 pl-5 marker:text-accent">
          <li>
            <strong>Visão monocular (CID H54.4):</strong> a Receita nega no administrativo; o STJ já
            garante IPI e ICMS na Justiça. Ou seja: provável via judicial, não administrativa.{' '}
            <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>Autismo nível 1 / deficiência mental leve:</strong> em 2026, o IPI federal exige
            deficiência mental severa ou profunda, e estados como SP cortam o "grau leve" no IPVA
            (foram mais de 34 mil indeferimentos em 2025). O STF derrubou o filtro de grau apenas no
            regime que começa em 2027. Seu caso pode ser judicializável já em 2026 — mas sem
            garantia no administrativo.
          </li>
          <li>
            <strong>Perda total, furto ou roubo:</strong> a Receita não antecipa uma nova isenção
            antes do <Glossario termo="interstício">interstício</Glossario>; o STJ já concedeu em
            caso de força maior.
          </li>
        </ul>
        <p>
          Em todos esses cenários, a decisão final é do órgão ou do juiz — nunca nossa. O que
          fazemos é te mostrar o mapa real antes de você gastar tempo e dinheiro.
        </p>
      </Secao>
    </>
  )
}
