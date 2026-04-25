# Horti Scouting 26

## Automation

### Continuous Integration
This project uses an automated analysis workflow that reviews pull requests and ensures that the new code obliges to security checks and does not break existing functionality. It runs analysis for the root, backend, and frontend separately, providing clarity and ease with fixing errors. The checks are run automatically on Pull Requests and can be viewed at the bottom of the Pull Request page.

#### Prerequisites
* **Node.js**: v24.x
* **npm**: v10.x or higher

#### Local Checks
Before pushing code, you can run CI checks locally to catch any errors faster. This performs the security audits and unit test checks for all parts of the project.

In the **root** directory run:
   > npm run ci-check

 Note: if some tests fail, for example in server directory, the tests for the remaining zones will not run. <br />
 Alternatively, you can navigate to each directory separately and run the CI check there: <br />
 1. In **root**:
    > npm audit --audit-level=high <br />
    > npm test
 2. To check the backend (starting in root directory):
    > cd server <br />
    > npm install <br />
    > npm audit --audit-level=high <br />
    > npm test <br />
 3. To check the frontend (starting in root directory):
    > cd frontend <br />
    > npm install <br />
    > npm audit --audit-level=high <br />
    > npm test -- --run <br />

#### Viewing Pull Request status
You can view the status of the checks on GitHub during your PR, click on "Details" to find out more about specific checks.

