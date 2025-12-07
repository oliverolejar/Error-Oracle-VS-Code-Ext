import * as vscode from 'vscode';

type Rule = {
    language: string;      // e.g. "python", "typescript", "javascript"
    pattern: RegExp;
    explanation: string;
};

/**
 * Tiny rule list for v1.
 */
const RULES: Rule[] = [
    // --- Python: undefined variable / name errors ---
    {
        language: 'python',
        pattern: /not defined/i,
        explanation: `This Python error means you're using a name (variable or function) that hasn't been defined in this scope.

Common fixes:
- Check for typos in the name
- Make sure you assign to the variable before using it
- Ensure you've imported the function/module before calling it`
    },
    {
        language: 'python',
        pattern: /TypeError: .+/,
        explanation: `Python TypeError means an operation or function was used with the wrong type.

Common causes:
- Adding or concatenating incompatible types (e.g. string + int)
- Passing the wrong type of argument into a function`
    },

		// --- TypeScript / JavaScript examples ---
    	{
        	language: 'typescript',
        	pattern: /Cannot find name '(.+)'/,
        	explanation: `TypeScript "Cannot find name" means the identifier is not in scope.

Common fixes:
- Import it from the correct module
- Declare the variable before using it
- Check for typos in the name`
    	},
		{
        	language: 'typescript',
        	pattern: /Property '(.+)' does not exist on type/,
        	explanation: `This error means you're trying to use a property that TypeScript doesn't think exists on that type.

Check:
- The type/interface definition
- Spelling of the property
- Whether you need to extend the type or add a type annotation`
    	},
		{
        	language: 'javascript',
        	pattern: /ReferenceError: (.+) is not defined/,
        	explanation: `JavaScript ReferenceError means you're using a variable that hasn't been declared in this scope.

Declare the variable first, or make sure the script that defines it runs before this code.`
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

    const disposable = vscode.commands.registerCommand(
        'error-oracle.explainError',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Error Oracle: No active editor.');
                return;
            }

            const document = editor.document;
            const cursorPos = editor.selection.active;

            const diagAtCursor = getDiagnosticAtPosition(document, cursorPos);

            if (!diagAtCursor) {
                vscode.window.showInformationMessage(
                    'Error Oracle: No error found at the cursor. Move the cursor onto a red squiggly line.'
                );
                return;
            }

            const errorMessage = diagAtCursor.message;
            const languageId = document.languageId;  // e.g. "python", "typescript", "javascript"

            const explanation = explainError(errorMessage, languageId);

            vscode.window
				.showInformationMessage(
					explanation,
					{ modal: true },
					'Search web for this error'
				)
				.then(selection => {
					if (selection === 'Search web for this error') {
						const query = encodeURIComponent(`${languageId} ${errorMessage}`);
						const url = vscode.Uri.parse(`https://www.google.com/search?q=${query}`);
						vscode.env.openExternal(url);
					}
				});
        }
    );

    context.subscriptions.push(disposable);

    const hoverProvider = vscode.languages.registerHoverProvider(
        ['python', 'typescript', 'javascript'],
        {
            provideHover(document, position, token) {
                const diag = getDiagnosticAtPosition(document, position);
                if (!diag) {
                    return;
                }

                // Only for real errors, not hints/warnings
                if (diag.severity !== vscode.DiagnosticSeverity.Error) {
                    return;
                }

                const languageId = document.languageId;
                const explanation = explainError(diag.message, languageId);

                // Convert plain text explanation to markdown
                const md = new vscode.MarkdownString();
                md.appendMarkdown('**Error Oracle**\n\n');
                md.appendMarkdown(
                    explanation.replace(/\n/g, '  \n') // newlines → markdown line breaks
                );
                md.isTrusted = true; // allow links in the future if added

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