
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const passkey = process.env.PASSKEY;
const port = process.env.PORT || 10000;
const shortcode = process.env.SHORTCODE;   // Match your Render variable name
const phoneNumber = process.env.PHONE_NUMBER;
const amount = process.env.AMOUNT;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.post('/callback', (req, res) => {
    console.log('Callback:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.post('/api/donate', async (req, res) => {
    console.log('POST /api/donate called');
    console.log(req.body);
    try {
        const { amount: requestAmount, phoneNumber: requestPhone } = req.body;

        const payAmount = requestAmount || amount;
        const payPhone = requestPhone || phoneNumber;

        const timestamp = new Date().toISOString()
            .replace(/[-:TZ.]/g, '')
            .slice(0, 14);

        // Replace YOUR_MPESA_PASSKEY with your Daraja passkey
        const password = Buffer.from(
            `${shortcode}SHOW8i0jcft1odqVM7H7D1rgnJHaqjBeVW3ZMko4RezPnCawhpxScf6r9K23FEKyqia06fNxAK5Ur7/KJVvMrMny+aw6fkQWut3AWWigpQFODUMnyIpnztnoNRDOjeblRHY0YRKa5jnFTVbgNNeYEX9mXUdJomcs9dfUKwRBKBzsFxQNjq2+LTR91ZJUacvL0VYrzPZeG4k1OrfQNk8y4AeecygUQEBPmaufdp2GJu/9Xj6zj1uY+wSVOSEZjkj/78p8ZyzEKynywma8LgN+frPxdVRp/G6lrKs51BxWarpYKMcNDn/uUgUcX+I9CXPVgOv6i1VCc6PKQv5EHE5qbQ==${timestamp}`
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
