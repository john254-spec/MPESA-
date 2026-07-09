
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Service is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/donate', (req, res) => {
  const { consumerKey, consumerSecret, shortcode, amount, phoneNumber } = req.body;

  // TODO: Implement your M-Pesa API call here using credentials stored
  // in environment variables rather than accepting secrets from clients.

  res.json({
    message: 'Donation request received',
    shortcode,
    amount,
    phoneNumber
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
