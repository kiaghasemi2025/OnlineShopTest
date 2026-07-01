const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const userSchema = new Schema({

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        minlength:8,
        maxlength:30
    },
    password:{
        type:String,
        required:true,
    },
    resetToken:String,
    expiredDateResetPassToken:Date,
    cart:{
        items:[{
            productId:{
                type:Schema.Types.ObjectId,
                ref:'Product' ,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
            }
        }]
    }

})

userSchema.methods.addTocart = function (product)  {
    const productIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
    })

    let newQuantity = 1;
    let updatedCartItems = [...this.cart.items];

    if ( productIndex >= 0) {
        newQuantity = this.cart.items[productIndex].quantity + 1;
        updatedCartItems[productIndex].quantity = newQuantity
    } else  {
        updatedCartItems.push({
            productId:product._id,
            quantity:newQuantity
        })
    }

    const updatedCart = {
        items:updatedCartItems
    };
    this.cart = updatedCart;
    return this.save()

}

userSchema.methods.removeFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
    })

    this.cart.items = updatedCartItems;
    return this.save()
}

userSchema.methods.clearCart = function () {
    this.cart = {
        items:[]
    }
    return this.save()
}

module.exports = mongoose.model('User' , userSchema)