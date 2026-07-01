const product = require('../models/product')
const Product = require('../models/product')
const { validationResult } = require('express-validator')
const fileHelper = require('../util/fileHelper')

exports.getAddProduct = (req, res) => {
    res.render('admin/add-product', {
        path: '/admin/add-product',
        pageTitle: 'Add-Product',
        editing: false,
        isAuthenticated: req.session.isLoggedin,
        errorMessage: '',
        hasError: false,
        validatinError: []
    })
}
exports.postAddProduct = (req, res, next) => {

    let title = req.body.title
    let price = req.body.price
    let image = req.file
    let description = req.body.description


    const errors = validationResult(req)

    if (!image) {
        return res.render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add-Product',
            editing: false,
            isAuthenticated: req.session.isLoggedin,
            errorMessage: 'لطفا فقط عکس وارد کنید',
            product: {
                title: title,
                price: price,
                imageUrl: image,
                description: description,
            },
            hasError: true,
            validatinError: []

        })
    }

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add-Product',
            editing: false,
            isAuthenticated: req.session.isLoggedin,
            errorMessage: errors.array()[0].msg,
            product: {
                title: title,
                price: price,
                imageUrl: image,
                description: description,
            },
            hasError: true,
            validatinError: errors.array()

        })

    }


    const product = new Product({
        title: title,
        price: price,
        imageUrl: image.path,
        description: description,
        userId: req.session.user
    });
    product.save().then(
        result => {
            console.log(`product ${title} created`);
            req.flash('success', 'محصول اضافه شد')
            res.redirect('/')
        }
    ).catch(err => {


        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)

    })
}
exports.getProducts = (req, res) => {
    let sMassage = req.flash('success')
    if (sMassage.length > 0) {
        sMassage = sMassage[0]
    } else {
        sMassage = null
    }
    Product.find({ userId: req.user._id }).then(product => {
        res.render('admin/admin-products', {
            pageTitle: 'Admin-Products',
            path: '/admin/products',
            prods: product,
            isAuthenticated: req.session.isLoggedin,
            successMassage: sMassage
        })
    })
}
exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit
    if (!editMode) {
        res.redirect('/')
    }

    let prodId = req.params.productId

    Product.findById(prodId).then(product => {

        if (!product) {
            res.redirect('/')
        }
        res.render('admin/add-product', {
            pageTitle: 'Editing Product',
            path: '/admin/edit-product',
            product: product,
            editing: editMode,
            isAuthenticated: req.session.isLoggedin,
            errorsMessage: '',
            hasError: false,
            validatinError: []
        })

    }
    ).catch(err => {

        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)

    })

}
exports.postEditProduct = (req, res, next) => {
    let prodID = req.body.productId
    let updatedTitle = req.body.title
    let updatedPrice = req.body.price
    let image = req.file
    let updatedDescription = req.body.description

    if (!image) {
        return res.render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add-Product',
            editing: true,
            isAuthenticated: req.session.isLoggedin,
            errorMessage: 'لطفا فقط عکس وارد کنید',
            product: {
                title: updatedTitle,
                price: updatedPrice,
                imageUrl: image,
                description: updatedDescription,
                _id: prodID
            },
            hasError: true,
            validatinError: []
        })
    }
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add-Product',
            editing: true,
            isAuthenticated: req.session.isLoggedin,
            errorMessage: errors.array()[0].msg,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodID
            },
            hasError: true,
            validatinError: errors.array()
        })

    }
    Product.findById(prodID).then(
        product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/')
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                fileHelper.deleteFile(product.imageUrl)
                product.imageUrl = image.path;
            }
            product.description = updatedDescription
            return product.save().then(
                result => {
                    console.log(`Updated ${updatedTitle} Product`);
                    req.flash('success', 'محصول مورد نظر ویرایش شد')
                    res.redirect('/')
                }
            ).catch(err => {

                const error = new Error(err)
                error.httpStatusCode = 500;
                return next(error)

            })
        }
    )
}
exports.postDeleteProduct = (req, res, next) => {
    let prodID = req.body.productId
    Product.findById(prodID).then(product => {
        fileHelper.deleteFile(product.imageUrl)
        return Product.deleteOne({ _id: prodID, userId: req.user._id })
    }).then(product => {
        req.flash('success', 'محصول مورد نظر حذف شد')
        res.redirect('/admin/products')
    }).catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
    })
}



