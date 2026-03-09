import nodemailer from 'nodemailer';

const FALLBACK_FROM = 'no-reply@example.com';

export async function sendMail({ to, subject, html, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration is missing');
    } else {
      console.warn('[email] SMTP config missing; skipping email send in dev.');
      return { skipped: true };
    }
  }

  const transporter = nodemailer.createTransport({
    service: SMTP_HOST && SMTP_HOST.includes('gmail') ? 'gmail' : undefined,
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: SMTP_FROM || FALLBACK_FROM,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return { messageId: info.messageId };
}
