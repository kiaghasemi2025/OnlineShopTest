const express = require('express')
const isAuth = require('../middleware/isauth')
const { check, body } = require('express-validator')
const router = express.Router()


let adminController = require('../controllers/admin')

router.get('/add-product', isAuth, adminController.getAddProduct)

router.post('/add-product', [
    check('title', 'نام محصول حداقل باید 5 و حداکثر 20 کاراکتر داشته باشد')
        .isLength({ min: 5, max: 20 })
        .trim()
    ,
    body('price', 'لطفا برای افزودن قیمت فقط عدد وارد  کنید')
        .isNumeric()
        .trim()
        .custom((value, { req }) => {
            if (value[0] === '0') {
                throw new Error("قیمت با صفر شروع نمیشود");
            }
            return true
        })
    ,
    body('description', 'توضیح محصول باید حداقل داری 6 کاراکتر باشد')
        .isLength({ min: 6 })
        .trim()
] , isAuth , adminController.postAddProduct)

router.get('/products', isAuth, adminController.getProducts)

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)

router.post('/edit-product',  [
    check('title', 'نام محصول حداقل باید 5 و حداکثر 20 کاراکتر داشته باشد')
        .isLength({ min: 5, max: 20 })
        .trim()
    ,
    body('price', 'لطفا برای افزودن قیمت فقط عدد وارد  کنید')
        .isNumeric()
        .trim()
        .custom((value, { req }) => {
            if (value[0] === '0') {
                throw new Error("قیمت با صفر شروع نمیشود");
            }
            return true
        })
    ,
    body('description', 'توضیح محصول باید حداقل داری 6 کاراکتر باشد')
        .isLength({ min: 6 })
        .trim()
] ,isAuth, adminController.postEditProduct)

router.post('/delete-product', isAuth, adminController.postDeleteProduct)

module.exports = router