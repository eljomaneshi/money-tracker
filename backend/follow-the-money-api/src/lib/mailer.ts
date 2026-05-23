import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

export async function sendVerificationCodeEmail(email: string, code: string) {
    console.log("sendVerificationCodeEmail start", {
        to: email,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        userPresent: Boolean(process.env.EMAIL_USER),
        passPresent: Boolean(process.env.EMAIL_PASS),
        fromPresent: Boolean(process.env.EMAIL_FROM),
    });

    await transporter.verify();
    console.log("SMTP verify ok");

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your verification code",
        text: `Your verification code is: ${code}. It expires in 10 minutes.`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Verify your email</h2>
        <p>Use this code to finish creating your account:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
    });

    console.log("sendMail ok", {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
    });
}