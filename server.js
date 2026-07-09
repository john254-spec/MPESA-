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
Authorization: Bearer {'alRRZ0J3VmxxRVl6M3FOY0ExQW9lZXZBWHQ2U01MQjd4OUF3dndWMHFRR3lndlplMzplQ2tuUTJybHdiUVZ5ajZnZXM2YzZPNGZ1TjMyb1QydkdJNmtRNHh0WkprU0hE'}
Content-Type: application/json


  ({"BusinessShortCode": "{9035436}",
  "Password": "{'OTAzNTQzNmJmYjI3OWY5YWE5YmRiY2YxNThlOTdkZDcxYTQ2N2NkMmUwYzg5MzA1OWIxMGY3OGU2YjcyYWRhMWVkMmM5MTkyMDI2MDcwOTIyMzU1NA==',}",
  "Timestamp": "{'20260709223554'}",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": {80000},
  "PartyA": "{254743644461}",
  "PartyB": "{9035436}",
  "PhoneNumber":"{254743544461",
  "CallBackURL": "{https://mpesa-mk8c.onrender.com/callback";}",
  "AccountReference": "{order123}",
  "TransactionDesc": "{payment for goods}"
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
