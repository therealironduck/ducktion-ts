---
name: check-docs-grammar
description: Check and fix grammar and spelling in documentation files. Use when asked to proofread docs, fix grammar, fix spelling, check writing, or correct documentation text. Can target git-changed files or a specific path.
---

Check and fix grammar and spelling in documentation markdown files. You (Claude) do the checking — no external tool is involved. The driver script at `.claude/skills/check-docs-grammar/driver.mjs` handles file discovery; you read each file and apply corrections with the Edit tool.

All paths below are relative to the repo root.

## Step 1 — Discover files

Run the driver to get the list of files to check:

```bash
# No argument → files changed in git vs main branch
node .claude/skills/check-docs-grammar/driver.mjs

# Specific file
node .claude/skills/check-docs-grammar/driver.mjs docs/getting-started.md

# Whole directory
node .claude/skills/check-docs-grammar/driver.mjs docs/
```

The driver outputs one absolute path per line, or `NO_FILES` if nothing qualifies.

If the user specified a path, pass it as the argument. Otherwise run with no argument.

## Step 2 — Check and fix each file

For each file the driver listed:

1. **Read** the full file.
2. **Fix** grammar and spelling errors you find using the Edit tool.
3. **Skip** — do not touch:
   - Code blocks (fenced with ` ``` ` or indented)
   - Inline code (backtick-wrapped)
   - URLs and link targets
   - Frontmatter keys (only fix frontmatter _values_ if they contain prose)
   - Import statements, variable names, API names
   - VitePress-specific syntax (`::: info`, `:::`, custom containers)
4. **Do not add** new content, expand sentences, or rephrase for style — only correct clear errors.

### What counts as a fixable error

- Misspelled words (`recieve` → `receive`, `occured` → `occurred`)
- Duplicate words (`the the`, `is is`)
- Wrong article (`a apple` → `an apple`, `the any` → `any`)
- Subject-verb agreement (`it works` not `it work`)
- Missing or extra punctuation at sentence ends
- Capitalization at sentence starts

### What to leave alone

- Intentional informal tone or stylistic choices
- Technical terms that look unusual but are correct (`tsgo`, `esbuild`, `tsdown`)
- Placeholder content (`Lorem ipsum`, `Feature A`, `My great project tagline`)
- Single-word headings or labels

## Step 3 — Report

After processing all files, output a summary:

```text
Files checked: N
Files with corrections: N
  - path/to/file.md — N fix(es): brief description
  - path/to/other.md — N fix(es): brief description
Files with no issues: N
```

If `NO_FILES` was returned, tell the user there were no documentation files in the git diff and suggest passing a path explicitly.

## Gotchas

- **`docs/markdown-examples.md` and `docs/api-examples.md`** are VitePress boilerplate and contain placeholder prose (`Lorem ipsum`). Do not treat placeholder text as an error.
- **Frontmatter** at the top of `.md` files (`---` blocks) may contain VitePress config values like `layout: home` — these are not prose, leave them alone.
- **The `TypeScript` vs `Typescript` casing**: the project spells it `TypeScript` (capital S). Correct lowercase `Typescript` → `TypeScript` when found in prose.
