import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a match notification email to a user.
 */
export async function sendMatchEmail(
  to: string,
  sessionId: string,
  partnerName: string,
  startAt: Date
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ccowork.ai';
  const formattedTime = startAt.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const { data, error } = await resend.emails.send({
    from: 'CCowork.ai <noreply@ccowork.ai>',
    to,
    subject: `You've been matched with ${partnerName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">You've got a coworking partner!</h2>
        <p>You've been matched with <strong>${escapeHtml(partnerName)}</strong> for a focused work session.</p>
        <p><strong>When:</strong> ${escapeHtml(formattedTime)}</p>
        <a href="${appUrl}/session/${sessionId}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 12px;">
          Join Session
        </a>
        <p style="color: #666; margin-top: 24px; font-size: 14px;">
          If you can't make it, please cancel so your partner can find someone else.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send match email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
