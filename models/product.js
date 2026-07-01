const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const productSchema = new Schema ({
    price:{
        type:Number,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:false
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    }

})

module.exports = mongoose.model('Product' , productSchema)

