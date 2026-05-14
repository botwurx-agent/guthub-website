export function buildAdminEmailHtml({
  subject,
  body,
  ctaLabel,
  ctaUrl,
}: {
  subject: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  // Convert plain text → HTML paragraphs
  const bodyHtml = body
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(para =>
      `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">${para.trim().replace(/\n/g, '<br>')}</p>`
    )
    .join('')

  const ctaHtml = ctaLabel && ctaUrl ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 32px;">
      <tr>
        <td align="center">
          <a href="${ctaUrl}" style="display:inline-block;background:#DB6F56;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:0.02em;">${ctaLabel} →</a>
        </td>
      </tr>
    </table>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FDFAF3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#22432E;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
            <img src="https://guthub-website.vercel.app/logo-dark.png" alt="GutHub" width="140" height="36" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:48px;border-left:1px solid #E0DCD2;border-right:1px solid #E0DCD2;">
            ${bodyHtml}
            ${ctaHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FAF5EE;border-radius:0 0 16px 16px;border:1px solid #E0DCD2;border-top:none;padding:28px 48px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#9D978A;">GutHub · AI-powered gut health companion</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#C2BDB1;">You're receiving this email from the GutHub team.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
