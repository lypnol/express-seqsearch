const expect = require('chai').expect;
const Sequelize = require('sequelize');
const list = require('../index');


const sequelize = new Sequelize('postgres://test:test@localhost:5432/test', {
    dialect: 'postgres',
    logging: false
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

const fakeRes = (cb) => ({
    send: (data) => cb(data)
});

describe('list', () => {

    before((done) => {
        User.sync({force: true}).then(() => {
            let data = [];
            let n = 100;
            for (let i = 0; i < n; i++) {
                data.push({
                    first_name: `first ${i}`,
                    last_name: `last ${i}`,
                    createdAt: new Date(n-i)
                });
            }

            User.bulkCreate(data).then(() => {
                done();
            });
        });
    });

    it('list all', (done) => {
        list(sequelize, User, {
            offset: 3,
            limit: 10,
        })({ query: {} }, fakeRes(function(data) {
            let expected = [];
            for (let i = 0; i < 10; i++) {
                expected.push({
                    first_name: `first ${i+3}`,
                    last_name: `last ${i+3}`
                });
            }
            expect(data.count).to.equal(100);
            expect(data.rows).to.deep.equal(expected);

            done();
        }));
    });

    it('list with search query', (done) => {
        let req = {
            query: {
                q: 'St 1'
            }
        };

        list(sequelize, User)(req, fakeRes(function(data) {
            let expected = [{
                "first_name" : `first 1`,
                "last_name"  : `last 1`
            }];

            for (let i = 0; i < 9; i++) {
                expected.push({
                    "first_name" : `first 1${i}`,
                    "last_name"  : `last 1${i}`
                });
            }
            expect(data.count).to.equal(11);
            expect(data.rows).to.deep.equal(expected);

            done();
        }));
    });

    it('list with search query and filter', (done) => {
        let req = {
            query: {
                q: 'St 1',
                f_first_name: 'first 11'
            }
        };

        list(sequelize, User)(req, fakeRes(function(data) {
            let expected = [];

            expected.push({
                "first_name" : `first 11`,
                "last_name"  : `last 11`
            });

            expect(data.count).to.equal(1);
            expect(data.rows).to.deep.equal(expected);

            done();
        }));
    });

    it('list with search query and sort', (done) => {
        let req = {
            query: {
                q: 'St 1',
                s_last_name: 'DESC'
            }
        };

        list(sequelize, User)(req, fakeRes(function(data) {
            let expected = [];

            for (let i = 9; i > -1; i--) {
                expected.push({
                    "first_name" : `first 1${i}`,
                    "last_name"  : `last 1${i}`
                });
            }

            expect(data.count).to.equal(11);
            expect(data.rows).to.deep.equal(expected);

            done();
        }));
    });
});
