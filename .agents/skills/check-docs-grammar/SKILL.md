---
name: check-docs-grammar
description: Check and fix grammar and spelling in documentation files. Use when asked to proofread docs, fix grammar, fix spelling, check writing, or correct documentation text in git-changed files, a specific file, or a directory.
---

# Check documentation grammar

Check and fix grammar and spelling in documentation Markdown files. Perform the language review directly; use the bundled `scripts/driver.mjs` only for file discovery.

## Discover files

Resolve this skill's installed directory from the path used to load this `SKILL.md`, then run its driver from the repository root:

```bash
# No argument: documentation changed in git relative to main/HEAD
node <skill-directory>/scripts/driver.mjs

# Specific file or directory
node <skill-directory>/scripts/driver.mjs docs/getting-started.md
node <skill-directory>/scripts/driver.mjs docs/
```

The driver outputs one absolute path per line, or `NO_FILES` if nothing qualifies. Pass a user-specified path as the argument; otherwise run with no argument.

## Review and fix

For every discovered file:

1. Read the complete file.
2. Correct only clear grammar and spelling errors with `apply_patch`.
3. Preserve code blocks, inline code, URLs, link targets, frontmatter keys, imports, identifiers, API names, and framework-specific syntax such as VitePress containers.
4. Do not add content, expand sentences, or rephrase merely for style.

Fix misspellings, duplicate words, wrong articles, subject-verb disagreement, clearly missing or extra sentence punctuation, and incorrect sentence-start capitalization. Preserve intentional informal tone, valid technical terms, placeholder prose, and single-word headings or labels.

Use the project's preferred `TypeScript` casing in prose.

Treat `docs/markdown-examples.md` and `docs/api-examples.md` as VitePress boilerplate; do not correct placeholder prose such as Lorem ipsum. Leave non-prose VitePress frontmatter values unchanged.

## Verify and report

Review the diff to confirm that every change is a narrow language correction and that protected content is untouched. Report:

```text
Files checked: N
Files with corrections: N
  - path/to/file.md — N fix(es): brief description
Files with no issues: N
```

If the driver returns `NO_FILES`, report that no documentation files were found in the git diff and suggest passing a path explicitly.
