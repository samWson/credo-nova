/** Maps JSON output from Credo into instances of the Issue class provided by Nova. */
class CredoIssue {
    /**
     * @param {JSONObject} issue - A single element from the 'issues' array provided by Credo.
     */
    constructor(issue) {
        this.category = issue['category'];
        this.check = issue['check'];
        this.column = issue['column'];
        this.column_end = issue['column_end'];
        this.filename = issue['filename'];
        this.line_no = issue['line_no'];
        this.message = issue['message'];
        this.priority = issue['priority'];
        this.scope = issue['scope'];
        this.trigger = issue['trigger'];
    }

    /**
     * Converts a Credo issue to a Nova issue.
     * @return {Issue} - The Nova issue instance.
     */
    toNovaIssue() {
        const issue = new Issue();

        issue.code = this.category;
        issue.message = this.message;
        issue.severity = this._issueSeverityMappings[this.priority];
        issue.source = 'Credo';
        issue.line = this.line_no;
        issue.column = this.column;
        issue.endLine= this.line_no;
        issue.endColumn= this.column_end;

        return issue;
    }

    /**
     * Mappings between Credo issue priorities and Nova issue severities.
     * @return {Object}
     */
     _issueSeverityMappings() {
         const mappings = {
            1: IssueSeverity.Error,
            2: IssueSeverity.Warning,
            3: IssueSeverity.Hint,
            4: IssueSeverity.Info
         };

        return mappings;
     }
}

/** Provides the main interface for invoking Credo from within Nova. */
class CredoProcess {
    inspect(file) {
        return new Promise(resolve => {
            this.run(file, this.generateIssues, resolve);
        });
    }

    /**
     * @param {String} file - The file path to collect Credo issues for.
     * @param {Function} callback - A function to be invoked on success to handle the output of the Credo command.
     * @param {Function} resolve - A function invoked to return the results of the callback function to the promise.
     * @return {void}
     */
    run(file, callback, resolve) {
        const options = {
            cwd: nova.workspace.path,
            shell: true,
            args: ['mix', 'credo', '--format', 'json', file]
        }

        console.log(`Running Credo with \`${options.args.join(' ')}\``);

        const process = new Process('/usr/bin/env', options);
        let output = "";
        let errorOutput = "";

        process.onStdout(line => output += line);
        process.onStderr(line => errorOutput += line);
        process.onDidExit(status => {
            if (errorOutput.length === 0) {
                const result = callback.apply(this, [output, errorOutput]);
                resolve(result);
            } else {
                console.error(`Credo ERROR: exit status=${status} ${errorOutput}`);
                this.displayErrorNotification(errorOutput);
            }
        });

        process.start();
    }

    /**
     * @param {String} output - A string containing the JSON output of the Credo command.
     * @param {String} errorOutput - A string containing any error messages output by Credo.
     * @return {Array} An array of CredoIssue instances parsed from the supplied JSON output.
     */
    generateIssues(output, errorOutput) {
        if (errorOutput) console.warn(`Credo ERROR: ${errorOutput}`);

        try {
            const data = JSON.parse(output);

            this.issues = data.issues.map(issue => new CredoIssue(issue));
            console.info(this._reportIssuesReceived());

            return this.issues;
        } catch(error) {
            console.error(`Credo Nova Extension ERROR: ${error}`)
        }
    }

    displayErrorNotification(error) {
        const request = new NotificationRequest('credo-error');
        request.title = 'Credo Encountered an Error';
        request.body = `${error}\nPlease check your configuration.`;
        request.actions = [nova.localize('Dismiss'), nova.localize('Project Settings')];

        const notificationPromise = nova.notifications.add(request);

        notificationPromise.then((response) => {
            if (response.actionIdx === 1) nova.workspace.openConfig();
        }).catch((error) => {
            console.error(`Credo Nova Extension ERROR: ${error}`);
        });
    }

    _reportIssuesReceived() {
        const total = this.issues.length;
        const priorityOne = this.issues.filter(issue => issue['priority'] === 1).length;
        const priorityTwo = this.issues.filter(issue => issue['priority'] === 2).length;
        const priorityThree = this.issues.filter(issue => issue['priority'] === 3).length;
        const priorityFour = this.issues.filter(issue => issue['priority'] === 4).length;

        return `Received ${total} issues from Credo:
priority\t| total
1\t\t| ${priorityOne}
2\t\t| ${priorityTwo}
3\t\t| ${priorityThree}
4\t\t| ${priorityFour}`;
    }
}

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

