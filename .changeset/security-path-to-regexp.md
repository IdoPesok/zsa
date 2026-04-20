---
"zsa-openapi": patch
---

Security: bump bundled `path-to-regexp` to `^6.3.0` to fix backtracking ReDoS
vulnerability (GHSA-9wv6-86v2-598j). `path-to-regexp` is bundled into the
published `zsa-openapi` dist, so all consumers previously shipped the
vulnerable 6.2.2 version.
