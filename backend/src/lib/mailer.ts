import nodemailer from "nodemailer";
import { logger } from "./logger.js";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = "CoFounder Connect <noreply@cofound.io>",
  SMTP_SECURE,
  FRONTEND_URL = "http://localhost:8080",
} = process.env;

function createTransport() {
  if (!SMTP_HOST) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: SMTP_SECURE === "true",
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  const transport = createTransport();

  if (!transport) {
    logger.warn(
      { to, resetUrl },
      "SMTP not configured — password reset link logged instead of emailed",
    );
    logger.info({ resetUrl }, "Password reset link (dev fallback)");
    return;
  }

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject: "Reset your CoFounder Connect password",
      text: `You requested a password reset.\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr>
          <td style="background:#6366f1;padding:24px 32px;text-align:center">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">CoFounder Connect</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827">Reset your password</h1>
            <p style="margin:0 0 24px;color:#6b7280;line-height:1.6">
              We received a request to reset your password. Click the button below to choose a new one.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px">
              Reset password
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
              If you didn't request this, you can safely ignore this email.<br>
              Your password won't change until you click the link above.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <span style="font-size:12px;color:#d1d5db">© ${new Date().getFullYear()} CoFounder Connect</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    logger.info({ to }, "Password reset email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    throw err;
  }
}
