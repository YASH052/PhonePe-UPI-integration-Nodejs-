const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('./model/Order'); // Import the Order model
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const mongoURI = 'mongodb://localhost:27017/ltzcre';

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

let salt_key = '96434309-7796-489d-8924-ab56988a6076';
let merchant_id = 'PGTESTPAYUAT86';

app.get('/', (req, res) => {
    res.send("Don't worry Server is Running");
});

app.post('/order', async (req, res) => {
    try {
        let merchantTransactionId = req.body.transactionId;

        // Save the order to the database
        const newOrder = new Order({
            merchantTransactionId: merchantTransactionId,
            name: req.body.name,
            amount: req.body.amount,
            phone: req.body.number  
        });

        await newOrder.save();

        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            name: req.body.name,
            amount: req.body.amount * 100,
            redirectUrl: `http://localhost:8000/status?id=${merchantTransactionId}`,
            redirectMode: "POST",
            mobileNumber: req.body.phone,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };

        await axios(options).then(function (response) {
            console.log(response.data);
            return res.json(response.data);
        }).catch(function (error) {
            console.log(error);
        });

    } catch (error) {
        console.log(error);
    }
});


app.post('/status', async (req, res) => {
    const merchantTransactionId = req.query.id;
    const merchantId = merchant_id;

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };

    try {
        const response = await axios.request(options);
        const status = response.data.success ? 'success' : 'fail';

        // Update the order status in the database and get the updated order
        const updatedOrder = await Order.findOneAndUpdate(
            { merchantTransactionId: merchantTransactionId },
            { status: status, updatedAt: new Date() },
            { new: true } // Return the updated document
        );

        if (status === 'success') {
            return res.json({ success: true, order: updatedOrder });
        } else {
            return res.json({ success: false, order: updatedOrder });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
});

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
