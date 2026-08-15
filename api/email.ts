import { authEnv } from "./auth/env";

/**
 * Envio de e-mail via Resend REST (fetch puro, sem SDK).
 * Se RESEND_API_KEY estiver vazio → no-op com console.log.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!authEnv.resendApiKey) {
    console.log(`[email:no-op] para=${opts.to} assunto="${opts.subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authEnv.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: authEnv.emailFrom,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] falha ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("[email] erro de rede:", err);
  }
}

// ── Identidade da marca ────────────────────────────────────────────────────
// papel #F7F3EA · verde-tinta #14201B · âmbar #F2B53F · Atkinson/system font
const PANEL_URL = "https://isentapcd.com.br/app";

function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 40px 32px;">
        <a href="${cta.url}" style="display:inline-block;background:#14201B;color:#F7F3EA;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;">${cta.label}</a>
      </td></tr>`
    : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EA;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:'Atkinson Hyperlegible',Verdana,system-ui,sans-serif;color:#14201B;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E3DCCB;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#14201B;padding:24px 40px;">
          <span style="color:#F7F3EA;font-size:20px;font-weight:700;">Isenta<span style="color:#F2B53F;">PCD</span></span>
        </td></tr>
        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#14201B;">${title}</h1>
          <div style="font-size:16px;line-height:1.65;color:#44554D;">${body}</div>
        </td></tr>
        ${ctaHtml}
        <tr><td style="padding:0 40px 32px;">
          <hr style="border:none;border-top:1px solid #E3DCCB;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6B7A72;">
            O IsentaPCD é uma plataforma privada de orientação. Não somos um órgão governamental e não
            temos vínculo com a Receita Federal, Secretarias da Fazenda ou Detran. Quem analisa e defere
            (ou indefere) o pedido de isenção é sempre o órgão público competente. Nunca pedimos sua senha do Gov.br.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Templates ──────────────────────────────────────────────────────────────
export function tplBoasVindas(name: string): { subject: string; html: string } {
  return {
    subject: "Bem-vindo(a) ao IsentaPCD — sua jornada começou",
    html: layout(
      `Olá, ${name.split(" ")[0]}! Sua conta está pronta.`,
      `<p>Seu processo de isenção de IPI + ICMS + IPVA já tem um painel próprio: timeline de 7 etapas,
       checklist de documentos por órgão e alertas de prazo.</p>
       <p><strong>Atenção ao relógio:</strong> as regras atuais valem até 31/12/2026. Comece agora.</p>`,
      { label: "Abrir meu painel", url: PANEL_URL },
    ),
  };
}

export function tplDocumentoAprovado(name: string, docLabel: string): { subject: string; html: string } {
  return {
    subject: `Documento aprovado: ${docLabel}`,
    html: layout(
      "Boa notícia: documento aprovado ✅",
      `<p>${name.split(" ")[0]}, nossa equipe revisou e <strong>aprovou</strong> o documento
       <strong>${docLabel}</strong>.</p><p>Ele já está pronto para o protocolo no órgão.</p>`,
      { label: "Ver meus documentos", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplDocumentoRejeitado(
  name: string,
  docLabel: string,
  motivo: string,
): { subject: string; html: string } {
  return {
    subject: `Documento para corrigir: ${docLabel}`,
    html: layout(
      "Um documento precisa de correção",
      `<p>${name.split(" ")[0]}, o documento <strong>${docLabel}</strong> foi devolvido pela revisão.</p>
       <p style="background:#FDF3EC;border-left:4px solid #C24A2E;padding:12px 16px;border-radius:8px;">
         <strong>Motivo:</strong> ${motivo}
       </p>
       <p>Corrija e reenvie pelo painel — a revisão leva até 1 dia útil.</p>`,
      { label: "Reenviar documento", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplPagamentoConfirmado(name: string): { subject: string; html: string } {
  return {
    subject: "Pagamento confirmado — acompanhamento completo desbloqueado",
    html: layout(
      "Tudo desbloqueado! 🎉",
      `<p>${name.split(" ")[0]}, confirmamos seu pagamento de <strong>R$ 497</strong>.</p>
       <p>Agora você tem: revisão humana de todos os documentos, checklist completo por órgão,
       passo a passo assistido do IPI e do ICMS e alertas de prazos e carências.</p>`,
      { label: "Continuar meu processo", url: PANEL_URL },
    ),
  };
}

// ── OCR de documentos (POC v3) ─────────────────────────────────────────────
export function tplDocumentoRecebido(name: string, docLabel: string): { subject: string; html: string } {
  return {
    subject: `Recebemos seu documento: ${docLabel}`,
    html: layout(
      "Documento recebido — já estamos analisando",
      `<p>${name.split(" ")[0]}, recebemos o documento <strong>${docLabel}</strong> e nossa
       análise automática já está em andamento.</p>
       <p>Em instantes você recebe outro e-mail com o resultado: tudo certo ou o que ajustar.
       Depois, nossa equipe ainda faz a revisão humana final.</p>`,
      { label: "Acompanhar no painel", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplDocumentoOcrOk(name: string, docLabel: string): { subject: string; html: string } {
  return {
    subject: `Documento verificado: ${docLabel}`,
    html: layout(
      "Tudo certo com seu documento ✅",
      `<p>${name.split(" ")[0]}, nossa análise automática leu o documento
       <strong>${docLabel}</strong> e encontrou tudo o que era esperado.</p>
       <p>Ele segue agora para a revisão humana do nosso time (até 1 dia útil).</p>`,
      { label: "Ver meus documentos", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplDocumentoOcrAttention(
  name: string,
  docLabel: string,
  achados: string[],
): { subject: string; html: string } {
  const lista = achados.map((a) => `<li style="margin:6px 0;">${a}</li>`).join("");
  return {
    subject: `Encontramos algo para ajustar: ${docLabel}`,
    html: layout(
      "Seu documento precisa de um ajuste",
      `<p>${name.split(" ")[0]}, ao ler o documento <strong>${docLabel}</strong>, nossa análise
       automática encontrou pontos que merecem atenção:</p>
       <ul style="background:#FDF6E3;border-left:4px solid #F2B53F;padding:12px 16px 12px 32px;border-radius:8px;margin:16px 0;">
         ${lista}
       </ul>
       <p>Isso <strong>não</strong> é uma rejeição — é um aviso para você corrigir antes do
       protocolo. Se estiver tudo certo mesmo assim, nossa equipe confirma na revisão humana.</p>`,
      { label: "Revisar e reenviar", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplCadastroConcluido(name: string): { subject: string; html: string } {
  return {
    subject: "Seu cadastro está completo — que bom ter você aqui! 🎉",
    html: layout(
      `Cadastro concluído, ${name.split(" ")[0]}!`,
      `<p>Que notícia boa: seu cadastro está completinho. O próximo passo é a
       <strong>trilha de documentos</strong> — a cada envio, nossa leitura automática (OCR)
       verifica se está tudo certo e você recebe um e-mail como este a cada movimentação.</p>
       <p>Estamos aqui para qualquer dúvida, no painel ou no WhatsApp. Vamos juntos até a nota
       fiscal com desconto. 💚</p>`,
      { label: "Enviar meus documentos", url: `${PANEL_URL}/documentos` },
    ),
  };
}

export function tplEtapaAvancou(name: string, stageTitle: string): { subject: string; html: string } {
  return {
    subject: `Seu processo avançou: ${stageTitle} ✅`,
    html: layout(
      `Boa notícia, ${name.split(" ")[0]}!`,
      `<p>A etapa <strong>${stageTitle}</strong> do seu processo de isenção foi concluída.
       Cada passo desses te deixa mais perto do carro 0 km com os impostos isentos.</p>
       <p>Sua timeline mostra o que já foi e o que vem agora — sem juridiquês, sem surpresa.</p>`,
      { label: "Ver minha timeline", url: PANEL_URL },
    ),
  };
}

export function tplLembretePrazo(
  name: string,
  titulo: string,
  detalhe: string,
): { subject: string; html: string } {
  return {
    subject: `Lembrete de prazo: ${titulo}`,
    html: layout(
      titulo,
      `<p>${name.split(" ")[0]}, ${detalhe}</p>
       <p>Não deixe o prazo passar — perder o prazo pode significar pagar imposto que seria evitável.</p>`,
      { label: "Ver meus prazos", url: PANEL_URL },
    ),
  };
}
