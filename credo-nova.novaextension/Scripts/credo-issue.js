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

module.exports = CredoIssue;
