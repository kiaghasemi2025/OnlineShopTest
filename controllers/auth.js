const { generateToken } = require('../middleware/csrf')
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const sendEmail = require('../util/email')
const crypto = require('crypto')
const { validationResult } = require('express-validator')

exports.getLogin = (req, res) => {
    let sMassage = req.flash('success')[0]
    let eMassage = req.flash('error')[0]
    if (!eMassage) {
        eMassage = null
    }
    if (!sMassage) {
        sMassage = null
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        isAuthenticated: req.session.isLoggedin,
        errorMassage: eMassage,
        successMassage: sMassage,
        oldInput: {
            email: "",
            password: ""
        },
        validatinError:[]

    })
}
exports.postLogin = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            isAuthenticated: req.session.isLoggedin,
            errorMassage: errors.array()[0].msg,
            successMassage: false,
            oldInput: {
                email: email,
                password: password
            },
            validatinError:errors.array()
        })

    }

    User.findOne({ email: email }).then(
        user => {
            if (!user) {
                req.flash('error', 'ایمیل اشتباه است')
                return res.redirect('/login')
            }
            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) {
                    req.session.isLoggedin = true;
                    req.session.user = user;
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/')

                    })

                } else {
                    req.flash('error', 'پسورد اشتباه است')
                    return res.redirect('/login')
                }
            })
        }
    )


}
exports.postLogout = (req, res) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/')
    })
}
exports.getSignUp = (req, res) => {

    let eMassage = req.flash('error')[0]
    if (!eMassage) {
        eMassage = null
    }
    res.render('auth/signUp', {
        path: '/signup',
        pageTitle: 'Sign Up',
        isAuthenticated: false,
        errorMassage: eMassage,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validatinError:[]


    })
}
exports.postSignUp = (req, res , next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signUp', {
            path: '/signup',
            pageTitle: 'Sign Up',
            isAuthenticated: false,
            errorMassage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validatinError:errors.array()
        })

    }


    User.findOne({
        email: email
    }).then(userDoc => {
        if (userDoc) {
            req.flash('error', 'این ایمیل قبلا ثبت شده')
            return res.redirect('/signUp')
        }

        return bcrypt.hash(password, 12).then(hashedPassword => {

            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            })

            return user.save();
        })

    }).then(() => {
        req.flash('success', 'ثبت نام شما با موفقیت ثبت شد')
        res.redirect('/login')
    }).catch(err => {
    
        const error = new Error(err)
        error.httpStatusCode = 500 ;
        return next(error)

    })
}
exports.getResetPass = (req, res) => {
    let eMassage = req.flash('error')
    if (!eMassage) {
        eMassage = null
    }
    res.render('auth/resetPass', {
        pageTitle: 'بازیابی رمز عبور',
        errorMessage: eMassage
    })
}
exports.postResetPass = (req, res) => {
    const email = req.body.email;

    crypto.randomBytes(32, (err, buf) => {
        if (err) {
            console.log(err);
            return res.redirect('/resetpass')
        }
        const resetToken = buf.toString('hex')
        User.findOne({ email: email }).then(

            user => {
                if (!user) {
                    const error = new Error('USER_NOT_FOUND');
                    error.statusCode = 404;
                    throw error;
                }
                user.resetToken = resetToken;
                user.expiredDateResetPassToken = Date.now() + 3600000;

                return user.save()
            }
        ).then(
            result => {
                res.redirect('/')
                sendEmail({
                    email: email,
                    subject: 'Reset Password',
                    html: `<p>Click On This Link For New Password</p><hr>
                    <a href="http://127.0.0.1:4000/resetpass/${resetToken}"/>Link</a>`
                })
            }).catch(err => {
                if (err.statusCode === 404) {
                    req.flash('error', 'ایمیل وارد شده اشتباه است لطفا ایمیل درست را وارد کنید')
                    return res.redirect('/resetpass')
                }
                console.log(err);
                return res.redirect('/resetpass')
            })

    })
}
exports.getNewPass = (req, res , next) => {
    const token = req.params.token
    User.findOne({ resetToken: token }).then(
        user => {
            res.render('auth/new-password', {
                pageTitle: "رمز جدید",
                userId: user._id.toString(),
                passwordToken: token
            })
        }
    ).catch(err => {
    
        const error = new Error(err)
        error.httpStatusCode = 500 ;
        return next(error)

    })
}
exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password
    const token = req.body.passwordToken
    const userId = req.body.userId
    let resetUser;

    User.findOne({ resetToken: token, _id: userId, expiredDateResetPassToken: { $gt: Date.now() } }).then(
        user => {
            resetUser = user
            return bcrypt.hash(newPassword, 12)
        }
    ).then(
        hasshedPassword => {
            resetUser.password = hasshedPassword
            resetUser.resetToken = undefined
            resetUser.expiredDateResetPassToken = undefined
            return resetUser.save()
        }
    ).then(result => {
        console.log(result);
        res.redirect('/login')

    }).catch(err => {
    
        const error = new Error(err)
        error.httpStatusCode = 500 ;
        return next(error)

    })
}