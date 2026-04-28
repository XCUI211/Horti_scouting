# Horti Scouting 26

## Automation

### Continuous Integration
This project uses an automated analysis workflow that reviews pull requests and ensures that the new code obliges to security checks and does not break existing functionality. It runs analysis for the root, backend, and frontend, providing clarity and ease with fixing errors. The checks are run automatically on Pull Requests and can be viewed on the Pull Request page.

#### Prerequisites
* **Node.js**: v24.x
* **npm**: v10.x or higher

#### Local Checks
Before pushing code, you can run CI checks locally to catch any errors faster. This performs the security audits and unit test checks for all parts of the project.

In the **root** directory run:
   > npm run ci-check

 Note: if some tests fail, for example in server directory, the tests for the remaining zones will not run. <br />
 Alternatively, you can run the CI checks separately using these commands in **root**: <br />
 1. To perform overall security audit and all unit tests:
    > npm run audit <br />
    > npm test <br />
 3. To test the root:
    > npm run test:root
 2. To check the backend:
    > npm run test:server
 3. To check the frontend:
    > npm run test:frontend <br />

#### Viewing Pull Request status
You can view the status of the checks on GitHub during your PR, click on "Details" to find out more about specific checks.

---

## Running the Project

### Installation
In the **root** directory run:
   > npm install

This installs dependencies for the root, backend, and frontend using npm workspaces.

### Start the application
In the **root** directory run:
   > npm run startup

This will start:
- Frontend (Vite) at http://localhost:5173
- Backend (Express) at http://localhost:5000

### Running parts separately (optional)

To run only the frontend:
   > npm run dev --workspace=frontend

To run only the backend:
   > npm run start --workspace=server

### Notes
- You only need to run `npm install` once in the root directory
- There is no need to manually navigate into subfolders
- If dependencies break, you can do a clean install:
   > rm -rf node_modules package-lock.json <br />
   > npm install
