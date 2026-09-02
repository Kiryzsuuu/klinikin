import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER / GMAIL_APP_PASSWORD belum diisi di .env.local. Lihat panduan App Password di .env.example."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  const fromName = process.env.MAIL_FROM_NAME || "KlinikKita";

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function otpEmailTemplate(name: string, code: string, minutes: number) {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #F5F5F5; padding: 32px; border-radius: 16px;">
    <h2 style="color: #406661; margin-bottom: 4px;">KlinikKita</h2>
    <p style="color: #333;">Halo ${name},</p>
    <p style="color: #333;">Gunakan kode OTP berikut untuk melanjutkan proses verifikasi Anda:</p>
    <div style="background: #B9E937; color: #406661; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 12px; margin: 24px 0;">
      ${code}
    </div>
    <p style="color: #666; font-size: 14px;">Kode ini berlaku selama ${minutes} menit. Jangan bagikan kode ini kepada siapa pun.</p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
  </div>`;
}
