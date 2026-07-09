const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 10000;

app.use(bodyParser.json());

app.post('/api/donate', (req, res) => {
    const { consumerKey, consumerSecret, shortcode, amount, phoneNumber } = req.body;

    // Mpesa API integration logic here

    res.json({ message: 'Donation processed successfully!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
