const dotenv = require('dotenv');
dotenv.config(); //Configure dotenv to load in the .env file

module.exports = {
    dev: {
        // username: process.env.DB_USER || "root",
        // password: process.env.DB_PASSWORD || "root",
        database: process.env.DB_NAME || "database_truecyte",
        host: process.env.DB_HOST || "mongodb://localhost",
        port: process.env.DB_PORT || 27017,
        // dialect: process.env.DB_DIALECT || "mysql",
        migrationStorageTableName: process.env.DB_MIGRATION_TABLE || "migrations",
    }
}