# express-seqsearch
[![Build Status](https://travis-ci.org/lypnol/express-seqsearch.svg)](https://travis-ci.org/lypnol/express-seqsearch)

Express sequelize search & paginate middleware
This is a custom middleware to paginate, sort, filter and search Model entries in a Sequelize Express app.
It uses [sequelize.findAndCountAll](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#-findandcountall-search-for-multiple-elements-in-the-database-returns-both-data-and-total-count).

# Usage

You can add the middleware at the end of your route handlers if the results you want to send are to be paginated.
```javascript
const express = require('express');
const router = express.Router();
const expressSeqsearch = require('express-seqsearch');

const sequelize = new Sequelize({
    // Sequelize config
});
const User = sequelize.define('user', {
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING
});
User.public = function() {
    return ['first_name', 'last_name'];
};
User.searchables = function() {
    return ['first_name', 'last_name'];
};

router.get("/users", /* other middlewares ... */, expressSeqsearch(sequelize, User));
```

Now, when you query the route `/users` the results will be returned in the following format:
```javascript
{
    count: # total number of entries
    rows: [data]
}
```

Most importantly, you can add options to query data either by passing them to function `expressSeqsearch` directly or by sending them as query params.

## Allowed query options

| Option      | Query Param                   | Default             | Description                                                                                                                                     |
|-------------|-------------------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| query       | q=value                       | ""                  | Search for "value" in model's searchable attributes                                                                                             |
| filter      | f_[attribute_name]=value      | null                | Adds sql where clause to query                                                                                                                  |
| sort        | s_[attribute_name]=(ASC|DESC) | null                | Adds sql order by clause to query                                                                                                               |
| searchables | -                             | Model.searchables() | Defines which attributes would be searchable                                                                                                    |
| attributes  | -                             | Model.public()      | Defines which attributes would to be selected, See sequelize [attributes](http://docs.sequelizejs.com/manual/tutorial/querying.html#attributes) |
| include     | -                             | Model.include()     | See sequelize [include](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#eager-loading)                                            |
| offset      | o=value                       | 0                   | Adds offset to query (for pagination)                                                                                                           |
| limit       | l=value                       | 10                  | Adds limit to query (for pagination)                                                                                                            |
| group       | None                          | null                | See sequelize [group](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#manipulating-the-dataset-with-limit-offset-order-and-group) |

## Options passing

The middlewares parses the `req.query` object and reads from `req.list` if it exists.  
You can pass the same options to `req.list` directly if they depend on some other sequelize models.  
for example:  
```javascript
router.get("/users", function(req, res, next) {
    req.list = { attributes: ['first_name'] };
}, expressSeqsearch(sequelize, User));

// Has the same behavior as

router.get("/users", expressSeqsearch(sequelize, User, { attributes: ['first_name'] }));
```

# Developpement

to run the tests on your local machine you should start postgres service with docker:
```
$ docker-compose start
$ npm test
```
