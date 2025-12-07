# Error Oracle - VS Code Extension

A tiny VS Code extension that explains the error at your cursor and helps you jump to docs.

## Features

- Command: **Error Oracle: Explain error at cursor**
  - Looks at the diagnostic under your cursor
  - Matches common patterns for Python, TypeScript, and JavaScript
  - Shows a short human-readable explanation
  - Optional button: **Search web for this error** (opens your browser with a pre-filled query)

## Usage

1. Install and enable Error Oracle.
2. Open a file that has a red squiggly error (check the **PROBLEMS** panel).
3. Place your cursor on the line with the error.
4. Run the command:

   - Command Palette → `Error Oracle: Explain error at cursor`

## Roadmap / Ideas

- More built-in rules for popular errors.
- Language-specific doc search (not just Google).
- Optional LLM-based explanations when an API key is configured.