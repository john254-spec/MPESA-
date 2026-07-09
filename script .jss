document.getElementById('donateButton').addEventListener('click', function() {
    const consumerKey = 'YOUR_CONSUMER_KEY';
    const consumerSecret = 'YOUR_CONSUMER_SECRET';
    const shortcode = 'YOUR_SHORTCODE';
    const amount = 100; // Amount to send
    const phoneNumber = 'YOUR_PHONE_NUMBER'; // Recipient's phone number

    fetch('/api/donate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            consumerKey,
            consumerSecret,
            shortcode,
            amount,
            phoneNumber
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Donation successful: ' + data.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Donation failed. Please try again.');
    });
});
