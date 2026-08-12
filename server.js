require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 10000;

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE;
const PASSKEY = process.env.PASSKEY;

const DEFAULT_PHONE = process.env.PHONE_NUMBER;
const DEFAULT_AMOUNT = process.env.AMOUNT;

const CALLBACK_URL =
    process.env.CALLBACK_URL ||
    'https://mpesa-mk8c.onrender.com/callback';

const MPESA_BASE_URL =
    process.env.MPESA_BASE_URL ||
    'https://sandbox.safaricom.co.ke';


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'mpesa-api'
    });
});


// --------------------------------------------------
// Timestamp
// Equivalent to:
// new SimpleDateFormat("yyyyMMddHHmmss")
// --------------------------------------------------

function getTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}


// --------------------------------------------------
// Phone-number sanitization
// Based on the Android SDK logic
// --------------------------------------------------

function sanitizePhoneNumber(phone) {

    if (!phone) {
        return '';
    }

    phone = String(phone).trim();

    // 07XXXXXXXX -> 2547XXXXXXXX
    if (phone.length < 11 && phone.startsWith('0')) {
        return phone.replace(/^0/, '254');
    }

    // +2547XXXXXXXX -> 2547XXXXXXXX
    if (phone.length === 13 && phone.startsWith('+')) {
        return phone.replace(/^\+/, '');
    }

    return phone;
}


// --------------------------------------------------
// Generate Daraja STK password
//
// Android SDK:
//
// String str = businessShortCode + passkey + timestamp;
// Base64.encodeToString(...)
//
// --------------------------------------------------

function getPassword(shortcode, passkey, timestamp) {

    const str =
        String(shortcode) +
        String(passkey) +
        String(timestamp);

    return Buffer
        .from(str, 'utf8')
        .toString('base64');
}


// --------------------------------------------------
// Get OAuth access token
// --------------------------------------------------

async function getAccessToken() {

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        throw new Error(
            'CONSUMER_KEY or CONSUMER_SECRET is missing'
        );
    }

    const url =
        `${MPESA_BASE_URL}/oauth/v1/generate` +
        '?grant_type=client_credentials';

    const response = await axios.get(url, {
        auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET
        },
        timeout: 30000
    });

    return response.data.access_token;
}


// --------------------------------------------------
// STK Push
// --------------------------------------------------

app.post('/api/donate', async (req, res) => {

    console.log('POST /api/donate');

    try {

        const requestAmount = req.body.amount;
        const requestPhone = req.body.phoneNumber;

        const payAmount =
            requestAmount || DEFAULT_AMOUNT;

        const payPhone =
            sanitizePhoneNumber(
                requestPhone || DEFAULT_PHONE
            );


        // ------------------------------------------
        // Validate configuration
        // ------------------------------------------

        if (!SHORTCODE) {
            return res.status(500).json({
                success: false,
                message: 'SHORTCODE is not configured'
            });
        }

        if (!PASSKEY) {
            return res.status(500).json({
                success: false,
                message: 'PASSKEY is not configured'
            });
        }

        if (!payAmount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        if (!payPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }


        // ------------------------------------------
        // Timestamp
        // ------------------------------------------

        const timestamp = getTimestamp();


        // ------------------------------------------
        // Password
        //
        // shortcode + passkey + timestamp
        // then Base64
        // ------------------------------------------

        const password = getPassword(
            SHORTCODE,
            PASSKEY,
            timestamp
        );


        // ------------------------------------------
        // OAuth
        // ------------------------------------------

        const accessToken =
            await getAccessToken();


        // ------------------------------------------
        // STK Push request
        // ------------------------------------------

        const stkRequest = {

            BusinessShortCode: SHORTCODE,

            Password: password,

            Timestamp: timestamp,

            TransactionType:
                'CustomerPayBillOnline',

            Amount: Number(payAmount),

            PartyA: payPhone,

            PartyB: SHORTCODE,

            PhoneNumber: payPhone,

            CallBackURL: CALLBACK_URL,

            AccountReference: 'Donation',

            TransactionDesc:
                'Donation to charity'
        };


        console.log('Sending STK Push:', {
            BusinessShortCode: SHORTCODE,
            Timestamp: timestamp,
            TransactionType:
                stkRequest.TransactionType,
            Amount: stkRequest.Amount,
            PartyA: payPhone,
            PartyB: SHORTCODE,
            PhoneNumber: payPhone,
            CallBackURL: CALLBACK_URL
        });


        // ------------------------------------------
        // Send request to Daraja
        // ------------------------------------------

        const response = await axios.post(

            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,

            stkRequest,

            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    'Content-Type':
                        'application/json'
                },

                timeout: 30000
            }
        );


        console.log(
            'Safaricom response:',
            response.data
        );


        // ------------------------------------------
        // Return Daraja response
        // ------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                'STK Push request sent successfully',

            response: response.data
        });


    } catch (error) {

        console.error(
            '=== STK PUSH ERROR ==='
        );


        if (error.response) {

            console.error(
                'Status:',
                error.response.status
            );

            console.error(
                'Data:',
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );


            return res.status(
                error.response.status
            ).json({

                success: false,

                message:
                    'Safaricom rejected the STK Push request',

                error:
                    error.response.data
            });

        }


        console.error(
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Error processing STK Push',

            error:
                error.message
        });
    }
});


// --------------------------------------------------
// Safaricom callback
// --------------------------------------------------

app.post('/callback', (req, res) => {

    console.log(
        '=== M-PESA CALLBACK ==='
    );

    console.log(
        JSON.stringify(
            req.body,
            null,
            2
        )
    );


    /*
     * Later you can extract:
     *
     * ResultCode
     * ResultDesc
     * MerchantRequestID
     * CheckoutRequestID
     * CallbackMetadata
     *
     * and save the transaction in MongoDB.
     */


    return res.status(200).json({

        ResultCode: 0,

        ResultDesc:
            'Accepted'
    });
});


// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            'Route not found'
    });
});


// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {

    console.log(
        `Server listening on port ${PORT}`
    );

    console.log(
        `M-Pesa environment: ${MPESA_BASE_URL}`
    );
});
