# Resend-Willkommensmail

Die Edge Function `send-welcome-email` verschickt nach der ersten erfolgreichen
E-Mail-Bestätigung eine PointerScore-Willkommensmail. Der Resend API-Key wird
ausschließlich als Supabase-Secret verwendet und gelangt nicht in die Website.

## 1. Server-Secrets setzen

In Supabase unter **Edge Functions > Secrets**:

- `RESEND_API_KEY`: API-Key von Resend
- `RESEND_FROM`: zum Beispiel `PointerScore <noreply@pointerscore.com>`
- `WELCOME_WEBHOOK_SECRET`: eine lange, zufällige Zeichenfolge

## 2. Funktion bereitstellen

```powershell
npx supabase functions deploy send-welcome-email --project-ref bmwmxmiirbkiioeatjqb
```

## 3. Database Webhook anlegen

In Supabase unter **Database > Webhooks** einen Webhook erstellen:

- Name: `send-welcome-email`
- Tabelle: `auth.users`
- Ereignisse: `INSERT` und `UPDATE`
- Methode: `POST`
- URL: `https://bmwmxmiirbkiioeatjqb.supabase.co/functions/v1/send-welcome-email`
- HTTP-Header: `x-webhook-secret` mit demselben Wert wie `WELCOME_WEBHOOK_SECRET`

Die Funktion ignoriert normale Profiländerungen. Sie versendet nur, wenn die
E-Mail-Adresse erstmals als bestätigt markiert wird. Die Resend-IDempotency-ID
verhindert doppelte Willkommensmails bei wiederholten Webhook-Aufrufen.

## Sicherheit

- `RESEND_API_KEY` und `WELCOME_WEBHOOK_SECRET` niemals committen.
- Die Werte gehören nicht in `.env.local` der statischen Website.
- Der Endpunkt akzeptiert nur Requests mit dem geheimen Webhook-Header.
