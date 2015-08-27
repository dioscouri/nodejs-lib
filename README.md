# Dioscouri Core NodeJS Library

## Configuration

To get started, create a .env file in your root folder. Please use .env-base file as a template.
The .env file is specific to your environment and should not be part of the git repository (it is included to .gitignore).
Its contents should be at the minimum a line like the following:

```ini
APPLICATION_ENV=environment-name
```

Our server.js file will then load a config file based on that APPLICATION_ENV value.

Save your config file in this location:
/config/env

Using the example from above, our application will look for this config file:
/config/env/environment-name

## Run Application

As nodejs itself do not support ES6 in production mode, you need to use iojs (modern branch of nodejs) to run the application.

Please download latest build of iojs from https://iojs.org/dist/

Current build may be download using one of the links below.

    Win-x64: https://iojs.org/dist/v3.2.0/iojs-v3.2.0-x64.msi
    Mac: https://iojs.org/dist/v3.2.0/iojs-v3.2.0.pkg

To run the application please do the following:

Install dependencies:

```
npm install
```

And run server:

```
iojs --es_staging --harmony_modules --harmony_arrow_functions server.js
```
