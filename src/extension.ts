import * as vscode from 'vscode';

type Rule = {
    language: string;      // e.g. "python", "typescript", "javascript" but currently only python
    pattern: RegExp;
    explanation: string;
};

/**
 * Tiny rule list for v1.
 */
const RULES: Rule[] = [
    // Undefined name / variable
    {
        language: 'python',
        pattern: /not defined/i,
        explanation: `This Python error means you're using a name (variable or function) that hasn't been defined in this scope.

Common fixes:
- Check for typos in the name
- Make sure you assign to the variable before using it
- Ensure you've imported the function/module before calling it`
    },
    // Type errors
    {
        language: 'python',
        pattern: /TypeError/i,
        explanation: `Python TypeError means an operation or function was used with the wrong type.

Common causes:
- Adding or concatenating incompatible types (e.g. string + int)
- Passing the wrong type of argument into a function
- Using a function in a way that doesn't match its signature`
    }
];

/**
 * Pick an explanation based on the message and language.
 */
function explainError(message: string, languageId: string): string {
	// 1) Try language-specific rules
	for (const rule of RULES) {
		if (rule.language === languageId && rule.pattern.test(message)) {
			return rule.explanation;
		}
	}

	// 2) Fallback generic explanation
	    return [
        `Error Oracle doesn't have a specific explanation for this message yet.`,
        ``,
        `Error text:`,
        `> ${message}`,
        ``,
        `Things you can try:`,
        `- Read the error carefully and note which variable/type it's about`,
        `- Check the line above as well (errors often come from there)`,
        `- Search the exact error message online or in your language docs`
    ].join('\n');
}

// get error at position automatically
function getDiagnosticAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Diagnostic | undefined {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    return diagnostics.find(d => d.range.contains(position));
}

/**
 * Called when extension is activated.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Error Oracle is now active');

    const hoverProvider = vscode.languages.registerHoverProvider(
        ['python'],
        {
            provideHover(document, position, token) {
                const diag = getDiagnosticAtPosition(document, position);
                if (!diag) {
                    return;
                }

                // Include both errors and warnings, skip info/hints
                if (
                    diag.severity !== vscode.DiagnosticSeverity.Error &&
                    diag.severity !== vscode.DiagnosticSeverity.Warning
                ) {
                    return;
                }

                const languageId = document.languageId;
                const explanation = explainError(diag.message, languageId);

                // Convert plain text explanation to markdown
                const md = new vscode.MarkdownString();
                md.appendMarkdown('**Error Oracle** (Python)\n\n');
                md.appendText(explanation);

                // web search link
                const query = encodeURIComponent(`python ${diag.message}`);
                md.appendMarkdown('\n\n---\n');
                md.appendMarkdown(
                    `[Search this error on the web](https://www.google.com/search?q=${query})`
                );

                return new vscode.Hover(md);
            }
        }
    );

    context.subscriptions.push(hoverProvider);
}

/**
 * Called when extension is deactivated.
 */
export function deactivate() {}