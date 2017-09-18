const _ = require('underscore');
const parsePrefixQueryParams = require('./parse-prefix-query-params');


module.exports = function(params) {
    let parsed = {};

    parsed.query = params.q;
    parsed.offset = params.o;
    parsed.limit = params.l;
    parsed.filter = parsePrefixQueryParams('f_', params);
    parsed.sort = parsePrefixQueryParams('s_', params);

    if (parsed.sort) {
        parsed.sort = _.pick(parsed.sort, (v) => _.contains(['ASC', 'DESC', 'asc', 'desc'], v));
        parsed.sort = _.pairs(parsed.sort);
    }

    return parsed;
};
