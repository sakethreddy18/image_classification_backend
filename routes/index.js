const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const basename = path.basename(__filename);

fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-9) === '.route.js');
    })
    .forEach(route => {
        router.use('/' + route.split('.')[0] + '/' + route.split('.')[1], require('./' + route));
});

module.exports = router;