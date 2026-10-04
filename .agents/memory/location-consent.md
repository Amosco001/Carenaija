---
name: Location consent
description: Consent boundary for optional maps, nearby sorting, and cached browser coordinates.
---

Opening an optional map must not request the visitor's location. The explicit nearby-hospitals action requests browser location. Cached coordinates are data, not proof of current permission; revocation must stop location-derived displays.

**Why:** Maps remain useful without locating the visitor. The previous location cache could be treated as permission even after browser permission changed, contrary to the requested permission-based experience.

**How to apply:** Keep map viewing independent from location consent. Future location features must honor current browser permission, not just the presence of stored coordinates.