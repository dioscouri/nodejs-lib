# Example of Web Project which loads external module

## Configuration

There are server.js runnable script located in the root directory.

Please use .env-base file as a template. The .env file is specific to your environment and should not be part of the git repository (it is included to .gitignore).
Its contents should be at the minimum a line like the following:

    ENV_TYPE=dev
    APPLICATION_ENV=environment-name
    SERVER_HOST=::
    SERVER_PORT=3010

Main server.js file will then load a config file based on that APPLICATION_ENV value.

Save your config file in this location:
/config/env

Using the example from above, our application will look for this config file:
/config/env/environment-name

## Run Application

As nodejs itself now supports ES6 in production mode, you need to use latest nodejs build to run the application.

Please download latest build of node.js from https://nodejs.org/dist/

Current build may be download using one of the links below.

    Win-x64: https://nodejs.org/dist/v4.1.1/node-v4.1.1-x64.msi
    Mac: https://nodejs.org/dist/v4.1.1/node-v4.1.1.pkg

To run the application please do the following:

Install dependencies:

```
npm install
```

And run server:

```
node server.js
```
