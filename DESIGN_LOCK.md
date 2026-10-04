# CareNaija design lock

This document records the existing app patterns, created with the user's permission. It is not a redesign.

## Keep unchanged
- Preserve the current typography, page structure, navigation, hospital cards, and responsive behavior unless a request explicitly changes them.
- Reuse the UI components under `client/src/components/ui`, existing Tailwind classes, and `client/src/index.css` tokens.
- Do not introduce a new palette, font, component library, or global theme for a feature.

## Existing conventions
- Body text uses Plus Jakarta Sans; headings inherit Libre Baskerville from the global stylesheet.
- The primary token is `156 65% 28%`; listing actions commonly use `bg-emerald-600 hover:bg-emerald-700`.
- Listing pages use `bg-slate-50`, white surfaces, `border-slate-200`, slate text, and emerald links/actions.
- Content wrappers use `container mx-auto px-4`. Listing surfaces use rounded corners and small shadows.
- Reuse `Button`, `Badge`, `Card`, `Select`, and Lucide icons for new listing controls.
- Keep mobile controls usable and labelled; use existing loading, empty, and error surface styles.

## Feature additions
- Add requested UI within the current page hierarchy rather than restructuring the page.
- Maps should occupy an optional results surface, leaving list view as the default.
- Distance labels should be small listing metadata, not a replacement for address or ratings.
- Retain visible keyboard focus, accessible control labels, and provider attribution.