const Product = require('../models/product')
const Order = require('../models/order')
const cookieParser = require('../util/cookieParser')
const { generateToken } = require('../middleware/csrf')
const path = require('path')
const fs = require('fs')
const pdfDocument = require('pdfkit')
const { query } = require('express-validator')
const zarinpalCheckout = require('zarinpal-checkout')
let zarinpal = zarinpalCheckout.create('xxxxxx-xxxxxxx-xxxxxxxx-xxxxxx-xxxxx',true)
const ItemsPerPage = 1
let allItems;

exports.getShop = (req, res, next) => {
    let page = +req.query.page || 1;
    
    let massage = req.flash('success')
    if (massage.length > 0) {
        massage = massage[0]
    } else {
        massage = null
    }
    Product.find()
        .countDocuments()
        .then(allProductsNum => {
            allItems = allProductsNum;
            return Product.find()
                .skip((page - 1) * ItemsPerPage)
                .limit(ItemsPerPage)
        })
        .then(product => {
            res.render('shop/index', {
                path: '/',
                pageTitle: 'Shop',
                prods: product,
                isAuthenticated: req.session.isLoggedin,
                successMassage: massage,
                currentPage: page,
                hasNextPage: page * ItemsPerPage < allItems,
                hasprevieusPage: page > 1,
                nextPage: page + 1,
                previeusPage: page - 1,
                lastPage: Math.ceil(allItems / ItemsPerPage)
            });
        }).catch(err => {

            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)

        })
}
exports.getProduct = (req, res) => {
    let prodId = req.params.productId
    Product.findById(prodId).then(product => {
        res.render('shop/product-detail', {
            pageTitle: product.title,
            path: '/product',
            product: product,
            isAuthenticated: req.session.isLoggedin
        })
    })
}
exports.getProducts = (req, res) => {
    let sMassage = req.flash('success')
    if (sMassage.length > 0) {
        sMassage = sMassage[0]
    } else {
        sMassage = null
    }
    Product.find().then(product => {
        res.render('shop/products', {
            path: '/products',
            pageTitle: "Products",
            prods: product,
            isAuthenticated: req.session.isLoggedin,
            successMassage: sMassage
        })
    })
}
exports.getCart = async (req, res) => {
    let massage = req.flash('success')
    if (massage.length > 0) {
        massage = massage[0]
    } else {
        massage = null
    }

    const user = await req.user.populate('cart.items.productId')
    res.render('shop/cart', {
        pageTitle: 'Cart',
        path: '/cart',
        products: user.cart.items,
        isAuthenticated: req.session.isLoggedin,
        successMassage: massage
    })
}
exports.postCart = (req, res) => {
    let prodId = req.body.productId
    Product.findById(prodId).then(product => {
        req.user.addTocart(product);
        req.flash('success', 'محصول به سبد خرید اضافه شد')
        res.redirect('/products');
    })
}
exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId

    req.user.removeFromCart(prodId).then(result => {
        console.log(result);
        req.flash('success', 'محصول از سبد شما حذف شد')
        res.redirect('/cart')
    }).catch(err => {

        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)

    })
}
exports.getCheckout = async (req,res) => {
    const user = await req.user.populate('cart.items.productId')
    const products = user.cart.items;
    let totalPrice = 0;
    products.forEach(p => {
        totalPrice+=p.quantity*p.productId.price
    })
    res.render('shop/checkout', {
        pageTitle: '/checkout',
        path: '/checkout',
        products: user.cart.items,
        isAuthenticated: req.session.isLoggedin,
        totalPrice:totalPrice
    }) 
}
exports.getPaymentRequest = async (req,res) => {
    const user = await req.user.populate('cart.items.productId')
    const products = user.cart.items;
    let totalPrice = 0;
    products.forEach(p => {
        totalPrice+=p.quantity*p.productId.price
    })

    zarinpal.PaymentRequest({
        Amount:totalPrice,
        CallbackURL:'http://127.0.0.1:4000',
        Email:user.email,
        Mobile:'09900000000',
        Description:'در حال تست کردن درگاه پرداخت'
    }).then(response => {
        console.log(response);
        res.redirect(response.url)   
    }).catch(err => {
        console.log(err);   
    })

}

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            const userProducts = user.cart.items.map(i => {
                return {
                    product: { ...i.productId._doc },
                    quantity: i.quantity,

                }
            })
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: userProducts
            })
            return order.save()

        }).then(result => {
            req.user.clearCart();
            req.flash('success', 'سفارش شما ثبت شد')
            res.redirect('/cart')
        }).catch(err => {

            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)

        })
}
exports.getOrder = (req, res, next) => {
    Order.find({
        'user.userId': req.user._id
    }).then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Orders',
            path: '/orders',
            orders: orders,
            isAuthenticated: req.session.isLoggedin
        })
    }).catch(err => {

        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)

    })
}
exports.getInvoices = (req, res, next) => {
    let orderId = req.params.orderId;

    let invoiceName = 'invoices-' + orderId + '.pdf'

    let invoicePath = path.join('files', 'invoices', invoiceName)

    let pdfDoc = new pdfDocument()

    Order.findById(orderId).then(order => {

        if (!order) {
            return next(new Error('order not found!'))
        }

        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('user is unathurized!'))
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');

        pdfDoc.pipe(fs.createWriteStream(invoicePath))
        pdfDoc.pipe(res)
        pdfDoc.fontSize(20).text('Invoice', {
            underline: true
        })
        pdfDoc.text('------------------------------')

        let totalPrice = 0;

        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price
            pdfDoc.text(prod.quantity + ' x ' + prod.product.price + ' = ' + totalPrice)
        })

        pdfDoc.text(`${totalPrice} = total price`)

        pdfDoc.end()


    }).catch((err) => { next(err) })

    // fs.readFile(invoicePath, (err, data) => {
    //     if (err) {
    //         return next(err)
    //     }
    //     res.setHeader('Content-Type', 'application/pdf');
    //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');

    //     res.send(data)
    // })

}