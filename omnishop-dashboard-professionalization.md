# OmniShop Dashboard Professionalization

## Implemented in this pass

- Added a glass command rail with layered depth, active-state highlighting, and a compact feature glyph for each destination.
- Kept the jade-green brand direction and used restrained glassmorphism instead of a neon redesign.
- Added a single “One order desk, every channel” hub to the dashboard.
- Kept Website, WhatsApp, Instagram, Facebook, Google, and Manual visible in one place.
- Added connector status, account label, orders today, orders this week, waiting conversations, and incoming event volume.
- Kept source attribution visible so an order is never silently relabeled as generic online traffic.
- Preserved responsive mobile navigation and reduced-motion behavior.

## Recommended next improvements

### 1. Owner onboarding checklist

Add a small progress strip for:

- Connect Website intake.
- Connect WhatsApp Business.
- Connect Instagram and Facebook.
- Import the approved catalog.
- Invite the first team member.

The checklist should disappear or become a “health” summary once the workspace is ready.

### 2. Connection health score

Show one simple score based on recent event freshness, failed deliveries, and unfinished setup. The score should always link to the exact connector and next action; it should never be a decorative percentage.

### 3. Priority inbox

Add a queue for high-value leads, unanswered messages, repeat customers, and orders at risk. A clear priority reason is more useful than a generic “important” flag.

### 4. Catalog and stock confidence

Surface low stock, missing prices, missing photos, and products with no source mapping. This reduces the risk of accepting an order for something the team cannot fulfill.

### 5. Team coaching view

Keep the call-to-order funnel, then add:

- Median response time.
- Follow-up completion rate.
- Rejection reasons.
- Conversion by source.
- Revenue per won customer.

Use trends over time, not a single leaderboard, so the page helps the owner coach fairly.

### 6. Clear operating modes

Add a small toggle or label for “Today”, “Last 7 days”, and “Last 30 days”. Keep the selected period consistent across KPI, source, team, and delivery panels.

### 7. Audit trail and safe actions

For production, record who changed an order, reassigned a request, edited a product, or disconnected a provider. Destructive actions should use confirmation dialogs with a plain-language consequence.

### 8. Mobile quick actions

On small screens, prioritize:

- Add manual order.
- Open waiting conversations.
- Call back a customer.
- Mark an order ready.
- Open connector alerts.

These actions should be available without navigating through the full desktop rail.

## Visual rules to keep

- Keep the glass effect concentrated in navigation and connection surfaces.
- Use white and jade surfaces for information, and yellow only for money or attention.
- Keep channel colors distinct from payment and delivery status colors.
- Prefer one strong hierarchy per screen over many competing cards.
- Keep copy operational: what happened, why it matters, and what to do next.
- Never show a connected-looking state before a real provider event has been verified.
