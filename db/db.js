const { Pool, Client } = require('pg')


const credentials = {
  user: 'user',
  host: 'localhost',
  database: 'db',
  password: 'password',
  port: 5433,
}

const client = new Client(credentials);
const pool = new Pool(credentials);

const connectPostgres = () => {
    client.connect(function(err) {
        if (err) throw err;
        console.log("Client Connected!");
    });
    pool.connect(function(err) {
    if (err) throw err;
    console.log('Pool Connected!');
    })
}

module.exports = {
    connectPostgres,
    client,
    pool
}