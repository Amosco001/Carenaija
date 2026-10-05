---
name: Dependency override verification
description: npm can retain an incompatible locked and installed subtree after a transitive override changes.
---

Do not treat an added npm override as evidence that a vulnerable transitive dependency has been replaced. Verify both the lockfile and the actual installed dependency graph, including clean-install reproducibility.

**Why:** In this environment, ordinary install, update, and deduplication operations retained an older nested package despite its new override, leaving an invalid dependency graph and audit findings. A manifest-only check would have incorrectly reported the issue fixed.

**How to apply:** After security-related override changes, require matching resolved versions, a clean-install check, an audit, and compatibility tests for the affected parent API before declaring success.