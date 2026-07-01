const express = require('express')

const router = express.Router()

const isAuth = require('../middleware/isauth')

let shopController = require('../controllers/shop')

router.get('/' ,shopController.getShop)
router.get('/product/:productId' , shopController.getProduct)
router.get('/products' , shopController.getProducts)
router.post('/cart' ,isAuth , shopController.postCart)
router.get('/cart' ,isAuth , shopController.getCart)
router.post('/cart-delete-item' ,isAuth , shopController.postCartDeleteProduct)
router.post('/create-order' ,isAuth , shopController.postOrder)
router.get('/orders' ,isAuth , shopController.getOrder)
router.get('/invoices/:orderId',isAuth,shopController.getInvoices)


module.exports = router