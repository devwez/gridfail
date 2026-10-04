# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1   | No        |

GridFail is pre-1.0. Security fixes land on the latest minor.

## Reporting a vulnerability

Email **ekhore111@gmail.com** with:

- What you found and where
- Steps to reproduce
- What you think the impact is

You'll get a reply within 7 days. Please don't open a public issue for
vulnerabilities — give us a chance to fix first, and we'll credit you in the
release notes (unless you'd rather stay anonymous).

## Scope notes

- GridFail has **no backend and no accounts** — all data stays in the
  browser's IndexedDB. Most "data leak" style reports don't apply.
- The optional OpenAI fallback uses a user-supplied key stored locally and
  never committed. Don't send us your keys.
- Model and OCR assets load from public CDNs pinned in the service worker;
  supply-chain concerns there are in scope.
