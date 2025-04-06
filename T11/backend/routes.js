const express = require('express');
const user = require('./controllers/user');
const { authToken } = require("./middleware/auth");

const router = express.Router();
router.post('/login', user.loginController);
router.get('/user/me', authToken, user.profileController);
router.post('/register', user.registerController);

module.exports = router;