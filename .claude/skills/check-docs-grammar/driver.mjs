#!/usr/bin/env node
/**
 * Finds documentation files to grammar-check.
 * Usage:
 *   node driver.mjs              → files changed in git vs main (or HEAD)
 *   node driver.mjs docs/        → all .md/.mdx files under docs/
 *   node driver.mjs docs/foo.md  → single file
 */

import { execSync } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);

function collectFiles(target) {
  const abs = resolve(target);
  if (!existsSync(abs)) {
    console.error(`Path not found: ${target}`);
    process.exit(1);
  }
  const stat = statSync(abs);
  if (stat.isFile()) return [abs];
  return readdirSync(abs, { recursive: true })
    .filter((f) => DOC_EXTENSIONS.has(extname(f)))
    .map((f) => join(abs, f))
    .sort();
}

function gitChangedDocs() {
  const tryCmd = (cmd) => {
    try {
      return execSync(cmd, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && DOC_EXTENSIONS.has(extname(l)))
        .map((l) => resolve(l));
    } catch {
      return null;
    }
  };

  // Untracked (new) files not yet staged
  const untracked = tryCmd("git ls-files --others --exclude-standard") || [];

  // Try diff vs main branch first, then vs HEAD (staged + unstaged), then recent commits
  const tracked =
    tryCmd("git diff --name-only main..HEAD") ||
    tryCmd("git diff --name-only --cached HEAD") ||
    tryCmd("git diff --name-only HEAD") ||
    tryCmd("git diff --name-only HEAD~1..HEAD") ||
    [];

  // Merge and deduplicate
  return [...new Set([...tracked, ...untracked])];
}

const arg = process.argv[2];
const files = arg ? collectFiles(arg) : gitChangedDocs();

if (files.length === 0) {
  console.log("NO_FILES");
} else {
  console.log(files.join("\n"));
}
