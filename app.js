const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const pe = require('parse-error');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const listEndpoints = require('express-list-endpoints');
const path = require('path');

const models = require('./models/index');
const router = require('./routes/index');

const CONFIG = require('./config/config');
var winston = require('./config/winston');

const app = express();

app.use(morgan('combined', { stream: winston.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
//Passport
app.use(passport.initialize());

app.listen(CONFIG.port, () => {
    console.log('Example app listening on port '+CONFIG.port+'!');
    winston.info('Example app listening on port '+CONFIG.port+'!');
});

// List all defined models
if (CONFIG.app === 'dev') {
    var localModels = models.models;
    console.log('Local Models:');
    for (var key in localModels) {
        console.log(key);
    }
}

app.use('/static', express.static(path.join(__dirname, 'media')))
app.use('/api', router);

// List all defined routes
if (CONFIG.app === 'dev') {
    console.log('Routes:');
    console.log(listEndpoints(app));
}

// This is here to handle all the uncaught promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Uncaught Error', pe(reason));
    winston.error('Uncaught Error', pe(reason));
    console.log("UNCAUGHT HANDLER REACHED");
});
