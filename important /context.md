# Context — Collective Buying MVP (Hackathon)

## What we're building

A mobile-first app MVP that lets users buy products from global marketplaces **together** to unlock wholesale prices. Three pillars:

1. **Group buying** — individual price drops to a group price once enough people join.
2. **Personalized recommendations** — product feed tailored to the user's profile.
3. **SIM/eSIM identity** — secure user identification, shown as a _concept_ only (no real implementation).

This is a 2-day hackathon MVP. A clickable prototype or minimal working demo is enough. Judges score the **clarity of the user journey and product logic**, not code quality. Mock data everywhere is acceptable and expected.

## Core user journey

1. User opens app → registration + verification.
2. Sets up profile: age, gender, city, interests, product preferences, approximate budget.
3. Sees a **localized** personalized feed: products from multiple marketplaces, in their language, prices in local currency, local payment options.
4. On a product, sees that buying alone is more expensive, buying as a group is cheaper.
5. Joins a group (e.g. needs min 10 orders). Sees live progress toward the minimum batch.
6. Once the minimum is reached, the system shows the new wholesale price.

## Required screens (must demo all of these)

- Registration / user profile
- Interests & product-category selection
- Product feed (mock marketplace data)
- Group-buy mechanism: regular price, group price, participant count, progress to minimum batch
- Simple recommendations: products suggested from interests / city / budget / categories
- Product detail card
- Join-a-group screen
- SIM/eSIM identity demo: e.g. "User verified via SIM/eSIM ID" or "secure profile bound to device"
- Product cards with **benefit visualization** (savings shown clearly)

## Explicitly out of scope (do NOT build)

Real SIM-underlay, real eSIM integration, banking/payments, real marketplace APIs, real AI models, legal layer, logistics/delivery, browser extension/telecom infrastructure. All of these are presented **conceptually** (slide / architecture diagram) at most.

Allowed: mock data, demo product cards, fake prices, simplified user base, simulated recommendations.

## SIM/eSIM — handle as concept only

Pure UI + one architecture slide. A verification screen with a "✓ Verified via SIM/eSIM ID" badge and device-binding framing. It's the long-term identity layer; for the demo it's abstracted.

## Evaluation criteria (optimize for these)

1. Clarity of the user path
2. UI quality & app usability
3. Realism of the group-buying mechanism
4. Logic of personalized recommendations
5. Understanding of SIM/eSIM as an identity layer
6. Technical feasibility
7. Scaling potential
8. Final presentation quality

## Final deliverables

- Demo of the MVP / clickable prototype
- Short deck (5–7 slides)
- Explanation of the solution architecture
- Walkthrough of the user journey
- Proposals for future product development

## Positioning (for the deck)

- **Level 1 — Hackathon / MVP:** AI-driven collective purchasing platform for localized access to global marketplaces. AI + group buying + marketplace aggregation + localization.
- **Level 2 — Strategic vision:** SIM/eSIM identity layer + telecom integration + secure commerce ecosystem.

## Build priorities (where the hours go)

The trap is building plumbing nobody scores. Spend every hour on the **visible path**:

- Smooth screen flow front to back.
- The group-buy "price drop" moment — this is the hero interaction.
- A **live participant counter** that ticks up (simulated) so the group-buy feels alive.
- Clear savings visualization on each card (was → now, % off, "you save X").

Ship the dumb version of everything first, then polish the hero moments.
