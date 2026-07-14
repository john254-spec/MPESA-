
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const port = process.env.PORT || 10000;
const shortcode = process.env.SHORTCODE;   // Match your Render variable name
const phoneNumber = process.env.PHONE_NUMBER;
const amount = process.env.AMOUNT;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/api/donate', async (req, res) => {
    try {
        const { amount: requestAmount, phoneNumber: requestPhone } = req.body;

        const payAmount = requestAmount || amount;
        const payPhone = requestPhone || phoneNumber;

        const timestamp = new Date().toISOString()
            .replace(/[-:TZ.]/g, '')
            .slice(0, 14);

        // Replace YOUR_MPESA_PASSKEY with your Daraja passkey
        const password = Buffer.from(
            `${shortcode}YOUR_MPESA_PASSKEY${timestamp}`
        ).toString('base64');

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerBuyGoodsOnline",
                Amount: payAmount,
                PartyA: payPhone,
                PartyB: shortcode,
                PhoneNumber: payPhone,
                CallBackURL: "https://mpesa-mk8c.onrender.com/callback",
                AccountReference: "Donation",
                TransactionDesc: "Donation to charity"
            },
            {
                headers: {
                    Authorization: `Bearer ${await getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            message: 'Donation request processed',
            response: response.data
        });

    } catch (error) {
        console.error(
            error.response ? error.response.data : error.message
        );

        res.status(500).json({
            message: 'Error processing donation',
            error: error.response ? error.response.data : error.message
        });
    }
});

async function getAccessToken() {
    const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
            auth: {
                username: consumerKey,
                password: consumerSecret
            }
        }
    );

    return response.data.access_token;
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
