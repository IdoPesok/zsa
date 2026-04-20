---
"zsa-openapi": patch
---

security: bump bundled `path-to-regexp` to `^6.3.0` to fix ReDoS ([GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j)); return `null` instead of `{}` from `parseRequest` when a wildcard route matches a path with a different segment count so the handler responds with 404 instead of 500.
