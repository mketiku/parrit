# Security Policy

Parrit is built with a **Private by Design** architecture. We believe your team's pairing data is sensitive and should be handled with the highest standard of security and transparency.

## Supported Versions

Currently, only the latest landing page and application version at [parrit.org](https://parrit.org) is supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you've discovered a security vulnerability in Parrit, we would appreciate it if you could report it to us responsibly before making it public. This allows us to protect our users by fixing the issue first.

Please report vulnerabilities via **GitHub Security Advisories**:
[https://github.com/mketiku/parrit/security/advisories/new](https://github.com/mketiku/parrit/security/advisories/new)

When reporting, please include:

- A clear description of the vulnerability.
- Steps to reproduce the issue (PoC).
- Potential impact and any mitigations you suggest.

You should receive an acknowledgment of your report via GitHub within **48 hours**. We aim to resolve critical issues within **7 days**.

## Our Security Standards

### 1. Private by Design

We do not track individual productivity metrics, keystrokes, or pair "performance." We only store the data necessary to provide pairing recommendations and historical charts for the entire team.

### 2. Infrastructure Security

Parrit is powered by **Supabase**, leveraging their hardened cloud infrastructure.

- **Data Encryption**: All data is encrypted in transit via TLS 1.3 and at rest using AES-256.
- **Row Level Security (RLS)**: We use strict PostgreSQL RLS policies to ensure that users can only access data belonging to their own workspace.
- **Authentication**: We leverage Supabase's secure, production-tested authentication engine.

### 3. Client-Side Security

- We do not use third-party tracking scripts or marketing pixels inside the pairing workspace.
- The application is served with strict Content Security Policy (CSP) headers where applicable.

---

_Thank you for helping us keep Parrit secure!_
