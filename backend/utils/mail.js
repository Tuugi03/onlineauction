const nodemailer = require("nodemailer");

// Create transporter with secure Gmail settings
const transport = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' service instead of host/port
  auth: {
    user: process.env.SMPT_EMAIL, // Your Gmail address
    pass: process.env.SMPT_PASS,  // Your Gmail App Password
  },
  tls: {
    rejectUnauthorized: false 
  }
});

const sendEmail = async (options) => {
  if (!options?.email) {
    throw new Error("Имэйл шаардлагатай");
  }

  const message = {
    from: `"${process.env.SMPT_FROM_NAME}" <${process.env.SMPT_EMAIL}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message, 
  };

  try {
    const info = await transport.sendMail(message);
    return info;
  } catch (error) {
    throw new Error("Имэйл илгээхэд алдаа гарлаа");
  }
};

const sendCode = async (email, code) => {
  if (!email || !code) {
    throw new Error("Имэйл болон код шаардлагатай");
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Таны баталгаажуулах код</h2>
      <p>Доорх кодыг ашиглан имэйлээ баталгаажуулна уу:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${code}</span>
      </div>
      <p style="color: #6b7280;">Энэ код 10 минутын дотор хүчинтэй</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #9ca3af;">Хэрэв та энэ имэйл илгээсэн гэж санахгүй байгаа бол үл тоож болно.</p>
    </div>
  `;

  return sendEmail({
    email,
    subject: "Таны баталгаажуулах код - Дуудлага худалдаа",
    html: htmlContent
  });
};

const sendResetEmail = async (email, resetUrl) => {
  if (!email || !resetUrl) {
    throw new Error("Имэйл болон reset URL шаардлагатай");
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Нууц үг сэргээх хүсэлт</h2>
      <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна. Доорх товчин дээр дарж үргэлжлүүлнэ үү:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background-color: #2563eb; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px;
                  font-weight: bold;">
          Нууц үг сэргээх
        </a>
      </div>
      <p style="color: #6b7280;">Хэрэв та энэ хүсэлт илгээгээгүй бол энэ имэйлийг үл тоож болно.</p>
      <p style="color: #ef4444;">Энэ линк 1 цагийн дотор хүчинтэй</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Дуудлага худалдаа. Бүх эрх хуулиар хамгаалагдсан.</p>
    </div>
  `;

  return sendEmail({
    email,
    subject: "Нууц үг сэргээх - Дуудлага худалдаа",
    html: htmlContent
  });
};

module.exports = {
  sendEmail,
  sendCode,
  sendResetEmail,
};