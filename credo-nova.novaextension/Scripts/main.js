const CredoProcess = require('./credo-process');

/** Primary interface for interacting with Credo from within Nova. */
class Credo {
    constructor() {
        this.issueCollection = new IssueCollection();
        this.process = new CredoProcess();
    }

    provideIssues(editor) {
        const file = editor.document.path;
        const novaIssues = [];

        this.process.inspect(file).then((issues) => {
            issues.forEach(issue => {
                novaIssues.push(issue.toNovaIssue());
            });

            console.info(this._reportIssuesProvided(novaIssues));
            this.issueCollection.set(editor.document.uri, novaIssues);

            return novaIssues;
        });

        editor.onDidDestroy(destroyedEditor => {
            // Check to see if the same file is open in another tab first
            const editorWithSameFile = nova.workspace.textEditors.find(editor => {
                return editor.document.uri === destroyedEditor.document.uri;
            });

            if (!editorWithSameFile) this.issueCollection.remove(destroyedEditor.document.uri);
        });
    }

    _reportIssuesProvided(issues) {
        const total = issues.length;
        const error = issues.filter(issue => issue.severity === IssueSeverity.Error).length;
        const warning = issues.filter(issue => issue.severity === IssueSeverity.Warning).length;
        const hint = issues.filter(issue => issue.severity === IssueSeverity.Hint).length;
        const info = issues.filter(issue => issue.severity === IssueSeverity.Info).length;

        return `Credo-Nova provided ${total} issues:
severity\t| total
Error\t| ${error}
Warning\t| ${warning}
Hint\t\t| ${hint}
Info\t\t| ${info}`;
    }
}

nova.assistants.registerIssueAssistant("elixir", new Credo(), { event: "on-save" });

