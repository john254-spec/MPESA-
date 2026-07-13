require('dotenv').config();
const express = require('express');
const app = express();
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const port = process.env.PORT || 10000;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/api/donate', async (req, res) => {
    const { consumerkey= "jTQgBwVlqEYz3qNcA1AoeevAXt6SMLB7x9AwvwV0qQGygvZe3",
consumersecret= "eCknQ2rlwbQVyj6ges6c6O4fuN32oT2vGI6kQ4xtZJkSHD",
     "shortcode": "9035436", // Your M-Pesa shortcode
    "amount": 80000, // The amount to donate
    "phoneNumber": "254743544461" // The phone number making the donation
        } = req.body;
    const axios = require('axios');

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            "BusinessShortCode": 9035436,
            "Password": Buffer.from(`${shortcode}${consumerSecret}${new Date().toISOString().slice(0, 19).replace('T', '')}`).toString('base64'),
            "Timestamp": new Date().toISOString().slice(0, 19).replace('T', ''),
            "TransactionType": "CustomerBuyGoodsOnline",
            "Amount": 80000,
            "PartyA": 254743544461,
            "PartyB": 9035436,
            "CallBackURL": "https://mpesa-mk8c.onrender.com/callback", // Replace with your callback URL
            "AccountReference": "Donation",
            "TransactionDesc": "Donation to charity"
        }, {
            headers: {
                'Authorization': `Bearer ${await getAccessToken()}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            message: 'Donation request processed',
            response: response.data
        });
    } catch (error) {
        console.error('Error processing donation:', error);
        res.status(500).json({ message: 'Error processing donation' });
    }
});

// Function to get access token
async function getAccessToken() {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        auth: {
            username: consumerKey,
            password: consumerSecret
        }
    });
    return response.data.access_token;
}

const fs = require('fs');

console.log('__dirname =', __dirname);
console.log('Files in __dirname:', fs.readdirSync(__dirname));
app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});
