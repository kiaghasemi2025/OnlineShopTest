const multer = require('multer')
const express = require('express')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const app = express()
const router = express.Router()

let discStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

let fileFilter = (req, file, cb) => {

    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(null, false)
    }

}

app.use(multer({
    storage: discStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 2000000 }
}).single('images'))


// get download

exports.getDownloadPdf = (req, res) => {
    pdfDoc = new PDFDocument()
    let pdfName = 'simple.pdf'
    let pdfPath = path.join('files', pdfName)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="' + pdfName + '"')
    pdfDoc.pipe(fs.createWriteStream(pdfPath))
    pdfDoc.pipe(res)
    pdfDoc.text('Title')
    pdfDoc.text('End')
    pdfDoc.end()
}

// router 

router.get('/invoice',isAuth,adminController.getDownloadPdf)

// is Auth

// (req,res,next) => {
//     if(!req.session.isLoggedin){
//         res.redirect('/login')
//     }
//     next()
// }