const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

let invoicePath = path.join('files','invoices','invoice.pdf')

let doc = new PDFDocument()

doc.pipe(fs.createWriteStream(invoicePath))

// title
doc.fontSize(20).text('This Is Title')
doc.text('Hello World')
doc.end()

