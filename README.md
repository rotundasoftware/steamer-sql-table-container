SQLTableContainer
===========================

This is a SQL table backed container meant to be used with [Steamer](https://github.com/rotundasoftware/steamer).

#Usage

```javascript
var contactsContainer = new SQLTableContainer( {
    tableName   : 'contacts',
    client      : 'postgres',
    connectionInfo  : {
    	host        : "localhost",
    	user        : "dbUser",
    	password    : "password",
    	database    : "dbName"
    }
} );

var ssData = new steamer.Boat( {
    contacts : contactsContainer,
} );

// load the id, name, and gender for all contacts that have gender === 'f'
ssData.add( {
    contacts : {
        // Add an item to the contact container's "manifest" (i.e. list of contents).
        fields  : [ 'id', 'name', 'gender' ],
        where   : { gender : 'f' }
    }
} );
```

#API

##Constructor - SQLTableContainer( options )

The constructor accepts an `options` hash. It must contain a `tableName` and either a `connectionInfo` and `client` or a `knex` client.

Using `connectionInfo` and `client`:

```javascript
options = {
  "tableName" : "contacts",   // required: The table from which this container will be loading data
  "client" : "pg",            // (mysql|pg|sqllite3)
  "connectionInfo" : {        // optional: a connection info object
    host        : "localhost",
  	user        : "dbUser",
  	password    : "password",
  	database    : "dbName"
  }
};
```

Using a `knex` client:

```javascript

var knex = require( 'knex' )( {
    "client" : "pg",
    "connection" : {
        host        : "localhost",
        user        : "dbUser",
        password    : "password",
        database    : "dbName"
} );

options = {
  "tableName" : "contacts",   // required: The table from which this container will be loading data
  "knex" : knex,
};
```

##container.add( manifest )

```javascript
manifest = {
  "fields"  : [ "id", "name" ],  // required: array of fields to laod
  "where"   : { name : "John" }, // optional: mongo-style query specifying which rows to load.
                                 // supports: $or, $nin, $in, $lt, $lte, $gt, $gte
  "offset"  : 10,                // optional: how many records to skip
  "limit"   : 50,                // optional: maximum number of records to load
}
```
