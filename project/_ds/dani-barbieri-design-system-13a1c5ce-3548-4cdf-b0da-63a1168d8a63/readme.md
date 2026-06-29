# High Beauty PrØ — Design System

A brand & UI system for **High Beauty PrØ — Mentoria**, the beauty-professional
mentorship led by **Dani Barbieri**. The identity is luxurious, modern,
trustworthy and minimal: a deep wine palette, gold-foil monogram, high-contrast
Didone display type and editorial photography of roses, glowing skin and gold
botanicals.

> The brand line is **"Mentoria"** — High Beauty PrØ mentors beauty
> professionals toward growth, professionalisation and authority in their field.

## Source material

- **`uploads/HIGH BEAUTY PRO APRE-1.pdf`** — the original brand manual
  ("Manual da Apresentação", 20 pp.) by **ArthDesignn** (Identidade Visual 2025,
  04/2025; contact @ArthDesignn). Everything here is derived from it.
- Extracted brand photography & mockups live in `assets/` (pulled from the
  manual's mockup pages). The gold monogram was keyed onto transparency as
  `assets/monogram-gold.png`.

### Fonts — licensed brand faces (installed)
The brand fonts are embedded in the system (`assets/fonts/`, declared in
`tokens/fonts.css`):

| Role | Font | File |
|---|---|---|
| Display / titles / short text | **Cammron Round** | `CammronRound.otf` |
| Support / body / labels | **Arimo** (roman + italic, variable) | `Arimo-VariableFont_wght.ttf`, `Arimo-Italic-VariableFont_wght.ttf` |

> Note: the Cammron file is a single (demo) weight mapped across 400–700, and has
> no dedicated italic — display italics are browser-synthesised. If you have the
> full Cammron Round family (extra weights / true italic), send it and we'll drop
> it in. Arimo is a metric-compatible neo-grotesque used for all UI/body text.

---

## Content fundamentals — how the brand writes

- **Language:** Brazilian **Portuguese**. Keep copy in PT-BR unless asked.
- **Voice:** aspirational, warm and authoritative — a mentor speaking to
  ambitious professionals. Confident, never loud. "Beleza com propósito."
- **Address:** speaks *to* the professional ("você", "para quem leva a beleza a
  sério") and *about* the brand in the third person in formal contexts
  ("A High Beauty PrØ é…"). First person plural ("nós") for community moments.
- **Casing:** Display headlines in **sentence case** or short Title Case.
  Labels, kickers, eyebrows and the **"MENTORIA"** lockup line are **UPPERCASE,
  widely tracked** (0.24–0.42em). Buttons are tracked uppercase.
- **The Ø:** the brand always styles "PRO" as **"PrØ"** (slashed O). Preserve it.
- **Tone words (from the manual):** *moderna · confiável · minimalista · luxuosa*.
- **Emoji:** none. The brand never uses emoji. Ornament is typographic (a small
  gold diamond / hairline rule) or photographic, never illustrative.
- **Length:** concise. Short, declarative sentences; generous whitespace does
  the rest. Avoid hype-stacking and exclamation marks.
- **Example phrases:** "Beleza com propósito.", "Mentoria de profissionais.",
  "Força, elegância e autoridade.", "Quero participar", "Aplicar agora".

---

## Visual foundations

**Colour.** Three brand colours from the manual anchor everything: wine/bordô
**#771520** (primary), nude **#E4D5CA** and sand **#D0BBA6**. A metallic **gold
foil** is the signature accent (logo, emphasis, hairlines). Text uses
**wine-tinted inks** (never neutral grey). Backgrounds are warm cream/nude on
light surfaces and deep wine on dark surfaces. Tints/shades were derived in
OKLCH to stay harmonious. See `tokens/colors.css`.

**Type.** Cammron Round — a high-contrast display serif — for titles and short
text, occasionally in italic for romance; **Arimo** (neo-grotesque sans) for
everything else. Labels are tracked uppercase. Big editorial display sizes,
tight leading. See `tokens/typography.css`.

**Layout.** Editorial and airy — lots of negative space, asymmetric image/text
splits, centred lockups. Container widths 640–1280px with large gutters.

**Backgrounds.** Solid colour fields (cream, nude, wine) and **full-bleed
photography** with a dark wine/charcoal scrim for legible overlaid text. No
busy patterns; at most a faded oversized monogram watermark. No noise/grain
beyond what's inherent to the photos.

**Imagery vibe.** Warm and rich: deep crimson roses (moody, low-key), glossy
luminous skin in close-up, white orchids, **gold-painted botanicals** (palm
fronds), velvet and marble surfaces. Editorial beauty / luxury-skincare energy.
Warm white balance, soft directional light.

**Corner radii.** Minimal and squared — luxury restraint. 0–8px on most
surfaces, 14px max for large cards, full pill only for tags/badges. Business
cards and print are sharp-cornered.

**Cards.** Clean white (or nude/wine) panels, 8px radius, **soft warm shadow**
(never grey), optional 1px **gold hairline edge** for emphasis. Media cards put
a photo on top with a subtle zoom on hover.

**Borders & rules.** Hairlines are wine-tinted at ~10% opacity; the signature
divider is a **thin gold rule**, sometimes with a centred diamond ornament.

**Shadows.** Warm, low, wine-tinted (`rgba(39,18,23,…)` / `rgba(119,21,32,…)`),
diffuse and soft. Elevation is gentle — this is not a drop-shadow-heavy UI.

**Motion.** Elegant and quiet. Gentle ease-out (`cubic-bezier(.22,.61,.36,1)`),
140–420ms. Fades and small rises; subtle image zoom on hover. **No bounce**, no
spring, no flashy transitions.

**Hover / press.** Hover = darken (wine deepens), fill (outline → solid wine),
or a 4px lift on cards with image zoom; gold buttons brighten ~4%. Press =
1px downward nudge. Focus = wine border + soft wine glow (`--accent-soft`), or a
gold underline on editorial line inputs.

**Transparency / blur.** Used sparingly — frosted panels over photography
(`--blur-panel`) and wine scrims over hero imagery for text contrast.

---

## Iconography

The brand is **type- and photography-led; it has no proprietary icon set.** The
only mark is the custom **gold interlocking monogram** (letters H · B · P fused),
supplied here as `assets/monogram-gold.png` (transparent) and on wine in
`assets/monogram-gold-wine.png`. Emoji and unicode-symbol icons are **not** used.

For functional UI icons where needed (arrows, social, form affordances), use a
**thin, elegant line set** — **Lucide** (CDN, stroke ~1.5) is the chosen
substitute, which matches the minimal, refined feel. Keep icons sparse, small
and gold or wine. Flag any heavier icon usage for review. Decorative "icons" in
brand material are the gold diamond ornament and hairline rules only — see
`components/core/Divider`.

---

## What's in here (index / manifest)

**Root**
- `styles.css` — the single entry point consumers link (`@import`s only).
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter for use in Claude Code.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
`effects.css` (all reached from `styles.css`).

**`assets/`** — brand imagery & marks:
`monogram-gold.png` (transparent), `monogram-gold-wine.png`,
`img-rose-dark.png`, `img-rose-soft.png`, `img-beauty-orchid.png`,
`img-palm-gold.png`, `img-velvet-palm.png`, plus mockups
(`mockup-notebook.png`, `mockup-storefront.png`, `mockup-laptop.png`).

**`components/`** — React primitives (namespace `window.HighBeautyPrDesignSystem_13a1c5`):
- `brand/` — **Logo** (wordmark / stacked / full / secondary / monogram lockups)
- `core/` — **Button**, **Tag**, **Badge**, **Divider**
- `forms/` — **Input**, **Field**
- `surfaces/` — **Card**, **Avatar**, **StatBlock**

**`foundations/`** — Design-System tab specimen cards (Colors, Type, Spacing,
Brand).

**`ui_kits/`** — full-screen recreations:
- `landing/` — the mentorship landing page (hero, method, mentor, results, apply).
- `social/` — Instagram post / story templates.

**`slides/`** — sample presentation slides (title, statement, content, quote,
closing) in the brand style.

---

*Identity by ArthDesignn (2025). Design system assembled from the brand manual.*
