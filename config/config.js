const dotenv = require('dotenv');
const database = require('./database');

dotenv.config(); //Configure dotenv to load in the .env file

let CONFIG = {} //Make this global to use all over the application

CONFIG.app          = process.env.APP   || 'dev';
CONFIG.port         = process.env.PORT  || '8000';

CONFIG.database = database[CONFIG.app];

CONFIG.jwt_encryption  = process.env.JWT_ENCRYPTION || 'jwt_encryption_key';
CONFIG.jwt_refresh_encryption  = process.env.JWT_REFRESH_ENCRYPTION || 'jwt_refresh_encryption_key';

CONFIG.jwt_access_expiration  = process.env.JWT_EXPIRATION || '1h';
CONFIG.jwt_refresh_expiration  = process.env.JWT_REFRESH_EXPIRATION || '24h';
CONFIG.jwt_prefix = process.env.JWT_PREFIX || 'Bearer';

module.exports = CONFIG;
