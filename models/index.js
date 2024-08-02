'use strict';

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const CONFIG = require('../config/config');

var log = require('../config/winston');

const Database = CONFIG.database;

// Load models dynamically
let models = {};
fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file));
        models[model.modelName] = model;
    });

// Function to list collections
let collections = {};
async function listCollections() {
    try {
        // Get all collection names
        const collectionArray = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:');
        collectionArray.forEach(collection => {
            console.log(collection.name);
            collections[collection.name] = collection;
        });
    } catch (err) {
        console.error('Error listing collections:', err);
    }
}

// Function to list all Schemas
function listSchemas() {
    console.log('Schemas:');
    for (var key in mongoose.modelSchemas) {
        console.log(key);
    }
}

// Create a new collection and Schema in MongoDB database if it does not exist already from local models
function createSchema(model) {
    console.log('Creating models');
    for (var key in model) {
        if (collections[key] === undefined) {
            console.log('Creating collection: ' + key);
            mongoose.connection.db.createCollection(key);
            console.log('Creating Schema: ' + key);
            var schema = new mongoose.Schema(model[key].schema);
            console.log("Saving Schema: " + key);
            mongoose.model(key, schema);
        }
    }
}

// Function to perform initial database operations
async function initiateDB() {
    console.log('Initiating database');
    // List all collections
    await listCollections();
    // List all Schemas
    listSchemas();
    // Create Schema and Collection
    // createSchema(models);
}

//Connect to the database and catch any errors that occur from the connection process
mongoose.connect(
    Database.host + ':' + Database.port, {
        dbName: Database.database,
    }
).then(() => {
    console.log('Database connected');
    log.info('Database connected');
    // Perform initial database operations
    initiateDB();
}).catch((err) => {
    console.error('Database connection error', err);
    log.error('Database connection error', err);
});
// Change the default mongoose promise library
mongoose.Promise = global.Promise;

const db = {}
db.models = models;
db.collections = collections;
db.mongoose = mongoose;

module.exports = db;