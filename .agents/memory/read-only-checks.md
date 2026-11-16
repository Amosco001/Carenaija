---
name: Read-only check integrity
description: Database inspection can cause incidental workspace configuration changes even when SQL is read-only.
---

When the user requests a read-only baseline, verify both database safety and the final working-tree diff.

**Why:** In this workspace, database inspection has repeatedly reordered existing runtime modules in `.replit` even though the SQL only read data. Read-only SQL alone does not guarantee unchanged workspace configuration.

**How to apply:** Compare the working tree before and after inspection. Restore only incidental tool-generated changes through the supported configuration controls; never discard unrelated user edits. Do not confuse a module-order change with a change to application logic or database data.
