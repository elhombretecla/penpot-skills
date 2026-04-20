# Phase 0: Design Brief Analysis

The quality of every design decision downstream depends entirely on the quality of this phase. A vague brief produces a generic design. A precise design intent produces a purposeful one.

---

## Step 1: Decode the Brief

Read the brief carefully. Extract these signals:

### Product Signals
- **What does the product do?** (core function in one sentence)
- **Who uses it?** (developer, business analyst, consumer, creative professional)
- **When/where is it used?** (professional context at a desk vs. casual mobile use)
- **What is the dominant task?** (monitoring, creating, exploring, purchasing, communicating)
- **What is the scale?** (small tool vs. enterprise platform vs. consumer app)

### Emotional Signals
Look for words in the brief that hint at desired tone:
- "professional", "enterprise", "reliable" → PRECISION
- "powerful", "fast", "focused" → PRECISION or DARK
- "modern", "exciting", "launch" → BOLD
- "friendly", "simple", "approachable" → WARM
- "dark mode", "developer", "CLI", "terminal" → DARK
- "community", "social", "personal" → WARM
- "marketing", "landing", "conversion" → BOLD

### Competitive Signals
If the user mentions a competitor or inspiration:
- Stripe, Linear, Vercel, Figma, GitHub → PRECISION
- Raycast, Warp, Arc, Fig → DARK
- Notion, Todoist, Superhuman → PRECISION or WARM
- Agency sites, portfolio, editorial → BOLD
- Headspace, Calm, Duolingo → WARM

---

## Step 2: Choose the Style Profile

After decoding, map the signals to a profile:

### PRECISION Profile
**When to choose:**
- B2B SaaS product (any category)
- Developer tooling
- Financial or data-heavy application
- Administrative interfaces
- Anything where "trust" and "capability" matter more than "delight"

**NOT for:** Consumer entertainment, social, emotional products

**Mental model:** The user is at work. This tool needs to make them more capable. Every pixel should earn its place by serving the task.

### BOLD Profile
**When to choose:**
- Marketing / landing page
- Product launch announcement
- Portfolio or agency site
- Any screen where conversion is the goal
- Conference materials, presentations

**NOT for:** Functional app screens, admin interfaces, anything users spend hours in

**Mental model:** The user is deciding whether to care. You have 3 seconds to make them feel something. Scale and contrast are your main tools.

### DARK Profile
**When to choose:**
- Developer tools with inherent dark mode preference (editors, terminals, CLI companions)
- Professional audio/video applications
- Specialized high-focus work tools
- Any product where "darkness = focus" is appropriate

**NOT for:** Consumer products, health/wellness, financial products where trust is signaled by lightness

**Mental model:** The user wants to disappear into their work. The UI should recede and let the content take over.

### WARM Profile
**When to choose:**
- Consumer apps (mobile or web)
- Community platforms
- Health/wellness/lifestyle
- Education (non-enterprise)
- Any product where emotional connection matters

**NOT for:** Enterprise tools, technical B2B, anything where "professional credibility" is critical

**Mental model:** The user is in a personal context. The product should feel like a helpful companion, not a tool.

---

## Step 3: Define the Design Intent

Write three adjectives that describe the feeling the design should evoke. These are not features or functions — they are feelings.

Bad adjectives (too vague): modern, clean, simple, professional
Good adjectives: focused, capable, trustworthy, precise, editorial, confident, warm, delightful, serious, playful

**Examples:**
- Project management dashboard → "focused, organized, capable"
- Consumer fitness app → "motivating, energetic, personal"
- Developer API documentation → "precise, technical, minimal"
- SaaS landing page → "confident, capable, trustworthy"
- Design tool → "creative, powerful, refined"

---

## Step 4: Typography Decision

Choose ONE font family. Do not mix families unless there's a strong reason (code/mono is an exception).

**Inter** (default choice for 80% of products):
- Versatile, optimized for screen, excellent legibility
- Good for: SaaS, dashboards, tools, apps, most landing pages
- Personality: neutral, capable, professional

**Plus Jakarta Sans** (WARM profile variant):
- Slightly rounder, more personality
- Good for: consumer apps, community products, friendlier B2B
- Personality: approachable, modern, warm

**Syne** (BOLD profile display use only):
- Geometric, editorial, distinctive
- Use only at large display sizes — NOT for body text
- Good for: marketing headlines, portfolio

**JetBrains Mono** (secondary for DARK profile):
- Always as secondary to a sans-serif, for code/data display
- Never as primary for UI text

**Type scale — always from the token system, never ad-hoc:**
```
Display: 48/60/72/80px (marketing heroes only)
Heading 1: 36px, weight 700, tracking -0.03em
Heading 2: 30px, weight 600, tracking -0.02em
Heading 3: 24px, weight 600, tracking -0.01em
Heading 4: 20px, weight 600, tracking 0
Heading 5: 18px, weight 600, tracking 0
Body Large: 17px, weight 400, line-height 1.625
Body Base: 15px, weight 400, line-height 1.6
Body Small: 13px, weight 400, line-height 1.5
Label: 13px, weight 500, tracking 0
Caption: 12px, weight 400, line-height 1.4
Overline: 11px, weight 600, tracking 0.08em, uppercase
```

---

## Step 5: Color Story Decision

Write one sentence that describes the color narrative. Then choose:

**Primary (background & text):**
- Light: `#0F172A` (slate-900) text on `#FFFFFF` background — PRECISION
- Warm light: `#18181B` text on `#FAFAF9` background — WARM
- Dark: `#FAFAF9` text on `#0A0A0B` background — DARK

**Accent (interactive, brand):**
Choose ONE and commit to it:
- Indigo `#6366F1` — capable, tech, trustworthy
- Violet `#8B5CF6` — creative, premium, slightly playful
- Blue `#3B82F6` — classic SaaS, trusted, safe choice (avoid if possible)
- Teal `#14B8A6` — fresh, slightly different, modern
- Orange `#F97316` — energetic, bold, consumer-friendly
- Rose `#F43F5E` — bold, editorial, attention-grabbing

**The rule:** Accent color should appear ONLY on primary interactive elements (primary buttons, active states, focus rings, selected items, links). Nowhere else.

---

## Step 6: Define the Screen List

List every screen/view that needs to be created. Be specific:

| Screen | Viewport | Sections |
|--------|---------|---------|
| Dashboard main | 1440px desktop | Navbar, sidebar, stats row, activity feed, quick actions |
| Landing page | 1440px desktop | Nav, hero, features, social proof, pricing, CTA, footer |
| Settings page | 1440px desktop | Sidebar nav, profile form, notification preferences |
| Mobile home | 390px | Header, search, card list, bottom nav |

Limit to what was explicitly requested + immediately implied. Do not add screens the user didn't ask for without confirming.
