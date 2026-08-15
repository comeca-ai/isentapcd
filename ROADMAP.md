# Roadmap — IsentaPCD

O que já existe, o que está saindo e o que vem depois. Atualizado na POC v3.

## Feito agora

- **OCR com Mistral + avisos por e-mail** — todo documento enviado é lido automaticamente (Mistral OCR) e passa por checagens de sanidade por tipo (CID no laudo, CPF, nome, dados de guia paga). Você recebe um e-mail a cada envio: recebido → verificado (ou o que ajustar). Nunca rejeita sozinho — quem decide é sempre o time humano e o órgão.
- **Trilha guiada de documentos** — sequência numerada única, na ordem lógica do processo (identidade → laudo → CNH → guias → IPI → ICMS → NF-e → pós-compra), com card "Seu próximo passo", progresso "X de N" e status por etapa.

## Em andamento

- **Validação automática de guias pagas** — conferir valor, vencimento e beneficiário das guias (TSE/IMESC) assim que o comprovante chega.

## Próximo

- **Pré-preenchimento do pedido no SISEN** — gerar o requerimento de IPI quase pronto, com seus dados e textos revisados.
- **Integração com portais estaduais de ICMS** — acompanhar o protocolo do pedido de ICMS direto no portal da Sefaz da sua UF.
- **Lembretes por WhatsApp** — prazos de autorização (270/180 dias), carências (2/4 anos) e próximos passos, direto no seu WhatsApp.

## Depois

- **Assinatura digital de procurações** — quando houver procuração no processo, assinar sem impressão nem cartório.
- **Pagamento online** — quando sair da POC, cobrança do acompanhamento completo direto na plataforma (hoje: tudo grátis durante a prova de conceito).
- **App mobile** — a trilha inteira no bolso, com captura de documentos pela câmera.
