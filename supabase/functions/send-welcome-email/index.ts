const RESEND_API_URL = "https://api.resend.com/emails";

type AuthUser = { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null };
type DatabaseWebhook = {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  schema?: string;
  record?: AuthUser | null;
  old_record?: AuthUser | null;
};

function isConfirmed(user?: AuthUser | null) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function welcomeEmail(email: string) {
  const safeEmail = escapeHtml(email);
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Willkommen bei PointerScore</title></head>
<body style="margin:0;padding:0;background:#eef6fd;font-family:Inter,Arial,sans-serif;color:#071c38;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6fd;padding:36px 14px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #dbe7f1;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(7,35,67,.10);">
<tr><td style="height:6px;background:#2f8fe9;"></td></tr>
<tr><td style="padding:34px 38px 14px;"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:48px;height:48px;border-radius:12px;background:#071f3c;color:#62adf7;font-size:20px;font-weight:800;text-align:center;vertical-align:middle;">PS</td><td style="padding-left:13px;font-size:19px;font-weight:800;">Pointer<span style="color:#3e95ea;">Score 100</span></td></tr></table></td></tr>
<tr><td style="padding:18px 38px 38px;"><p style="margin:0 0 10px;color:#2f8fe9;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Dein Zugang ist bereit</p><h1 style="margin:0 0 16px;font-size:30px;line-height:1.18;">Willkommen bei PointerScore</h1><p style="margin:0 0 12px;color:#526d88;font-size:16px;line-height:1.65;">Deine E-Mail-Adresse <strong style="color:#173a5d;">${safeEmail}</strong> wurde erfolgreich bestätigt.</p><p style="margin:0 0 24px;color:#526d88;font-size:16px;line-height:1.65;">Du kannst jetzt dein Dashboard öffnen und deine erste strukturierte Unternehmensanalyse erstellen.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:9px;background:#176fc2;"><a href="https://pointerscore.com/dashboard.html" style="display:inline-block;padding:15px 24px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">Dashboard öffnen</a></td></tr></table><p style="margin:25px 0 0;color:#7890a6;font-size:13px;line-height:1.6;">Wir wünschen dir viel Erfolg bei deiner nächsten Analyse.</p></td></tr>
<tr><td style="padding:22px 38px;background:#f7fbff;border-top:1px solid #e1ebf3;color:#7890a6;font-size:12px;line-height:1.6;">PointerScore 100 · <a href="https://pointerscore.com" style="color:#2f8fe9;text-decoration:none;">pointerscore.com</a><br>Fragen? pointerscore@outlook.com</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const webhookSecret = Deno.env.get("WELCOME_WEBHOOK_SECRET");
  const from = Deno.env.get("RESEND_FROM") || "PointerScore <noreply@pointerscore.com>";
  if (!resendApiKey || !webhookSecret) {
    console.error("Missing required server environment variables");
    return new Response("Server configuration error", { status: 500 });
  }
  if (request.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: DatabaseWebhook;
  try { payload = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const user = payload.record;
  const confirmationJustCompleted = payload.schema === "auth" && payload.table === "users" &&
    Boolean(user?.id && user?.email) && isConfirmed(user) &&
    (payload.type === "INSERT" || !isConfirmed(payload.old_record));
  if (!confirmationJustCompleted) return Response.json({ sent: false, reason: "confirmation_not_completed" });

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `pointerscore-welcome-${user!.id}`
    },
    body: JSON.stringify({
      from,
      to: [user!.email],
      subject: "Willkommen bei PointerScore 100",
      html: welcomeEmail(user!.email!)
    })
  });
  if (!response.ok) {
    console.error("Resend request failed", response.status, await response.text());
    return new Response("Email delivery failed", { status: 502 });
  }
  const result = await response.json();
  return Response.json({ sent: true, id: result.id });
});
