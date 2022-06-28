const express = require('express');
const router = express.Router();
// const checkAuth = require('../middleware/check-auth');
// const checkAdmin = require('../middleware/check-admin');
// const checkAdminJson = require('../middleware/check-admin-json');

const TransactionController = require('../controllers/transaction')

// router.get('/signup', (req, res, next) => {
//     res.setHeader('Content-Type', 'text/html');
//     res.render('signup')
// })
// router.post('/signup', UserController.signup);
// router.post('/login', UserController.login);
// router.delete('/:userId', checkAuth, checkAdminJson, UserController.delete);
// router.get('/logout', (req, res, next) => {
//     res.cookie('userToken', '', { maxAge: 1 });
//     res.redirect('/');
// })
// router.get('/profile', checkAuth, UserController.profile);
// router.post('/update-personal-info', checkAuth, UserController.updatePersonalInfo);
// router.post('/add-address', checkAuth, UserController.addAddress);
// router.delete('/remove-address/:id', checkAuth, UserController.removeAddress);
// router.post('/change-password', checkAuth, UserController.changePassword);
//
// router.get('/', checkAuth, checkAdmin, UserController.listAll);
// router.get('/get/:id', checkAuth, checkAdminJson, UserController.get);
// router.post('/save', checkAuth, checkAdminJson, UserController.save);
// router.put('/save', checkAuth, checkAdminJson, UserController.update);
router.post('/add', TransactionController.add);
// router.delete('/delete/:id', checkAuth, checkAdminJson, UserController.delete);

module.exports = router;