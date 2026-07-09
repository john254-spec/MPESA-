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
app.post('/api/donate', (req, res) => {
  const { consumerKey, consumerSecret, shortcode, amount, phoneNumber } = req.body;

  POST /mpesa/stkpush/v1/processrequest HTTP/1.1
Host: sandbox.safaricom.co.ke
Authorization: Bearer {access_token}
Content-Type: application/json

({
  "BusinessShortCode": "{shortcode}",
  "Password": "{password}",
  "Timestamp": "{timestamp}",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": {amount},
  "PartyA": "{phone_number}",
  "PartyB": "{shortcode}",
  "PhoneNumber": "{phone_number}",
  "CallBackURL": "{callback_url}",
  "AccountReference": "{account_reference}",
  "TransactionDesc": "{transaction_description}"
});
  

  res.json({
    message: 'Donation request received',
    shortcode,
    amount,
    phoneNumber
  });                 
});
const fs = require('fs');

console.log('__dirname =', __dirname);
console.log('Files in __dirname:', fs.readdirSync(__dirname));
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
