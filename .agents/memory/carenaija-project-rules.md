---
name: CareNaija project rules
description: Standing user requirements for changes to the live CareNaija site.
---

For CareNaija, do not change existing visual design unless the user explicitly asks. New UI must reuse existing components, Tailwind classes, and tokens in `DESIGN_LOCK.md`. Before implementation, read `PROJECT_NOTES.md` and `DESIGN_LOCK.md`; update `PROJECT_NOTES.md` when the task is finished. Keep changes small and limited to task scope, never expose secrets, and stop to ask before any change that requires visible design changes. When delivering, list changed files, explain each change, and state how to test it in preview.

**Why:** The user states CareNaija is a live production site and requires visual and scope stability.

**How to apply:** Treat these as standing constraints for all future CareNaija implementation tasks; if either required document is missing, report that and avoid guessing at its guidance.