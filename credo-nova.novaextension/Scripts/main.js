
exports.activate = function() {
    // Do work when the extension is activated
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

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
    /**
     * Prepares the interface with the Credo shell command.
     * @param {String} baseCommand - The shell command used to invoke Credo, as specified by the user's preferences.
     */
    constructor() {
        this.processOptions = {
            cwd: nova.workspace.path,
            shell: true
        }
    }

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

    /**
     * Fetches user preferences from Nova, with workspace preferences taking
     * priority over general extension preferences.
     * @param {String} name - The name of the configuration setting to retrieve, as labelled in ./configuration-options.json.
     * @return {(String | Boolean)} - The value of the user preference from Nova.
     */
    getConfig(name) {
        const workspaceConfig = nova.workspace.config.get(name) ? nova.workspace.config.get(name) : null;
        const extensionConfig = nova.config.get(name);

        return workspaceConfig === null ? extensionConfig : workspaceConfig;
    }
}

nova.assistants.registerIssueAssistant("elixir", new Credo(), { event: "on-save" });

