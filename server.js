require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const { checkoutLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY is not set in environment variables');
    process.exit(1);
}

if (!process.env.STRIPE_PRICE_ID) {
    console.error('Error: STRIPE_PRICE_ID is not set in environment variables');
    process.exit(1);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.use('/api/', apiLimiter);

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn('Warning: STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const quizSessionId = session.metadata?.quizSessionId;

            if (quizSessionId) {
                const answers = quizAnswers.get(quizSessionId);
                console.log('Payment completed for quiz session:', quizSessionId);
                console.log('User answers:', answers);
            }
            break;

        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object.id);
            break;

        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object.id);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

const quizAnswers = new Map();

app.post('/create-checkout-session', checkoutLimiter, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ error: 'No quiz answers provided' });
        }

        const sessionId = uuidv4();
        quizAnswers.set(sessionId, answers);

        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/cancel`,
            metadata: {
                quizSessionId: sessionId,
            },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

app.get('/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <div class="quiz-screen active" style="text-align: center;">
                    <h1>🎉 Payment Successful!</h1>
                    <p>Thank you for your purchase. Your personalized plan is being prepared.</p>
                    <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px;">Return Home</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/cancel', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Cancelled</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <div class="quiz-screen active" style="text-align: center;">
                    <h1>Payment Cancelled</h1>
                    <p>Your payment was cancelled. No charges were made.</p>
                    <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px;">Try Again</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});