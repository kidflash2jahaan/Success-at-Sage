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

export async function sendAdminSubmissionEmail(
  adminEmails: string[],
  submitterName: string,
  materialTitle: string,
  materialType: string,
  courseName: string,
  unitTitle: string,
) {
  if (adminEmails.length === 0) return
  await resend.emails.send({
    from: 'Success at Sage <noreply@successatsage.com>',
    to: adminEmails,
    subject: `New submission: ${materialTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px">
        <h2 style="color:#a78bfa;margin-top:0">New submission to review</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="color:#ffffff66;padding:4px 0;width:90px">Title</td><td style="color:#fff"><strong>${materialTitle}</strong></td></tr>
          <tr><td style="color:#ffffff66;padding:4px 0">Type</td><td style="color:#fff;text-transform:capitalize">${materialType}</td></tr>
          <tr><td style="color:#ffffff66;padding:4px 0">Course</td><td style="color:#fff">${courseName}</td></tr>
          <tr><td style="color:#ffffff66;padding:4px 0">Unit</td><td style="color:#fff">${unitTitle}</td></tr>
          <tr><td style="color:#ffffff66;padding:4px 0">Submitted by</td><td style="color:#fff">${submitterName}</td></tr>
        </table>
        <a href="https://successatsage.com/admin/submissions"
          style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Review submission →
        </a>
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
