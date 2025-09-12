const { MongoClient } = require('mongodb');
require('dotenv').config();

let dbConnection

module.exports = {
    connectToDb: (cb) => {
    MongoClient.connect(process.env.MONGODB_URI)
        .then(client => {
        dbConnection = client.db(); 
        return cb();
        })
        .catch(err => {
        console.error(err);
        return cb(err);
        });
    },
  getDb: () => dbConnection
}