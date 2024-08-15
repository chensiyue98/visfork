## Introduction

The project aims to visualize the evolution of fork ecosystems in GitHub. It provides severval visualizations for forks of a target repository to help developers understand the system.

The project is built with [Next.js](https://nextjs.org/) and hosted on [Vercel](https://vercel.com) for online demonstration.

## Project Setup

### Prerequisite
To host the project locally, make sure you have the [Node.js](https://nodejs.org/) environment installed.

[npm](https://www.npmjs.com/) is the default package manager of Node.js. We recommend to install [Yarn](https://yarnpkg.com/) for package management.

### Run code
Download the [latest release](https://github.com/chensiyue98/visfork/releases/) or clone this repository and `cd` into the directory. Run the following command to install dependencies and start the demo:

```
yarn install
yarn dev
```

You should see the demo available at http://localhost:3000

## Usage

VisFork will load some preset data for a quick exploration of the tool. To explore other repositories, simply input the name or the URL of a repository in the input field. The name should be in the format:
```
Owner/Repo
```

By default, it will fetch data of the five most stared forks in the past one year. You can alter the query range by changing the parameters in the 'ADVANCED' settings.

Click on the 'SUBMIT' button, you will see visualizations for forks. You can download the queried raw data in JSON format at the bottom of the page, in case you wish to review the data in the future.

To load history data from a JSON file, click on the button 'UPLOAD JSON' and select the .json file you downloaded.
