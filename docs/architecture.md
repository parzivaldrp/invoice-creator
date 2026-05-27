# InvoicePro — Architecture & Diagrams

All diagrams below use [Mermaid](https://mermaid.js.org) — they render
natively in GitHub, GitLab, VS Code (with the *Markdown Preview Mermaid
Support* extension), Notion, Obsidian, and most modern doc tools.

Sections:

1. [System architecture](#1-system-architecture) — what talks to what
2. [Database (ER) diagram](#2-database-er-diagram) — Supabase schema
3. [Sign-up & email verification flow](#3-sign-up--email-verification-flow)
4. [Sign-in flow](#4-sign-in-flow)
5. [Pro subscription / Stripe checkout flow](#5-pro-subscription--stripe-checkout-flow)
6. [Stripe webhook → DB update flow](#6-stripe-webhook--db-update-flow)
7. [Feature gating (Pro vs Free)](#7-feature-gating-pro-vs-free)
8. [AI invoice extraction flow](#8-ai-invoice-extraction-flow)
9. [Subscription state machine](#9-subscription-state-machine)

---

## 1. System architecture

High-level view of every system InvoicePro talks to.

```mermaid
flowchart LR
  subgraph Client["Browser"]
    UI["Next.js 16 App<br/>(React 19)"]
  end

  subgraph App["Next.js Server (Vercel / localhost)"]
    Middleware["middleware.ts<br/>(auth gate + session refresh)"]
    Pages["App Router pages<br/>(server components)"]
    APIs["API routes<br/>/api/stripe/*<br/>/api/extract-invoice<br/>/api/send-invoice"]
  end

  subgraph Supabase["Supabase"]
    Auth["Auth<br/>(users + sessions)"]
    DB[("Postgres<br/>profiles, invoices,<br/>invoice_items,<br/>extract_usage")]
    RLS["Row-Level Security<br/>policies"]
  end

  subgraph External["External services"]
    Stripe["Stripe<br/>(Checkout, Billing<br/>Portal, Webhooks)"]
    Textract["AWS Textract<br/>(AnalyzeExpense)"]
    Resend["Resend<br/>(email delivery)"]
  end

  UI <-->|HTTPS| Middleware
  Middleware --> Pages
  Middleware --> APIs
  Pages -->|cookie-scoped client| Auth
  Pages -->|cookie-scoped client| DB
  APIs -->|cookie-scoped client| Auth
  APIs -->|cookie-scoped client| DB
  APIs -.->|service-role only,<br/>from webhook handler| DB
  DB --- RLS

  UI -->|Stripe.js redirect| Stripe
  APIs -->|REST calls<br/>(checkout, portal)| Stripe
  Stripe -.->|Webhook<br/>POST /api/stripe/webhook| APIs

  APIs -->|AnalyzeExpense| Textract
  APIs -->|emails.send| Resend
```

---

## 2. Database (ER) diagram

Supabase schema. Black diamonds = primary keys; FK arrows = foreign key
references. All tables have RLS enabled.

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "1:1<br/>(id matches)"
  AUTH_USERS ||--o{ INVOICES : "user_id"
  AUTH_USERS ||--o{ EXTRACT_USAGE : "user_id"
  INVOICES ||--o{ INVOICE_ITEMS : "invoice_id"

  AUTH_USERS {
    uuid id PK
    text email
    timestamptz email_confirmed_at
    jsonb raw_user_meta_data "full_name, agree_to_terms"
    timestamptz created_at
  }

  PROFILES {
    uuid id PK_FK "= auth.users.id"
    text full_name
    boolean agree_to_terms
    text stripe_customer_id UK "cus_..."
    text stripe_subscription_id UK "sub_..."
    text subscription_status "trialing | active | canceled | past_due | ..."
    text subscription_tier "free | pro | business"
    timestamptz current_period_end
    timestamptz created_at
    timestamptz updated_at
  }

  INVOICES {
    uuid id PK
    uuid user_id FK
    text invoice_number "unique per user"
    text status "draft | final | sent | paid | overdue | cancelled"
    date issue_date
    date due_date
    text from_company
    text from_address
    text from_email
    text from_phone
    text to_company
    text to_address
    text to_email
    text notes
    numeric tax_rate
    numeric total
    text pdf_url
    timestamptz created_at
    timestamptz updated_at
  }

  INVOICE_ITEMS {
    uuid id PK
    uuid invoice_id FK
    text description
    numeric quantity
    numeric rate
    numeric amount
    timestamptz created_at
  }

  EXTRACT_USAGE {
    uuid id PK
    uuid user_id FK
    timestamptz created_at "for 24h rate limiting"
  }
```

**Key constraints & triggers:**

- `on_auth_user_created` (trigger on `auth.users` INSERT): reads
  `raw_user_meta_data` and inserts the matching `profiles` row.
- `subscription_tier` has a `CHECK` constraint: only `free`, `pro`,
  `business` are accepted.
- `current_period_end` is written by the Stripe webhook, not the user.
- `extract_usage.created_at` index supports the 24h rolling rate limit
  on `/api/extract-invoice`.

---

## 3. Sign-up & email verification flow

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant UI as Signup page<br/>(/signUp)
  participant SB as Supabase Auth
  participant TR as on_auth_user_created<br/>(DB trigger)
  participant PR as profiles table
  participant Email as User inbox

  U->>UI: Fill name, email, password, agree to T&C
  UI->>UI: Client-side validation
  UI->>SB: auth.signUp({ email, password,<br/>options: { data: { full_name,<br/>agree_to_terms } } })
  SB-->>TR: INSERT into auth.users<br/>(with raw_user_meta_data)
  TR->>PR: INSERT profiles row<br/>(id, full_name, agree_to_terms)
  SB->>Email: Send verification email
  SB-->>UI: { user: {...}, session: null }
  UI->>UI: Show "Account created" toast
  UI->>UI: Redirect to /login

  Note over U,Email: User clicks link in email
  Email->>SB: GET /auth/v1/verify?token=...
  SB->>SB: Set auth.users.email_confirmed_at
  SB-->>U: Redirect to app
  U->>UI: Can now sign in
```

---

## 4. Sign-in flow

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant UI as Login page<br/>(/login)
  participant SB as Supabase Auth
  participant MW as middleware.ts
  participant App as Protected page<br/>(e.g. /dashboard)

  U->>UI: Enter email + password
  UI->>SB: auth.signInWithPassword(...)

  alt Wrong password
    SB-->>UI: { error: "Invalid login credentials" }
    UI-->>U: Toast: "Incorrect email or password"
  else Email not confirmed
    SB-->>UI: { error: "Email not confirmed" }
    UI-->>U: Inline panel + Resend button
    U->>UI: Click "Resend verification email"
    UI->>SB: auth.resend({ type: 'signup', email })
    SB-->>U: New email sent
  else Success
    SB-->>UI: { user, session }<br/>+ sets session cookie
    UI->>UI: Toast: "Logged in"
    UI->>App: router.push(next ?? '/')
    App->>MW: GET protected route
    MW->>SB: getUser() (verify JWT)
    SB-->>MW: OK
    MW->>App: Allow render
  end
```

---

## 5. Pro subscription / Stripe checkout flow

End-to-end: user clicks Upgrade → lands on Stripe Checkout → webhook
updates DB → UI unlocks.

```mermaid
sequenceDiagram
  autonumber
  actor U as User (signed in)
  participant UI as Billing page<br/>(/billing?plan=pro)
  participant API as POST /api/stripe/checkout
  participant SB as Supabase (cookie session)
  participant SR as Stripe REST API
  participant Co as Stripe Checkout<br/>(hosted page)
  participant WH as POST /api/stripe/webhook
  participant DB as profiles (service role)

  U->>UI: Click "Start free trial"
  UI->>API: POST { plan: 'pro' }
  API->>SB: auth.getUser() (cookie)
  SB-->>API: { user }
  API->>SB: SELECT stripe_customer_id<br/>FROM profiles WHERE id = user.id
  SB-->>API: { stripe_customer_id }

  alt No customer yet
    API->>SR: customers.create({<br/>  email, metadata: { user.id } })
    SR-->>API: { id: 'cus_...' }
    API->>SB: UPDATE profiles<br/>SET stripe_customer_id = ...
  end

  API->>SR: checkout.sessions.create({<br/>  mode: 'subscription',<br/>  customer, line_items,<br/>  trial_period_days: 7,<br/>  metadata: { user.id } })
  SR-->>API: { url: 'https://checkout.stripe.com/...' }
  API-->>UI: { url }
  UI->>Co: window.location = url

  U->>Co: Enter card, click "Start trial"
  Co->>Co: Validate card, create subscription
  Co-->>U: Redirect to /billing?status=success

  par Webhook fires
    SR->>WH: customer.subscription.created<br/>(signed)
    WH->>WH: Verify Stripe signature
    WH->>DB: upsert profiles<br/>(tier='pro', status='trialing',<br/>current_period_end, sub_id)
    DB-->>WH: 1 row updated
    WH-->>SR: 200 OK
  and User lands back in app
    U->>UI: GET /billing?status=success
    UI->>UI: refreshProfile()<br/>(now sees Pro state)
    UI-->>U: "You're on Pro!"
  end
```

---

## 6. Stripe webhook → DB update flow

Detailed view of what happens inside `/api/stripe/webhook` for the
events we handle.

```mermaid
flowchart TD
  Start([Stripe POSTs event]) --> Sig{Signature<br/>valid?}
  Sig -->|No| Reject400[Return 400<br/>Invalid signature]
  Sig -->|Yes| Type{event.type}

  Type -->|checkout.session.completed| CSC{mode ==<br/>'subscription'?}
  CSC -->|No| Skip200a[Return 200<br/>no-op]
  CSC -->|Yes| RetrieveSub[Retrieve subscription<br/>from Stripe API]
  RetrieveSub --> Apply

  Type -->|customer.subscription.created<br/>updated / trial_will_end<br/>resumed / paused| Apply

  Type -->|customer.subscription.deleted| Down[downgradeProfile:<br/>tier=free, status=canceled]
  Down --> Upsert200

  Type -->|invoice.payment_failed| Retrieve2[Retrieve subscription<br/>by id from invoice]
  Retrieve2 --> Apply

  Type -->|Anything else| Skip200b[Return 200<br/>unhandled]

  Apply[applySubscriptionToProfile] --> ResolveUser{Resolve user id}
  ResolveUser -->|metadata.supabase_user_id| HaveId
  ResolveUser -->|fallback: lookup by<br/>stripe_customer_id| HaveId
  ResolveUser -->|neither works| Skip200c[Log + Return 200<br/>can't recover]

  HaveId[Build payload:<br/>tier, status, sub_id,<br/>customer_id, period_end] --> UpsertSql[supabase.upsert<br/>profiles by id<br/>service_role]
  UpsertSql --> Upsert200[Return 200]

  UpsertSql -->|DB error| Throw500[Return 500<br/>Stripe will retry]

  style Reject400 fill:#fee
  style Throw500 fill:#fee
  style Upsert200 fill:#efe
  style Skip200a fill:#eef
  style Skip200b fill:#eef
  style Skip200c fill:#eef
```

---

## 7. Feature gating (Pro vs Free)

How the same code paths behave differently based on `isPro`. The server
is the security boundary; the client is the UX layer.

```mermaid
flowchart LR
  subgraph Auth["authContext.tsx"]
    Profile["profile row<br/>(from Supabase)"] --> Derive[Derive isPro]
    Derive -->|tier in pro,business<br/>AND status in<br/>active,trialing| Pro["isPro = true"]
    Derive -->|anything else| Free["isPro = false"]
  end

  subgraph Client["Client-side gates (UX)"]
    Pro --> NavBadge["Navbar: show Pro pill"]
    Pro --> Upload["InvoiceUpload: drop zone"]
    Pro --> Tpl["Templates: 'Use template' buttons"]
    Pro --> Trial{trialing?}
    Trial -->|yes| Banner["Dashboard: trial countdown"]

    Free --> NavBadgeNo["Navbar: no badge"]
    Free --> UploadLock["InvoiceUpload: upsell card"]
    Free --> TplLock["Templates: lock icons + 'Unlock with Pro'"]
  end

  subgraph Server["Server-side gates (security)"]
    Pro2["profile.subscription_tier in pro/business<br/>AND status in active/trialing"]
    Pro2 -->|yes| Allow["/api/extract-invoice → run Textract"]
    Pro2 -->|no| Block["/api/extract-invoice → 402 Payment Required<br/>{ code: 'upgrade_required' }"]
  end

  style Block fill:#fee
  style UploadLock fill:#fff4e6
  style TplLock fill:#fff4e6
```

---

## 8. AI invoice extraction flow

End-to-end for the Pro-only photo-to-form feature.

```mermaid
sequenceDiagram
  autonumber
  actor U as User (Pro)
  participant UI as InvoiceUpload<br/>component
  participant API as POST /api/extract-invoice
  participant SB as Supabase<br/>(cookie + service)
  participant TX as AWS Textract<br/>(AnalyzeExpense)

  U->>UI: Drop / pick image (JPG/PNG/PDF ≤5MB)
  UI->>UI: Validate file type & size
  UI->>API: FormData(file)

  API->>API: Check kill switch<br/>(EXTRACT_DISABLED env)
  API->>SB: auth.getUser() (cookie)
  SB-->>API: { user }
  API->>SB: SELECT subscription_tier, status<br/>FROM profiles
  SB-->>API: tier + status

  alt Not Pro / not active+trialing
    API-->>UI: 402 { code: 'upgrade_required' }
    UI->>U: window.location = /billing?plan=pro
  else Pro
    API->>SB: COUNT extract_usage<br/>WHERE created_at >= now() - 24h
    SB-->>API: { count }
    alt count >= 25
      API-->>UI: 429 Daily limit reached
    else within budget
      API->>TX: AnalyzeExpenseCommand({ Document })
      TX-->>API: ExpenseDocuments[0]
      API->>API: Parse vendor, items,<br/>dates, totals, tax
      API->>SB: INSERT extract_usage(user_id)
      API-->>UI: { invoiceNumber, fromCompany,<br/>items, total, ... }
      UI->>UI: Auto-fill form fields
    end
  end
```

---

## 9. Subscription state machine

How a user's `subscription_status` (and therefore `isPro`) changes over
time. Each transition is triggered by a Stripe webhook event.

```mermaid
stateDiagram-v2
  [*] --> free : New signup
  free --> trialing : checkout.session.completed<br/>(start free trial)

  trialing --> active : Trial ends, card charges<br/>(invoice.paid)
  trialing --> canceled : User cancels in portal<br/>before trial ends

  active --> past_due : invoice.payment_failed<br/>(card declined)
  past_due --> active : Payment recovered<br/>(invoice.paid)
  past_due --> canceled : Stripe dunning expires<br/>(subscription.deleted)

  active --> canceled : User cancels<br/>(subscription.deleted)

  canceled --> free : current_period_end reached<br/>(no longer Pro)

  state "isPro=true" as Pro {
    trialing
    active
  }
  state "isPro=false" as NotPro {
    free
    past_due
    canceled
  }
```

**Notes:**

- `isPro` is `true` only for `trialing` and `active`. `past_due` is
  treated as Free until the payment recovers (Stripe retries on its
  dunning schedule).
- Cancelling in the Customer Portal sets `cancel_at_period_end: true` on
  the subscription. We don't downgrade until Stripe emits
  `customer.subscription.deleted` at period end, so users keep Pro for
  the time they paid for.
- A user can re-subscribe after cancelling — they keep their
  `stripe_customer_id`, so the second checkout reuses the same customer.
