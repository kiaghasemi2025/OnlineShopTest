const express = require('express')

const path = require('path')

const bodyParser = require('body-parser')

const multer = require('multer')

const mongoose = require('mongoose')

const session = require('express-session')

const MongoStore = require('connect-mongo').default;

const { csrfSynchronisedProtection } = require('./middleware/csrf')

const flash = require('connect-flash')

const adminRouter = require('./routes/admin')
const shopRouter = require('./routes/shop')
const authRouter = require('./routes/auth')

const MONGODB_URI = 'mongodb://localhost/Shop'

const User = require('./models/user')
const app = express()


app.set('view engine', 'ejs')
app.set('views', 'views')

const discStroage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null,file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if ( file.mimetype === 'image/jpg' ||
         file.mimetype === 'image/jpeg' ||
         file.mimetype === 'image/png' 
         ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(express.static(path.join(__dirname, 'public')))
app.use("/images",express.static(path.join(__dirname, 'images')))

app.use(
    session({
        secret: "mysupersecret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: MONGODB_URI,
        }),
    })
);


app.use(bodyParser.urlencoded({ extended: false }))
app.use(multer({ storage: discStroage , fileFilter:fileFilter }).single('image'))

app.use(csrfSynchronisedProtection)
app.use(flash())

const { generateToken } = require('./middleware/csrf')

app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req)
    next()
})


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id).then(user => {
        req.user = user;
        next();
    }).catch(err => {
        console.log(err);
    })
})


app.use('/admin', adminRouter)
app.use('/', shopRouter)
app.use(authRouter)

app.use((error, req, res, next) => {
    console.log(error);
    return res.status(500).render('500', {
        path: '',
        pageTitle: 'Error 500',
        isAuthenticated: req.session.isLoggedin,
    });
    next()

})


mongoose.connect(MONGODB_URI)
    .then(result => {
        User.findOne().then(user => {
            if (!user) {
                const user = new User({
                    password: 'kiarash',
                    email: 'kiarash@gmail.com',
                    cart: {
                        items: []
                    }
                })
                user.save()
            }
        })

        app.listen(4000, () => {
            console.log('Server Is Runing On Port 4000')
        })
    })
    .catch(err => {
        console.log(err);
    })
