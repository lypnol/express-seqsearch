const _ = require('underscore');


module.exports = function(prefix, params) {
    let f = {};
    _.each(_.keys(params), (key) => {
        if (key.startsWith(prefix)) {
            f[key.substr(prefix.length)] = params[key];
        }
    });

    if (!_.isEmpty(f)) return f;
    return null;
};
