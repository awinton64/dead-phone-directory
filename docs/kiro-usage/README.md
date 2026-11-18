# Kiro usage evidence

- [kiro-usage-log.md](kiro-usage-log.md): every Kiro CLI run on this repo (16 runs), with the exact prompt, start and end time, trusted tools, files changed and credits before and after (read from the Kiro usage API with the CLI's own session).
- [runs/](runs/): the raw transcript of each run, as printed by `kiro-cli chat --v3 --no-interactive`. They are kept verbatim (including Kiro's own punctuation); only local home paths and the Kiro account ID are redacted.
- [../audits/2026-11-18-qa-audit.md](../audits/2026-11-18-qa-audit.md): the accessibility and print audit produced by the `qa-auditor` custom agent through the Playwright MCP server (run 16).

These files were assembled by Claude Code from its run logs. Kiro did not write them.
