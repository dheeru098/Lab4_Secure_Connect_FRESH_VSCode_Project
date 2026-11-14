const { MongoClient, ObjectId } = require('mongodb');

let client;
let database;

async function connect(uri) {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
  await client.connect();
  database = client.db();
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('notes').createIndex({ owner: 1, createdAt: -1 })
  ]);
  return database;
}

function db() {
  if (!database) throw new Error('Database is not connected');
  return database;
}

function validId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

module.exports = { connect, db, ObjectId, validId };
