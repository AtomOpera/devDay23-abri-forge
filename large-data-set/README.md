# Working with large data sets on Forge

## Slack Workspace
1. If you haven't already, join DevDay 2023's Slack workspace: http://go.atlassian.com/devday23slack
2. Join this workshop's discussion in `#workshop-working-with-large-data-sets-on-forge`

## Prerequisites

To attend this training session, participants should meet the following prerequisites:

- A working knowledge of Forge (e.g. have completed the "Build a Confluence hello world app" tutorial, or similar) and a general awareness of Jira Cloud and/or Confluence.
- Set up an Atlassian Cloud developer site.
- Activate Jira Software and Confluence on your developer site if they aren’t already enabled (we will be using both during the workshop):
    - Go to <yoursitename>.atlassian.net/admin
    - Select Products > Add product.
    - Find Jira Software in the list and add it to your site.
    - Repeat the process to add Confluence to your site as well.
- Create a project in Jira with at least three issues.
- Follow Getting started with Forge and ensure you have installed the Forge CLI and all dependencies including Docker, an LTS release of Node.js (version 16.x or 18.x), and npm. See Operating System specific instructions for Apple macOS, Linux, or Windows 10.
- Test your local environment is set up correctly by running the forge whoami command, which should display your name and email address.
- Install a JavaScript-friendly IDE you are comfortable with when developing Forge apps (we recommend Visual Studio Code).
- Install Git.

The workshop will be more interesting if you’ll follow along, so please have your environment ready beforehand and be prepared to develop an app on your computer together with us.

## Setup
1. Clone this repository: `git clone https://iragudo@bitbucket.org/atlassian/dd23-forge-advanced.git`
2. Change directory: `cd {directory-name}`
3. Install the following dependencies that will be used by the project: `npm install @forge/api @forge/events @forge/resolver`
4. Register the exercise app and update the appId: `forge register`
5. Deploy the app: `forge deploy`
6. Install the app to both Jira and Confluence. Execute this twice - one for each product: `forge install`

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- After doing any changes to `manifest.yml` always run the following for the changes to take effect
    1. `forge deploy`
	2. `forge install --upgrade`
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

If you need help getting set up, please create a topic on the Developer Community or join the DevDay Workshops: Pre-workshop Office Hours event where our team will be available to troubleshoot any setup issues.