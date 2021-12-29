const CredoIssue = require('./credo-issue');

/** Provides the main interface for invoking Credo from within Nova. */
class CredoProcess {
    /**
     * Inspect is the means by which Credo checks a specific file for issues.
     * @param {String} file - The file path to inspect with Credo.
     * @return {Promise} A promise to return a collection of Credo issues.
     */
    inspect(file) {
        return new Promise(resolve => {
            this._run(file, this._generateIssues, resolve);
        });
    }

    /**
     * @param {String} file - The file path to collect Credo issues for.
     * @param {Function} callback - A function to be invoked on success to handle the output of the Credo command.
     * @param {Function} resolve - A function invoked to return the results of the callback function to the promise.
     * @return {void}
     */
    _run(file, callback, resolve) {
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
                this._displayErrorNotification(errorOutput);
            }
        });

        process.start();
    }

    /**
     * @param {String} output - A string containing the JSON output of the Credo command.
     * @param {String} errorOutput - A string containing any error messages output by Credo.
     * @return {Array} An array of CredoIssue instances parsed from the supplied JSON output.
     */
    _generateIssues(output, errorOutput) {
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

    _displayErrorNotification(error) {
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

module.exports = CredoProcess;
