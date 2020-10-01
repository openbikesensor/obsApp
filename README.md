# OpenBikeSensor Web App
This web app allows users to manage and visualize their tracks and measurements done with the [OpenBikeSensor](https://zweirat-stuttgart.de/projekte/openbikesensor/).

The latest release version is always deployed at (https://openbikesensor.hlrs.de).

## Getting the project to run
### Requirements
A working installation of npm and node.js - get the latest node.js LTS release at [the node.js homepage](https://nodejs.org/en/) and verify it's working via `node -v` and `npm -v` in a command prompt of your choice.

### First start
This project uses Angular and thus the Angular CLI. To get started you need to download all used packages with `npm i` in the project's root folder. 
Afterwards starting it is as easy as running `npm run start` from the console. You can now navigate to (http://localhost:4200/) in the browser of your choice to view the index page.
This alone won't be enough to get it into a usable state, though, because it's missing the necessary API backend server.

### Setting up the API backend locally
Please clone the repo from (https://github.com/Friends-of-OpenBikeSensor/obsAPI) and follow the setup instructions in the README. After everything is working in the API this Angular app should be able to connect to it and work locally.
