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

As nodejs itself now supports ES6 in production mode, you need to use latest nodejs build to run the application.

Please download latest build of nodejs from https://nodejs.org/dist/

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

## Setup Application Configuration

### MongoDB

To setup mongo please specify MongoDB connection URL in your config file. Example:


    MONGODB_URL = mongodb://user-name:password@host:27017/database


### HTTP Sessions

System supports 3 different storages for HTTP sessions^ InMemory (by default), Redis and MongoDB. Session type must be configured in environment admin file.
There are common parameters which must be defined: SESSION_STORAGE, SESSION_SECRET, SESSION_NAME.


    SESSION_STORAGE - url described session storage

    SESSION_SECRET - secret key to encrypt session uid

    SESSION_NAME - name of the parameter in cookie to store session uid


Example of session configuration with Redis storage:


    SESSION_STORAGE=redis://127.0.0.1:6379?ttl=14400
    SESSION_SECRET=1263-9857-9584-ab87-cf98
    SESSION_NAME=application.sid


Example of session configuration with MongoDB storage:


    SESSION_STORAGE=mongodb://127.0.0.1:27017/session-database?ttl=14400
    SESSION_SECRET=Session-Secret-UID-28123
    SESSION_NAME=session.sid


