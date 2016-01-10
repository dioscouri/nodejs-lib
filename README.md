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

### Add HTTP Middleware

To attach your own middleware you can bind to one of the following Application events:

```JavaScript
    HTTPServer.HTTPServerEvents = {
        BEFORE_INIT: 'BEFORE_INIT',
        BEFORE_INIT_HTTP_MIDDLEWARE: 'BEFORE_INIT_HTTP_MIDDLEWARE',
        BEFORE_REGISTER_HTTP_STATIC: 'BEFORE_REGISTER_HTTP_STATIC',
        BEFORE_REGISTER_HTTP_BODY: 'BEFORE_REGISTER_HTTP_BODY',
        BEFORE_REGISTER_HTTP_COOKIE: 'BEFORE_REGISTER_HTTP_COOKIE',
        BEFORE_REGISTER_HTTP_SESSION: 'BEFORE_REGISTER_HTTP_SESSION',
        BEFORE_REGISTER_PASSPORT: 'BEFORE_REGISTER_PASSPORT',
        AFTER_INIT_BASIC_MIDDLEWARE: 'AFTER_INIT_BASIC_MIDDLEWARE'
    };
```

Please make sure that inside your application start file (server.js) your applications defined before init() method. Please see example below:

```JavaScript
applicationFacade.load('server', DioscouriCore.HTTPServer);
applicationFacade.load('queue', DioscouriCore.QueueClient);

/**
 * Loading applications
 */
applicationFacade.loadApplications('apps.json');

// Initializing all modules
applicationFacade.init();

/**
 * Running server
 */
applicationFacade.run();
```

In you Bootstrap class you should define preInit() method and add Listeners to needed middleware events:

```JavaScript
/**
 * Pre-Initializing module configuration
 */
preInit () {
    /**
     * Register middleware before ANY STATIC Resource handled. In this case middleware will be applied each time any resource (css, image, static html etc) loaded from the server.
     */
    this.applicationFacade.addListener(DioscouriCore.HTTPServer.HTTPServerEvents.BEFORE_REGISTER_HTTP_STATIC, function (event) {
        this.server.application.use(function (req, res, next) {
            console.log('CUSTOM MIDDLEWARE. Time:', Date.now());
            next();
        });
    });
    /**
     * Register middleware before passport checks. In this case middleware will be applied before authorization middlewares.
     */
    this.applicationFacade.addListener(DioscouriCore.HTTPServer.HTTPServerEvents.BEFORE_REGISTER_PASSPORT, function (event) {
        this.server.application.use(function (req, res, next) {
            console.log('BEFORE_REGISTER_PASSPORT. Time:', Date.now());
            next();
        });
    });
}
```

### Use Model validator

Configure mandatory fields validation:

```JavaScript
this._validationMandatoryFields = [{
    patch: 'firstName',
    // fix method
    fix: (instance, callback) => {
        instance.firstName = 'Some Name';
        instance.save((err) => {
            // @argument err - Error
            // @argument fixed - Fixed or not, true or false
            callback(err, true);
        });
    },
    // Notification to create. Will not be created if the fix method return true as the second param in callback.
    notification: {
        type: 'MISSING_FIRST_NAME',
        priority: 'danger',
        message: 'Doctor first name is missing'
    }
}];
```

Configure custom validators:

```JavaScript
this._customValidators = [
    (instance, errors, callback) => {

        if (instance.someField != 'someValue') {
            errors.push({
                type: 'MY_ERROR',
                priority: 'danger',
                message: 'Opps'
            });
        }

        // Also possible to fix the instance and not to push any error.
        
        callback();
    }
];
```

Notification callback:

```JavaScript
/**
 * This callback will be called if fix method return error or false as the second param in callback, or fix method not defined.
 * Can also be called if broken reference found.
 *
 * @param instance - resource instance
 * @param notification
 * @param callback
 */
notifyAboutInvalidResource (instance, notification, callback) {

    // Create & Send the notification

    DioscouriCore.ApplicationFacade.instance.registry.load('Admin.Models.Notification').sendNotification({
        notificationType: notification.type,
        resourceType: this.listName,
        resourceId: instance._id,
        message: notification.message,
        priority: notification.priority,
        originator: instance.last_modified_by,
        targetUser: instance.last_modified_by
    }, callback);
}
```

In order to validate all Models instances use:

```JavaScript
model.validateAll(() => {/* Validation finished */})
```
