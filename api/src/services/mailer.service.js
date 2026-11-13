import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });
  }
  return transporter;
}

export async function sendActivationEmail(toEmail, otp) {
  const mailer = getTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Kích hoạt tài khoản Ấm Vị</h2>
      <p style="color: #475569; font-size: 15px;">Cảm ơn bạn đã đăng ký tài khoản tại <strong>Ấm Vị — Food Editorial</strong>.</p>
      <p style="color: #475569; font-size: 15px;">Mã xác thực OTP của bạn là:</p>
      <div style="background-color: #f1f5f9; padding: 14px 20px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #0284c7; border-radius: 6px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 13px;">Mã OTP có hiệu lực trong <strong>${config.otp.ttlMinutes} phút</strong>. Tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email.</p>
    </div>
  `;

  return mailer.sendMail({
    from: `"Ấm Vị Food Editorial" <${config.smtp.from}>`,
    to: toEmail,
    subject: `[Ấm Vị] Mã kích hoạt tài khoản: ${otp}`,
    html,
  });
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const mailer = getTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Đặt lại mật khẩu Ấm Vị</h2>
      <p style="color: #475569; font-size: 15px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Ấm Vị</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Đường link này có hiệu lực trong 15 phút. Nếu nút trên không bấm được, bạn có thể copy link sau dán vào trình duyệt:</p>
      <p style="word-break: break-all; color: #0284c7; font-size: 12px;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua email này.</p>
    </div>
  `;

  return mailer.sendMail({
    from: `"Ấm Vị Food Editorial" <${config.smtp.from}>`,
    to: toEmail,
    subject: '[Ấm Vị] Yêu cầu đặt lại mật khẩu',
    html,
  });
}
