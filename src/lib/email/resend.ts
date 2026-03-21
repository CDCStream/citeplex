import { Resend } from "resend";

const FROM_EMAIL = "Citeplex <noreply@citeplex.io>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendAlertEmail(
  to: string,
  brandName: string,
  alertMessage: string
) {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `⚠️ Citeplex Alert: ${brandName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Citeplex Alert</h2>
          <p>We detected a change in <strong>${brandName}</strong>'s AI visibility:</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0;">${alertMessage}</p>
          </div>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Dashboard
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            You're receiving this because you have alerts enabled on Citeplex.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send alert email:", err);
  }
}

export async function sendWeeklyReport(
  to: string,
  brandName: string,
  score: number,
  scoreDelta: number,
  topRecommendation: string | null
) {
  const resend = getResend();
  if (!resend) return;

  const deltaText =
    scoreDelta > 0
      ? `<span style="color: #22c55e;">▲ +${scoreDelta}</span>`
      : scoreDelta < 0
        ? `<span style="color: #ef4444;">▼ ${scoreDelta}</span>`
        : `<span style="color: #94a3b8;">→ no change</span>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `📊 ${brandName} Weekly AI Visibility: ${score}/100`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Weekly Visibility Report</h2>
          <p>Here's your weekly AI search visibility summary for <strong>${brandName}</strong>:</p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
            <div style="font-size: 48px; font-weight: bold; color: #6366f1;">${score}</div>
            <div style="color: #64748b; font-size: 14px;">/100 Visibility Score</div>
            <div style="margin-top: 8px; font-size: 16px;">${deltaText} vs last week</div>
          </div>

          ${topRecommendation ? `
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">💡 Top Recommendation</p>
            <p style="margin: 8px 0 0;">${topRecommendation}</p>
          </div>
          ` : ""}

          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Full Report
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            Sent by Citeplex · Your AI Search Visibility Tracker
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send weekly report:", err);
  }
}
