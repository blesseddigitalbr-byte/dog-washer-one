import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
};

/**
 * Envia um email através da API Manus
 * Usa o serviço de email integrado do Manus
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!payload.to || !payload.subject || !payload.body) {
    console.error("Email payload inválido:", payload);
    return false;
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.error("Email service não configurado");
    return false;
  }

  try {
    const response = await fetch(`${ENV.forgeApiUrl}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        htmlBody: payload.htmlBody || payload.body,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "");
      console.error(`[Email] Falha ao enviar email (${response.status}):`, error);
      return false;
    }

    console.log(`[Email] Email enviado com sucesso para ${payload.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Envia email de confirmação de agendamento
 */
export async function sendAppointmentConfirmationEmail(
  clientEmail: string,
  clientName: string,
  petName: string,
  serviceName: string,
  appointmentDate: string,
  startTime: string
): Promise<boolean> {
  const formattedDate = new Date(appointmentDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Agendamento Confirmado - ${petName}`;

  const body = `
Olá ${clientName},

Seu agendamento foi confirmado com sucesso!

Detalhes do Agendamento:
- Pet: ${petName}
- Serviço: ${serviceName}
- Data: ${formattedDate}
- Horário: ${startTime}

Caso precise fazer alterações, entre em contato conosco.

Obrigado!
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .details { margin: 15px 0; }
    .detail-item { padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Agendamento Confirmado!</h2>
    </div>
    <div class="content">
      <p>Olá <strong>${clientName}</strong>,</p>
      <p>Seu agendamento foi confirmado com sucesso!</p>
      
      <div class="details">
        <div class="detail-item"><strong>Pet:</strong> ${petName}</div>
        <div class="detail-item"><strong>Serviço:</strong> ${serviceName}</div>
        <div class="detail-item"><strong>Data:</strong> ${formattedDate}</div>
        <div class="detail-item"><strong>Horário:</strong> ${startTime}</div>
      </div>
      
      <p>Caso precise fazer alterações, entre em contato conosco.</p>
      <p>Obrigado!</p>
    </div>
    <div class="footer">
      <p>Este é um email automático. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: clientEmail,
    subject,
    body,
    htmlBody,
  });
}
