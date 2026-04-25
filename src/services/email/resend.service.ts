import 'server-only';

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Yebaam <noreply@yebaam.com>';

let cached: Resend | null = null;

function getClient(): Resend {
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — cannot send emails');
  }
  if (!cached) {
    cached = new Resend(apiKey);
  }
  return cached;
}

function renderOtpEmail(code: string, firstName?: string | null): { html: string; text: string } {
  const greeting = firstName ? `Hola, ${firstName}` : 'Hola';
  const text = `${greeting}!\n\nTu código de verificación de Yebaam es: ${code}\n\nEste código expira en 10 minutos. Si no solicitaste esta cuenta, ignora este mensaje.`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;padding:40px 32px;max-width:480px;">
            <tr>
              <td style="text-align:center;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Verifica tu correo</h1>
                <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.5;">
                  ${greeting}, usa el siguiente código para terminar de crear tu cuenta en Yebaam.
                </p>
                <div style="display:inline-block;padding:16px 28px;background:#f9fafb;border:2px solid #fde68a;border-radius:12px;">
                  <span style="font-size:34px;letter-spacing:12px;font-weight:700;color:#111827;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${code}</span>
                </div>
                <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                  Este código expira en 10 minutos. Si no solicitaste crear una cuenta, ignora este correo.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">© Yebaam</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { html, text };
}

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  firstName?: string | null;
}): Promise<void> {
  const { to, code, firstName } = params;
  const { html, text } = renderOtpEmail(code, firstName);
  const { error } = await getClient().emails.send({
    from: fromEmail,
    to,
    subject: `Tu código de verificación: ${code}`,
    html,
    text,
  });
  if (error) {
    throw new Error(error.message ?? 'No se pudo enviar el correo de verificación');
  }
}

function renderPasswordResetEmail(code: string, firstName?: string | null): { html: string; text: string } {
  const greeting = firstName ? `Hola, ${firstName}` : 'Hola';
  const text = `${greeting}!\n\nUsa este código para restablecer tu contraseña en Yebaam: ${code}\n\nEste código expira en 10 minutos. Si no solicitaste el cambio, ignora este correo y tu contraseña actual seguirá funcionando.`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;padding:40px 32px;max-width:480px;">
            <tr>
              <td style="text-align:center;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Recupera tu contraseña</h1>
                <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.5;">
                  ${greeting}, usa el siguiente código para restablecer tu contraseña en Yebaam.
                </p>
                <div style="display:inline-block;padding:16px 28px;background:#f9fafb;border:2px solid #bbf7d0;border-radius:12px;">
                  <span style="font-size:34px;letter-spacing:12px;font-weight:700;color:#111827;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${code}</span>
                </div>
                <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                  Este código expira en 10 minutos. Si no solicitaste el cambio, ignora este correo y tu contraseña seguirá funcionando.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">© Yebaam</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { html, text };
}

export async function sendPasswordResetEmail(params: {
  to: string;
  code: string;
  firstName?: string | null;
}): Promise<void> {
  const { to, code, firstName } = params;
  const { html, text } = renderPasswordResetEmail(code, firstName);
  const { error } = await getClient().emails.send({
    from: fromEmail,
    to,
    subject: `Restablece tu contraseña: ${code}`,
    html,
    text,
  });
  if (error) {
    throw new Error(error.message ?? 'No se pudo enviar el correo de recuperación');
  }
}
