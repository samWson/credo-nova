
exports.activate = function() {
    // Do work when the extension is activated
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

/** Provides the main interface for invoking Credo from within Nova. */
class CredoProcess {

}

class Credo {
    constructor() {
        this.baseCommand = this.getConfig("samuel-wilson.credo-nova.base-command");
    }

    provideIssues(editor) {
        let issues = [];

        // Create a new issue
        let issue = new Issue();

        issue.message = "Invalid syntax: Missing semicolon";
        issue.severity = IssueSeverity.Warning;
        issue.line = 4;
        issue.column = 0;

        issues.push(issue);

        return issues;
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

