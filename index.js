const _ = require('underscore');
const paginate = require('./paginate');
const parseQueryParams = require('./parse-query-params');


module.exports = function(sequelize, model, options = {}) {
    return function(req, res, next) {
        req.list = req.list || {};
        let query = parseQueryParams(req.query);
        if (!options.attributes && model.public) options.attributes = model.public();

        return paginate(sequelize, model, {
            attributes: req.list.attributes || options.attributes,
            include: req.list.include || options.include,
            searchables: req.list.searchables || options.searchables,
            query: req.list.query || options.query || query.query,
            sort: req.list.sort || options.sort || query.sort || ((model.rawAttributes.createdAt)?[['createdAt', 'DESC']]:null),
            filter: _.extend(query.filter || {}, req.list.filter || {}, options.filter || {}),
            offset: req.list.offset || options.offset || query.offset,
            limit: req.list.limit || options.limit || query.limit || 10,
            group: req.list.group || options.group,
            rawQuery: req.list.rawQuery || options.rawQuery,
            rawQueryOrder: query.sort || req.list.rawQueryOrder,
            replacements: req.list.replacements || options.replacements,
            countOptions: req.list.countOptions || options.countOptions,
            countRawQuery: req.list.countRawQuery,
            transaction: options.transaction
        }).then((result) => {
            let transaction = req.transaction || options.transaction;
            if (transaction) {
                return transaction.commit().then(() => {
                    return res.send({
                        count: result.count,
                        rows: _.map(result.rows, (r) => r.toJSON())
                    });
                }).catch(next);
            }

            return res.send({
                count: result.count,
                rows: _.map(result.rows, (r) => r.toJSON())
            });
        }).catch(next);
    };
};
