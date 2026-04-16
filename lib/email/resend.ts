import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApprovalEmail(to: string, materialTitle: string) {
  await resend.emails.send({
    from: 'Success at Sage <noreply@successatsage.com>',
    to,
    subject: 'Your submission was approved!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px">
        <h2 style="color:#a78bfa;margin-top:0">Your submission was approved ✓</h2>
        <p>Your material <strong>${materialTitle}</strong> has been approved and is now live on Success at Sage.</p>
        <p style="color:#ffffff99">Thank you for contributing!</p>
      </div>
    `,
  })
}

export async function sendRejectionEmail(to: string, materialTitle: string, note?: string | null) {
  await resend.emails.send({
    from: 'Success at Sage <noreply@successatsage.com>',
    to,
    subject: 'Update on your submission',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px">
        <h2 style="color:#f87171;margin-top:0">Submission not approved</h2>
        <p>Your material <strong>${materialTitle}</strong> was not approved at this time.</p>
        ${note ? `<p><strong>Feedback:</strong> ${note}</p>` : ''}
        <p style="color:#ffffff99">Feel free to make changes and resubmit!</p>
      </div>
    `,
  })
}
