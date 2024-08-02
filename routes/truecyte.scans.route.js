const express = require('express');
const router = express.Router();
const passport = require('passport');
require ('../middleware/passport')(passport);

const roleAuthorization = require('../middleware/roleAuthorization');

const scansController = require('../controllers/scans.controller');

router.post('/getScans', passport.authenticate('jwt', {session: false}), scansController.getScans);
router.post('/getScan', passport.authenticate('jwt', {session: false}), scansController.getScan);
router.post('/createScan', passport.authenticate('jwt', {session: false}), scansController.createScan);
router.post('/addImagesToScan', passport.authenticate('jwt', {session: false}), scansController.addImagesToScan);
router.post('/reclassify', passport.authenticate('jwt', {session: false}), roleAuthorization(["Admin", "Pathologist"]), scansController.reclassify);
router.get('/getFilterByData', passport.authenticate('jwt', {session: false}), scansController.getFilterByData);
router.post('/getReclassificaitonData', passport.authenticate('jwt', {session: false}), roleAuthorization(["Admin"]), scansController.getReclassificaitonData);


module.exports = router;