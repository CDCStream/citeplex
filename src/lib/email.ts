import { Resend } from "resend";
import { getPublicLogoUrl, getSiteUrl } from "@/lib/site";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const displayName = name || "there";
  const logoUrl = getPublicLogoUrl();
  const siteUrl = getSiteUrl();

  const { error } = await resend.emails.send({
    from: "Citeplex <noreply@citeplex.io>",
    to: email,
    subject: "Welcome to Citeplex!",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { padding: 40px 32px 24px; text-align: center; }
    .logo-img { display: block; margin: 0 auto 16px; width: 64px; height: 64px; border-radius: 12px; }
    .logo-text { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #18181b; }
    .logo-blue { color: #2563eb; }
    .body-content { padding: 0 32px 32px; }
    .greeting { font-size: 20px; font-weight: 600; color: #18181b; margin: 0 0 16px; }
    .message { font-size: 15px; line-height: 1.7; color: #52525b; margin: 0 0 24px; }
    .features { margin: 0 0 28px; padding: 0; }
    .feature { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 14px; color: #3f3f46; line-height: 1.5; }
    .check { color: #2563eb; font-weight: bold; margin-right: 10px; font-size: 16px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 8px; }
    .divider { height: 1px; background: #e4e4e7; margin: 28px 0; }
    .footer { padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #a1a1aa; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Citeplex" class="logo-img" width="64" height="64" />
      <div class="logo-text"><span class="logo-blue">Cite</span>plex</div>
    </div>
    <div class="body-content">
      <p class="greeting">Welcome, ${displayName}!</p>
      <p class="message">
        Your email has been verified and your Citeplex account is ready. Start tracking your brand's visibility across AI search engines.
      </p>
      <div class="features">
        <div class="feature"><span class="check">&#10003;</span> Track mentions across ChatGPT, Gemini, Claude & more</div>
        <div class="feature"><span class="check">&#10003;</span> Monitor competitor visibility</div>
        <div class="feature"><span class="check">&#10003;</span> Get AI-powered recommendations</div>
      </div>
      <div style="text-align: center;">
        <a href="${siteUrl}/dashboard" class="btn" target="_blank">Go to Dashboard</a>
      </div>
      <div class="divider"></div>
      <p style="font-size:13px; color:#a1a1aa; margin:0;">
        Need help? Just reply to this email and we'll get back to you.
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Citeplex. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("[WelcomeEmail] Failed to send:", error);
  }
}

export async function sendVerificationCode(email: string, code: string, domainUrl: string) {
  const logoUrl = getPublicLogoUrl();

  const { error } = await resend.emails.send({
    from: "Citeplex <noreply@citeplex.io>",
    to: email,
    subject: "Verify your domain - Citeplex",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { padding: 40px 32px 24px; text-align: center; }
    .logo-img { display: block; margin: 0 auto 16px; width: 64px; height: 64px; border-radius: 12px; }
    .logo-text { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #18181b; }
    .logo-blue { color: #2563eb; }
    .body-content { padding: 0 32px 32px; }
    .title { font-size: 20px; font-weight: 600; color: #18181b; margin: 0 0 8px; }
    .message { font-size: 15px; line-height: 1.7; color: #52525b; margin: 0 0 28px; }
    .code-box { text-align: center; padding: 24px; background: #f4f4f5; border-radius: 8px; margin: 0 0 24px; }
    .code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: monospace; }
    .domain { font-size: 14px; color: #71717a; margin-top: 8px; }
    .note { font-size: 13px; color: #a1a1aa; margin: 0; }
    .footer { padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #a1a1aa; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Citeplex" class="logo-img" width="64" height="64" />
      <div class="logo-text"><span class="logo-blue">Cite</span>plex</div>
    </div>
    <div class="body-content">
      <p class="title">Domain Verification</p>
      <p class="message">
        Enter this code in Citeplex to verify ownership of your domain.
      </p>
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="domain">${domainUrl}</div>
      </div>
      <p class="note">This code expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Citeplex. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("[VerificationEmail] Failed to send:", error);
    throw new Error("Failed to send verification email");
  }
}
