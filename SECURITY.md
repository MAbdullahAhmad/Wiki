# Security Policy

## Supported versions

Only the latest commit on `main` is supported. Older versions don't receive fixes; rebase onto current `main` to pick up any security patches.

## Reporting a vulnerability

If you've found a security issue, **please do not open a public issue.** Instead, report it privately:

- Open a GitHub Security Advisory at https://github.com/MAbdullahAhmad/Wiki/security/advisories/new, or
- Email the repository owner via the contact listed on [github.com/MAbdullahAhmad](https://github.com/MAbdullahAhmad).

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof-of-concept.
- The commit hash where you observed the issue.

You can expect an acknowledgement within 72 hours and a status update within 7 days. Coordinated disclosure timelines are negotiated case-by-case based on severity and exploitability.

## Scope

This is a static markdown wiki — no server, no database, no user accounts. The realistic attack surface is:

- The publish pipeline (untrusted markdown content).
- The deploy script (write access to `gh-pages`).
- Client-side dependencies (npm packages).

Issues outside this scope (e.g. social engineering, GitHub platform vulnerabilities) should be reported to the appropriate vendor instead.
