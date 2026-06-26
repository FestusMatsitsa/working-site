import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? `"ICT Helpdesk — Kilifi County" <noreply@kilifi.go.ke>`;

const configured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}

function base(body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8faf9;border-radius:8px;overflow:hidden">
      <div style="background:#1a5c3a;padding:20px 24px;color:white">
        <p style="margin:0;font-size:12px;opacity:0.8;text-transform:uppercase;letter-spacing:1px">Kilifi County Government — ICT</p>
        <h2 style="margin:4px 0 0;font-size:20px">ICT Helpdesk &amp; Asset Management</h2>
      </div>
      <div style="padding:24px;background:white">${body}</div>
      <div style="padding:16px 24px;background:#f0f4f2;font-size:11px;color:#888;text-align:center">
        This is an automated notification. Do not reply to this email.<br>
        Department of Lands, Energy, Physical Planning and Urban Development
      </div>
    </div>
  `;
}

export async function notifyTicketAssigned(opts: {
  assigneeName: string;
  assigneeEmail: string;
  ticketId: number;
  ticketTitle: string;
  priority: string;
  category: string;
  reportedBy: string;
  description: string;
}) {
  const url = `https://${process.env.REPLIT_DEV_DOMAIN}/tickets/${opts.ticketId}`;
  await send(
    opts.assigneeEmail,
    `[Ticket #${opts.ticketId}] Assigned to you — ${opts.ticketTitle}`,
    base(`
      <p>Hi <strong>${opts.assigneeName}</strong>,</p>
      <p>A support ticket has been assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:130px">Ticket #</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>#${opts.ticketId}</strong></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Title</td><td style="padding:8px;border-bottom:1px solid #eee">${opts.ticketTitle}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Category</td><td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize">${opts.category.replace("_", " ")}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Priority</td><td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize"><strong style="color:${opts.priority === 'critical' ? '#dc2626' : opts.priority === 'high' ? '#ea580c' : '#333'}">${opts.priority}</strong></td></tr>
        <tr><td style="padding:8px;color:#666">Reporter</td><td style="padding:8px">${opts.reportedBy}</td></tr>
      </table>
      <p style="color:#555;font-size:14px">${opts.description}</p>
      <a href="${url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1a5c3a;color:white;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">
        View Ticket
      </a>
    `)
  );
}

export async function notifyTicketStatusChanged(opts: {
  reporterEmail: string;
  reporterName: string;
  ticketId: number;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  resolution?: string | null;
}) {
  const url = `https://${process.env.REPLIT_DEV_DOMAIN}/tickets/${opts.ticketId}`;
  const statusLabel = opts.newStatus.replace("_", " ");
  const emoji = opts.newStatus === "resolved" || opts.newStatus === "closed" ? "✅" : "🔄";
  await send(
    opts.reporterEmail,
    `${emoji} [Ticket #${opts.ticketId}] Status updated to ${statusLabel} — ${opts.ticketTitle}`,
    base(`
      <p>Hi <strong>${opts.reporterName}</strong>,</p>
      <p>Your support ticket status has been updated.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:130px">Ticket #</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>#${opts.ticketId}</strong></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Title</td><td style="padding:8px;border-bottom:1px solid #eee">${opts.ticketTitle}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Previous status</td><td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize">${opts.oldStatus.replace("_", " ")}</td></tr>
        <tr><td style="padding:8px;color:#666">New status</td><td style="padding:8px"><strong style="text-transform:capitalize">${statusLabel}</strong></td></tr>
      </table>
      ${opts.resolution ? `<div style="background:#f0f7f3;border-left:4px solid #1a5c3a;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0"><p style="margin:0 0 4px;font-size:12px;color:#666;font-weight:bold;text-transform:uppercase">Resolution</p><p style="margin:0;font-size:14px">${opts.resolution}</p></div>` : ""}
      <a href="${url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1a5c3a;color:white;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">
        View Ticket
      </a>
    `)
  );
}

export async function notifyNewComment(opts: {
  assigneeEmail: string;
  assigneeName: string;
  ticketId: number;
  ticketTitle: string;
  commentAuthor: string;
  commentContent: string;
}) {
  const url = `https://${process.env.REPLIT_DEV_DOMAIN}/tickets/${opts.ticketId}`;
  await send(
    opts.assigneeEmail,
    `💬 [Ticket #${opts.ticketId}] New comment — ${opts.ticketTitle}`,
    base(`
      <p>Hi <strong>${opts.assigneeName}</strong>,</p>
      <p>A new comment was added to a ticket assigned to you.</p>
      <div style="background:#f5f5f5;border-radius:6px;padding:12px 16px;margin:16px 0">
        <p style="margin:0 0 6px;font-size:12px;color:#888"><strong>${opts.commentAuthor}</strong> commented:</p>
        <p style="margin:0;font-size:14px;color:#333">${opts.commentContent}</p>
      </div>
      <a href="${url}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#1a5c3a;color:white;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">
        View Ticket
      </a>
    `)
  );
}
