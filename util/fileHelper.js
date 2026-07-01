const fs = require('fs')

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        return new Error(err)
    })
}

exports.deleteFile = deleteFile