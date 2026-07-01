const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator')
const authController = require('../controllers/auth')


router.get('/login', authController.getLogin)

router.post('/login', [
    check('email','ایمیل وارد شده معتبر نیست')
    .isEmail(),
    body('password', 'رمز عبور باید حداقل 6 کاراکتر و شامل حروف انگلیسی باشد')
    .isLength({min:6})
    .isAlphanumeric()
] ,authController.postLogin)

router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignUp)

router.post('/signup',
    [check('email')
        .isEmail()
        .withMessage('ایمیل وارد شده معتبر نیست !')
        .custom((value, { req }) => {
            if (value === 'ahoora@gmail.com') {
                throw new Error("شما حق ورود به وبسایت را ندارید")
            }
            return true
        }),
    body('password', 'رمز عبور باید حداقل 5 کاراکتر و ترکیبی از اعداد و حروف انگلیسی باشد')
        .isLength({ min: 5 })
        .isAlphanumeric(),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("تکرار رمز عبور با رمز وارد شده همخوانی ندارد !");
            }
            return true
        })


    ], authController.postSignUp)

router.get('/resetpass', authController.getResetPass)

router.post('/resetpass', authController.postResetPass)

router.get('/resetpass/:token', authController.getNewPass)

router.post('/resetnewpass', authController.postNewPassword)

module.exports = router;