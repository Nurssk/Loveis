---
version: alpha
name: BirGe-design-system
base: Airbnb (awesome-design-md) — adapted for a collective-buying mobile marketplace
platform: Expo / React Native (StyleSheet + Ionicons), iOS · Android · Web
description: >
  BirGe is a warm, photography-led consumer marketplace for group buying in
  Kazakhstan. It inherits Airbnb's design language — a clean white canvas, a
  single coral brand voltage (Rausch #ff385c) carrying every primary CTA, soft
  rounded cards, pill-shaped search, and Cereal-style type at modest weights
  (500–600 rather than heavy 700+). The brand trusts photography and generous
  whitespace over typographic muscle. BirGe adds exactly ONE scoped semantic
  axis Airbnb does not need: a savings green (#1FA463) reserved for the
  group-buy "price drop" moment — discounts, "you save X", and the live
  participant progress bar. Coral sells the product; green proves the deal.
  Everything else is white + ink with one or two coral moments per screen.

# ---------------------------------------------------------------------------
# TOKENS  (these map 1:1 into constants/theme.ts — see "Code mapping" at end)
# ---------------------------------------------------------------------------

colors:
  # Brand — the single voltage. Used scarcely: primary CTA, search orb, active
  # tab, brand mark, save/heart state. ~90% of every screen is white + ink.
  primary: "#ff385c"          # Rausch — replaces the old #FF5A1F orange
  primary-active: "#e00b41"   # press / pointer-down
  primary-soft: "#ffe8ec"     # pale tint fill (selected chips, soft buttons, badges)
  primary-disabled: "#ffd1da"
  on-primary: "#ffffff"

  # Savings axis — SCOPED semantic green. ONLY for discount %, "you save X",
  # team price, and the group-buy progress fill. Never a CTA, never decorative.
  savings: "#1FA463"
  savings-deep: "#137A48"     # text on pale-green surfaces (AA on savings-soft)
  savings-soft: "#E6F6EE"     # pill / banner background behind savings text

  # Surfaces
  canvas: "#ffffff"           # default page floor (was warm #FBFAF8 → now pure white)
  surface: "#ffffff"          # cards
  surface-soft: "#f7f7f7"     # disabled fields, search filter band, hover fill
  surface-strong: "#f2f2f2"   # circular icon-button fill, steppers, segmented track

  # Text — never pure black
  ink: "#222222"              # headlines, body, primary nav, prices, star rating
  body: "#3f3f3f"             # long-form running copy (descriptions, reviews)
  muted: "#6a6a6a"            # subtitles, inactive tabs, meta, "view all"
  muted-soft: "#929292"       # disabled text
  on-dark: "#ffffff"

  # Lines
  hairline: "#dddddd"         # default 1px border / divider
  hairline-soft: "#ebebeb"    # lighter editorial divider
  border-strong: "#c1c1c1"    # focused input outline, disabled outline button

  # Semantic (non-savings)
  error: "#c13515"            # form validation text — distinct from coral
  error-soft: "#fdece4"
  warning: "#B86700"          # demo/jury affordances, "simulated" notes
  warning-soft: "#FBF1DD"
  info: "#222222"             # info uses ink, not blue — Airbnb discipline
  info-soft: "#f2f2f2"
  star: "#222222"             # ratings render in INK, not gold (deliberate)

  # Scrim
  scrim: "rgba(0,0,0,0.5)"    # modal / sheet backdrop

typography:
  # Family: system stack (Cereal/Circular are proprietary). Inter is the
  # closest open substitute if a custom font is added later; system-ui is the
  # zero-dependency default and is what we ship. Weights stay MODEST.
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

  # token            size  weight  lineHeight  letterSpacing   use
  savings-hero:    { size: 40, weight: 700, lineHeight: 1.1,  tracking: -0.5 }  # the price-drop number, "−15%" / final price
  display:         { size: 28, weight: 700, lineHeight: 1.2,  tracking: -0.3 }  # screen h1 ("Добро пожаловать"), product price
  h1:              { size: 24, weight: 600, lineHeight: 1.2,  tracking: -0.3 }  # screen titles
  h2:              { size: 20, weight: 600, lineHeight: 1.2,  tracking: -0.2 }  # card totals, section heads
  h3:              { size: 17, weight: 600, lineHeight: 1.25, tracking: 0    }  # sub-section titles
  title:           { size: 16, weight: 600, lineHeight: 1.25, tracking: 0    }  # card titles, nav labels
  body:            { size: 15, weight: 400, lineHeight: 1.5,  tracking: 0    }  # default running text
  body-strong:     { size: 15, weight: 600, lineHeight: 1.4,  tracking: 0    }  # emphasized body, prices in rows
  caption:         { size: 13, weight: 400, lineHeight: 1.3,  tracking: 0    }  # meta, dates, sublabels
  caption-strong:  { size: 13, weight: 600, lineHeight: 1.3,  tracking: 0    }  # field labels, savings pill text
  badge:           { size: 11, weight: 600, lineHeight: 1.2,  tracking: 0    }  # floating badges on photos
  tag:             { size: 11, weight: 700, lineHeight: 1.25, tracking: 0.4, uppercase: true }  # "ХИТ", "NEW"

rounded:
  none: 0
  xs: 4
  sm: 8     # buttons, inputs, small banners
  md: 14    # cards, product photos (the marketplace default)
  lg: 20    # large cards, sheets headers
  xl: 28    # bottom-sheet top corners
  pill: 999 # search bar, chips, badges, steppers, icon buttons, progress track

spacing:   # 4px base with a 2px micro-step
  xxs: 2
  xs: 4
  sm: 8
  md: 12
  base: 16
  lg: 24
  xl: 32
  xxl: 48
  section: 64

elevation:
  # ONE shadow tier only. Depth comes from photography + white-on-white +
  # rounded clipping, never from stacked shadows. 95% of surfaces are flat.
  card:
    ios:     { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: [0, 4] }
    android: { elevation: 2 }
    web:     "0 2px 6px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)"
  # Bottom sheets / sticky action bars may use a slightly stronger version of
  # the SAME definition — do not invent a second tier.

layout:
  maxContentWidth: 480   # phone-width column, centered on web (unchanged)
  touchTargetMin: 48     # primary CTAs; icon buttons 40; dense controls 32 min
---

## 1. Philosophy

BirGe is a **marketplace, not a fintech dashboard.** It should feel warm,
human, and trustworthy the way Airbnb does — open hero, dense card grid below,
photography doing the heavy lifting. Three rules carry the whole system:

1. **One brand voltage.** Coral (`primary`) is the only brand color. It appears
   1–2 times per screen: the primary CTA, the active tab/search action, the
   save state. If coral is everywhere, it's nowhere. Most pixels are white + ink.
2. **Green is a proof, not a paint.** The savings axis (`savings`) is the single
   exception, and it is *earned by the product*: group buying's entire promise is
   "cheaper together," so the discount %, the team price, "you save X," and the
   live progress bar render in green. Green never becomes a button or a chrome
   accent — it only ever quantifies a saving.
3. **Modest type, soft shape.** Display sits at 600 weight, not 800. Every
   interactive element is rounded — buttons 8px, cards 14px, anything tappable-
   and-small is a pill. There is no hard corner except the content grid itself.

The one place type is allowed to shout is the **price-drop number**
(`savings-hero`, 40/700) — the group-buy hero moment. Same logic as Airbnb
giving its 64px rating number the loudest treatment: the peak trust signal gets
the peak weight. For BirGe the peak signal is *the deal*.

## 2. Color

### Brand
- **Rausch `#ff385c`** — primary CTA backgrounds ("Войти", "Оплатить", "Создать
  команду", "В командную корзину"), the home search action, the active tab tint,
  the cart badge, the brand mark. Press state → `primary-active`. Soft selected
  fills (active category chip, secondary button) → `primary-soft`.
- Replaces the legacy `#FF5A1F` orange across the app.

### Savings (scoped green)
- **Savings `#1FA463`** on **`savings-soft #E6F6EE`** — the `−15%` discount tag on
  product photos, the team price, the "Экономия X ₸" pill, the discount row in
  cart/checkout, and the team-progress fill. On a green-tinted surface use
  `savings-deep` for legible text.
- Rule of thumb: if the element answers *"how much do I save?"*, it's green.
  Everything else that's interactive is coral or ink.

### Surfaces & text
- Canvas flips from the old warm cream to **pure white `#ffffff`**; cards are
  also white and separated by `hairline` + the single shadow tier. Soft fills
  (`surface-soft` / `surface-strong`) carry steppers, segmented controls, and
  icon buttons. Text walks `ink → body → muted → muted-soft`.
- **Ratings render in ink, not gold.** The `star` token is `#222222`. Gold stars
  read as cheap in a trust-driven marketplace — this is a deliberate Airbnb carry.

### Semantic discipline
- Errors are a darker, more saturated red (`error #c13515`) so they never read as
  a coral brand moment. **Info uses ink/grey, not blue** — there is no blue in the
  system except none at all. The old `info`/`infoSoft` blues are retired; delivery
  notes, "verified device," etc. move to ink-on-`surface-strong` or to the savings
  green when they communicate a benefit.
- Demo/jury and "simulated" affordances use `warning` on `warning-soft` — visually
  quarantined from the real product surface.

## 3. Typography

System font stack, modest weights. Map of where each token goes:

| Token | Size/Weight | Used for |
|---|---|---|
| `savings-hero` | 40 / 700 | The group-buy price-drop number; big team price on product detail |
| `display` | 28 / 700 | Auth h1, the large product price |
| `h1` | 24 / 600 | Screen titles ("Корзина", "Профиль", "Команда") |
| `h2` | 20 / 600 | Card totals ("Итого"), section heads |
| `h3` | 17 / 600 | Sub-section titles, header bar titles |
| `title` | 16 / 600 | Product-card titles, tab-bar labels, city blocks |
| `body` | 15 / 400 | Default running copy |
| `body-strong` | 15 / 600 | Row prices, emphasized inline values |
| `caption` | 13 / 400 | Meta, marketplace, dates, hints |
| `caption-strong` | 13 / 600 | Input labels, savings-pill text |
| `badge` | 11 / 600 | Floating photo badges ("ХИТ", buyers count) |
| `tag` | 11 / 700 · uppercase · +0.4 tracking | "NEW"-style recency tags |

Principle: headlines stay quiet so **photography + the green deal moment** carry
hierarchy. Only `savings-hero` is loud. (Current `theme.ts` uses 800 display
weights — step those down to 600–700 per this table.)

## 4. Shape & spacing

- **Radii:** buttons `sm` (8), cards & product photos `md` (14), big cards / sheet
  bodies `lg` (20), bottom-sheet top corners `xl` (28), and `pill` for search bar,
  chips, badges, steppers, icon buttons, and the progress track. (Today's theme
  uses md=12/lg=16 — widen to 14/20 to match the softer Airbnb feel.)
- **Spacing:** 4px base. Card internal padding `base` (16) for product meta, `lg`
  (24) for the big summary/host-style cards. Card-to-card gutters `base` (16).
  Screen horizontal padding `lg` (24) on detail/editorial, `base`–`lg` on feeds.
  Generous hero, denser card grid below — the marketplace contrast.

## 5. Elevation

One tier (`elevation.card`), defined per platform above, plus the modal scrim.
Flat everywhere else. Never stack shadows; if a surface needs to separate, use a
`hairline` border or a `surface-soft` fill, not a second shadow.

## 6. Components (BirGe ⟵ Airbnb mapping)

Rebuild the existing components against these specs. Left = our component, right
= the Airbnb pattern it inherits.

- **AppButton ⟵ button-primary/secondary/tertiary.** Primary: coral fill, white
  label, `sm` radius, 48–52px height, `button` weight 600. Secondary: white fill +
  1px `border-strong`, ink label. Ghost/tertiary: ink text only. Press → opacity
  + `primary-active` for primary. Disabled → `primary-disabled`. Drop the heavy
  shadow; the button is flat.
- **AppInput ⟵ text-input.** White fill, 1px `hairline` outline, `sm` radius,
  ~52–56px height, stacked `caption-strong` label above. Focus = **2px ink border**
  (`border-strong`→`ink`), no coral glow, no ring. Error = `error` text + outline.
- **CategoryChip ⟵ category strip.** Pill, white/`hairline` at rest; selected =
  `primary-soft` fill + coral text (not full-coral) for the lighter Airbnb chip
  feel. Keep one coral-filled chip max if a "primary" filter is needed.
- **ProductCard ⟵ property-card.** Photo-first: `md`-clipped image, the
  **green `−X%` TeamDiscountBadge floating top-left** (the "Guest favorite" slot),
  optional save heart top-right (coral when active). Below: `title`, `caption`
  meta (category · marketplace), ink rating + buyers, price block, and the green
  **"Экономия X ₸ в команде"** line. This is the workhorse — make it sing.
- **TeamDiscountBadge / Badge ⟵ guest-favorite-badge / new-tag.** Savings badge =
  green pill, `badge` type, one shadow tier over the photo. Recency/category tag =
  white pill, ink/`tag` text.
- **PriceBlock.** Regular price struck through in `muted`; team price in `ink`
  (or `savings-hero` size on detail). The *savings* number is green.
- **Group-buy / progress (team screen) ⟵ rating-display + reservation-card.**
  The discount % is the `savings-hero` moment. Progress track = `pill`,
  `surface-strong` rail, **green fill**. "Ещё +1 участник → 20%" in `caption`.
  This is the hero interaction the brief scores highest — give it the loudest type
  and the green proof.
- **Cart / Checkout summary ⟵ reservation-card.** White `md` card, 24px padding,
  ink `h2` total, **green discount row + green "Вы экономите X" pill**, full-width
  coral pay CTA in the sticky footer.
- **Search (home) ⟵ search-bar-pill.** White, `pill`, 1px hairline, leading search
  glyph; the filter/action affordance carries the single coral moment.
- **SMS / SIM-eSIM verify ⟵ rating-display trust treatment.** The "✓ Verified via
  SIM/eSIM" badge is a trust peak — render the device-bound check in ink with a
  green verified pill (a benefit), not blue.
- **Tab bar.** White, 1px top `hairline`, active tint coral, inactive `muted`,
  `title`/`badge` labels. Cart badge is coral.
- **Toast / EmptyState / LoadingOverlay / Modal.** White surfaces, `lg`/`xl`
  radii, single shadow / scrim. EmptyState icon circle uses `primary-soft`.

## 7. Code mapping (constants/theme.ts)

`constants/theme.ts` stays the single source of truth in code — update its values
to the tokens above, don't fork them. Concrete deltas from today:

- `colors.primary` `#FF5A1F → #ff385c`; `primaryDark → primary-active #e00b41`;
  `primarySoft #FFF1EB → #ffe8ec`.
- `colors.background` `#FBFAF8 → #ffffff`; `surfaceAlt #F4F2EE → surface-soft #f7f7f7`
  (add `surface-strong #f2f2f2`).
- `colors.text #1A1A1E → ink #222222`; `textSecondary → body/muted` per use;
  borders → `hairline #dddddd` / `borderStrong #c1c1c1`.
- Keep `success/#1FA463` but **rename its role to `savings`** and add
  `savings-deep #137A48`, `savings-soft #E6F6EE`; reuse for all discount UI.
- **Retire the blue `info`/`infoSoft`** — remap those usages to ink-on-`surface-strong`
  or to `savings` where they signal a benefit. `star #F5A623 → #222222`.
- `typography`: drop display/h1 from weight 800 → 700/600 per §3; add `savings-hero`.
- `radii.md 12 → 14`, `radii.lg 16 → 20`, add `xl 28`; keep `pill`.
- `shadows`: collapse to the single `card` tier defined in `elevation`.

> Out of scope per context.md: real SIM/eSIM, payments, marketplace APIs — all
> presented conceptually. The design system styles the *concept* screens to look
> production-grade; it does not imply real integrations.
