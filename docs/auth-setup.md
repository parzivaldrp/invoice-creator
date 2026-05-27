# Auth setup — email verification and SMTP

This guide covers the Supabase configuration needed for our improved
email-verification flow plus optional SMTP routing through Resend so
verification emails stop landing in spam.

---

## 1. Update the email confirmation template

By default Supabase sends users to a Supabase-hosted verification page
that quietly redirects them to the dashboard. We've replaced that with
our own `/auth/confirm` route + `/auth/callback` success page so users
get a clear "Email verified ✓" confirmation.

**Update the email template:**

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Pick **Confirm signup**
3. Change the action URL from the default to ours.

Default template (uses Supabase-hosted endpoint):

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

Replace with:

```html
<h2>Confirm your signup</h2>
<p>Welcome to InvoicePro! Click below to verify your email and finish setting up your account.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email address</a></p>
<p>If the button doesn't work, paste this link into your browser:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup</p>
```

4. **Save**.

**Same update for password reset** (recommended for consistency):

- **Reset password** template — change `{{ .ConfirmationURL }}` to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.

**Magic link** (if you ever turn it on):

- `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`

## 2. Verify the Site URL

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000` (or your production origin)
- **Redirect URLs**: add `http://localhost:3000/**` so all paths under
  it are allowed as redirect targets.

## 3. Custom SMTP via Resend (optional but recommended)

Supabase's built-in email service has very low rate limits and
deliverability — most of its messages end up in the spam folder. Since
this project already uses [Resend](https://resend.com) for invoice
emails, we can use the same Resend account for auth emails too.

### Get an SMTP credential from Resend

1. Go to https://resend.com/settings/smtp
2. Click **Create SMTP credential**
3. You'll get four values — copy them:
   - Host: `smtp.resend.com`
   - Port: `465` (TLS) or `587` (STARTTLS)
   - Username: `resend`
   - Password: a one-time-shown `re_...` string

Note: this SMTP password is **not** the same as your `RESEND_API_KEY`.
Create a new credential specifically for SMTP.

### Configure Supabase SMTP

Supabase Dashboard → **Project Settings** → **Authentication** →
**SMTP Settings**:

| Field | Value |
|---|---|
| Enable Custom SMTP | **On** |
| Sender email | `onboarding@resend.dev` for testing, or `noreply@yourdomain.com` once you've verified your domain in Resend |
| Sender name | `InvoicePro` (or whatever you want) |
| Host | `smtp.resend.com` |
| Port number | `465` |
| Minimum interval between emails | Leave blank or `0` |
| Username | `resend` |
| Password | The `re_...` SMTP password from the previous step |

Save. Future Supabase emails (signup confirm, password reset, magic
link) will be sent via your Resend account.

### Verify your sending domain (for production)

Using `onboarding@resend.dev` is fine for testing, but in production
you should send from your own domain so emails feel legitimate and
deliverability is best:

1. https://resend.com/domains → **Add Domain**
2. Add the DNS records Resend gives you (SPF, DKIM, optionally DMARC)
3. Wait for verification (~5–15 min)
4. Update the Supabase **Sender email** to use that domain, e.g.
   `noreply@invoicepro.com`

## 4. Disable "Confirm email" for fast dev iteration (optional)

If you'd rather skip verification entirely while developing — you can:

Supabase Dashboard → **Authentication** → **Sign In / Up** →
toggle **Confirm email** OFF.

⚠️ **Don't ship this to production.** Without email confirmation, anyone
can sign up with someone else's address and you have no proof of
ownership. Our middleware + login-page enforcement will still gate
unverified users when this is enabled — so leave it on for prod.

## 5. Test the full flow

Once the template + SMTP are configured:

1. Sign up at `/signUp` with a fresh email.
2. The toast should show "Account created" + "Check your inbox".
3. Check your inbox (not spam — that's the whole point of the SMTP swap).
4. Click the confirmation link → it goes to `/auth/confirm` →
   `/auth/callback`.
5. You should see the green "Email verified!" card with a 3-second
   countdown before auto-redirecting to `/dashboard`.
6. In Supabase SQL editor, check `auth.users.email_confirmed_at` is now
   a real timestamp:

   ```sql
   SELECT email, email_confirmed_at
   FROM auth.users
   ORDER BY created_at DESC
   LIMIT 3;
   ```

If the link still lands the user directly on `/dashboard` instead of
the new callback page, the email template hasn't been updated yet —
re-check step 1.
