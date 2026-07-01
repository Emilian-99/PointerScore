# PointerScore Supabase-E-Mails

## Registrierung bestätigen

- Supabase: **Authentication → Email Templates → Confirm signup**
- Betreff: `Bestätige deine E-Mail-Adresse | PointerScore 100`
- Inhalt: `confirm-signup.html`

## Passwort zurücksetzen

- Supabase: **Authentication → Email Templates → Reset password**
- Betreff: `PointerScore Passwort zurücksetzen`
- Inhalt: `reset-password.html`

## Erforderliche Einstellungen

1. Unter **Authentication → Providers → Email** die Option **Confirm email** aktivieren.
2. Unter **Authentication → URL Configuration** die Site URL auf `https://pointerscore.com` setzen.
3. Redirect URLs erlauben: `https://pointerscore.com/dashboard.html`, `https://pointerscore.com/auth.html?mode=recovery` und für lokale Tests `http://127.0.0.1:4173/**`.
4. Für den produktiven Versand einen eigenen SMTP-Anbieter konfigurieren. Als Absender eignet sich `PointerScore <noreply@pointerscore.com>`.

Die Platzhalter `{{ .ConfirmationURL }}` und `{{ .Email }}` dürfen beim Einfügen nicht verändert werden.
