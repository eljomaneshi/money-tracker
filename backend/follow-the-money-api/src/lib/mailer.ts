import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCodeEmail(email: string, code: string) {
    console.log("sendVerificationCodeEmail start", {
        to: email,
        apiKeyPresent: Boolean(process.env.RESEND_API_KEY),
        fromPresent: Boolean(process.env.EMAIL_FROM),
    });

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Money Tracker <onboarding@resend.dev>",
        to: [email],
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

    if (error) {
        console.error("Resend error:", error);
        throw new Error(error.message || "Failed to send email");
    }

    console.log("Resend send ok", data);
}