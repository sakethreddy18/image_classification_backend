const express = require('express');
const router = express.Router();
const passport = require('passport');
require ('../middleware/passport')(passport);

const userController = require('../controllers/user.controller');

router.post('/register', passport.authenticate('jwt', {session:false}), userController.register);
router.post('/login', userController.login);
router.post('/accessToken', userController.getAccessToken);
router.post('/getUser', passport.authenticate('jwt', {session:false}), userController.getUser);
router.post('/getUsers', passport.authenticate('jwt', {session:false}), userController.getUsers);
router.get('/me', passport.authenticate('jwt', {session:false}), userController.getCurrentUser);
router.put('/me', passport.authenticate('jwt', {session:false}), userController.updateCurrentUser);
router.put('/me/password', passport.authenticate('jwt', {session:false}), userController.updateCurrentUserPassword);
router.post('/editUser', passport.authenticate('jwt', {session:false}), userController.editUser);

module.exports = router;