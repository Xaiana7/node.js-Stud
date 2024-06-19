const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    password: 'xaiana123',
    database: 'node_postgres',
    host: "localhost",
    port: 5432
});

module.exports = client;