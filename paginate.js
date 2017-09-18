const _ = require('underscore');


module.exports = function(sequelize, model, {
    attributes,
    include,
    query,
    searchables,
    filter,
    sort,
    offset,
    limit,
    group,
    rawQuery,
    rawQueryOrder,
    countRawQuery,
    replacements,
    countOptions,
    transaction
} = {}) {

    if (rawQuery) {
        rawQueryOrder = _.filter(rawQueryOrder || [], (o) => /^([A-Za-z]|[0-9]|\_|\.|\")+$/.test(o[0]));
        if (!_.isEmpty(rawQueryOrder)) {
            rawQuery += ' ORDER BY ';
            _.each(rawQueryOrder, (o, i) => {
                let key = (o[0].startsWith('"'))?o[0]:('"' + o[0] + '"');
                let order = o[1];
                 rawQuery += `${key} ${order}`;
                 if (i < rawQueryOrder.length-1) rawQuery += ', ';
            });
        }

        if (limit) {
            rawQuery += ' LIMIT :limit';
            replacements.limit = limit;
        }
        if (offset) {
            rawQuery += ' OFFSET :offset';
            replacements.offset = offset;
        }

        return new Promise((resolve, reject) => {
            return sequelize.query(countRawQuery, {
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT,
                transaction: transaction
            }).then((count) => {
                return sequelize.query(rawQuery, {
                    replacements: replacements,
                    type: sequelize.QueryTypes.SELECT,
                    transaction: transaction
                }).then((rows) => {
                    return resolve({
                        rows: rows,
                        count: count[0].c
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    if (!_.isEmpty(filter)) {
        filter = _.pick(filter, (value, key) => (key in model.rawAttributes) || _.contains(['$or', '$and'], key));
        filter = _.mapObject(filter, (value, key) => {
            if (key in model.rawAttributes && model.attributes[key].type.constructor.name === 'ARRAY') {
                return { $contains: [value] };
            }
            return value;
        });
    }

    let where = _.extend(filter || {}, {
        $or: (filter || {}).$or || []
    });

    if (query) {
        searchables = searchables || model.searchables();
        _.each(searchables, (searchable) => {
            let or = {};
            or[searchable] = { $ilike: `%${query}%` };
            where.$or.push(or);
        });
        if (model.rawAttributes.tags) {
            where.$or.push({ tags: { $contains: [query] } });
        }
    }

    if (_.isEmpty(where.$or)) delete where.$or;

    let condition = {};
    if (attributes && !_.isEmpty(attributes)) condition.attributes = attributes;
    if (include) condition.include = include;

    if (!_.isEmpty(where)) condition.where = where;
    if (sort) condition.order = sort;
    if (offset) condition.offset = offset;
    if (limit) condition.limit = limit;
    if (group) condition.group = group;

    return model.findAndCountAll(
        condition,
        { transaction: transaction }
    );
};
