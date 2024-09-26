const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    merchantTransactionId: { type: String, required: true, unique: true },
    name: { type: String, },
    amount: { type: Number,},
    phone: { type: String, },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
