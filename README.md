# Quiz Funnel with Stripe Checkout

A minimal, production-ready full-stack quiz funnel application with Stripe Checkout integration. Users answer 3 quiz questions and are redirected to Stripe Checkout for payment.

## Features

- ✅ Clean, modern UI with gradient design
- ✅ 3-question quiz flow with progress indicator
- ✅ One question per screen with smooth transitions
- ✅ Answer storage in server memory
- ✅ 2-second loading animation before checkout
- ✅ Stripe Checkout integration
- ✅ Success and cancel pages
- ✅ Mobile responsive design
- ✅ Environment-based configuration
- ✅ Error handling and validation
- ✅ Analytics tracking (Google Analytics ready)
- ✅ Rate limiting and abuse protection
- ✅ Webhook signature verification
- ✅ UUID-based session IDs

## Tech Stack

**Frontend:**
- HTML5
- CSS3 (vanilla, no frameworks)
- Vanilla JavaScript (no dependencies)

**Backend:**
- Node.js
- Express.js
- Stripe API

## Project Structure

```
olimp-test/
├── public/
│   ├── index.html      # Quiz interface
│   ├── style.css       # Styling and animations
│   ├── app.js          # Quiz logic and Stripe redirect
│   └── analytics.js    # Analytics abstraction layer
├── middleware/
│   └── rateLimiter.js  # Rate limiting middleware
├── server.js           # Express server with Stripe integration
├── package.json        # Dependencies
├── vercel.json         # Vercel deployment config
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # Documentation
├── SECURITY.md         # Security features documentation
└── DEPLOYMENT.md       # Complete deployment & testing guide
```

## Quick Start

**Detailed setup guide:** See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions on:
- Getting Stripe keys (SECRET_KEY, PRICE_ID, WEBHOOK_SECRET)
- Local development setup
- Testing webhooks with Stripe CLI
- Deploying to Vercel for demo
- Full testing checklist based on requirements

## Installation

### Prerequisites

- Node.js 14+ installed
- Stripe account (free test account works)
- npm or yarn package manager

### Steps

1. **Clone or download the project**
   ```bash
   cd olimp-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Get Stripe credentials**
   
   a. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   
   b. Copy your **Secret Key** (starts with `sk_test_`)
   
   c. Create a product:
      - Go to [Products](https://dashboard.stripe.com/test/products)
      - Click "Add product"
      - Enter name (e.g., "Personalized Plan")
      - Enter price (e.g., $49.00)
      - Click "Save product"
      - Copy the **Price ID** (starts with `price_`)

5. **Edit `.env` file**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   STRIPE_PRICE_ID=price_your_actual_price_id_here
   PORT=3000
   BASE_URL=http://localhost:3000
   ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

8. **(Optional) Set up Google Analytics**
   
   Edit `public/index.html` line 10 to enable Google Analytics:
   ```javascript
   Analytics.init('google', { measurementId: 'G-XXXXXXXXXX' });
   ```
   
   Replace `G-XXXXXXXXXX` with your Google Analytics 4 Measurement ID from [Google Analytics](https://analytics.google.com/).

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key | `sk_test_...` |
| `STRIPE_PRICE_ID` | Yes | Stripe Price ID for checkout | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (prod) | Stripe webhook signing secret | `whsec_...` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `BASE_URL` | No | Base URL for redirects | `http://localhost:3000` |

## Testing

### Test Card Numbers

Use these test cards in Stripe Checkout:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | Requires authentication |

- Use any future expiration date
- Use any 3-digit CVC
- Use any billing ZIP code

## Test Checklist

### ✅ Quiz Flow
- [ ] Quiz loads on homepage
- [ ] Progress bar starts at 0%
- [ ] Question 1 displays correctly
- [ ] Clicking answer advances to Question 2
- [ ] Progress bar updates to 33%
- [ ] Question 2 displays correctly
- [ ] Clicking answer advances to Question 3
- [ ] Progress bar updates to 66%
- [ ] Question 3 displays correctly
- [ ] Clicking answer shows loading screen
- [ ] Progress bar shows 100%

### ✅ Loading Screen
- [ ] Loading spinner animates
- [ ] "Creating your personalized plan..." text displays
- [ ] Screen shows for ~2 seconds
- [ ] Automatically redirects to Stripe Checkout

### ✅ Stripe Checkout Flow
- [ ] Redirects to Stripe Checkout page
- [ ] Correct product name displays
- [ ] Correct price displays
- [ ] Test card 4242... completes successfully
- [ ] Success page displays after payment
- [ ] Cancel button redirects to cancel page

### ✅ Success Page
- [ ] Shows success message
- [ ] Return Home button works
- [ ] Styling matches quiz design

### ✅ Cancel Page
- [ ] Shows cancellation message
- [ ] Try Again button works
- [ ] Styling matches quiz design

### ✅ Mobile Responsiveness
- [ ] Quiz displays correctly on mobile (320px+)
- [ ] Buttons are tappable
- [ ] Text is readable
- [ ] Progress bar displays correctly
- [ ] Loading screen displays correctly

### ✅ Error Handling
- [ ] Missing environment variables prevent server start
- [ ] Invalid Stripe keys show error
- [ ] Network errors show user-friendly message
- [ ] Empty answers are rejected by server

### ✅ Analytics Tracking
- [ ] Quiz started event fires on first button click
- [ ] Question answered events fire for each question
- [ ] Quiz completed event fires after question 3
- [ ] Checkout clicked event fires before redirect
- [ ] Events appear in browser console (console provider)
- [ ] Events appear in Google Analytics (if configured)

## API Endpoints

### POST `/create-checkout-session`

Creates a Stripe Checkout session with quiz answers.

**Request:**
```json
{
  "answers": {
    "question1": "lose-weight",
    "question2": "3-5-times",
    "question3": "intermediate"
  }
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Response:**
```json
{
  "error": "No quiz answers provided"
}
```

### GET `/success`

Payment success page. Displays confirmation message.

### GET `/cancel`

Payment cancellation page. Allows user to retry.

### POST `/webhook`

Stripe webhook endpoint for payment events.

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Security:**
- Validates webhook signature using `STRIPE_WEBHOOK_SECRET`
- Rejects unsigned or invalid requests

**Handled Events:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed

## Security

See [SECURITY.md](SECURITY.md) for detailed security documentation.

**Implemented protections:**
- ✅ Rate limiting (5 checkout/min per IP)
- ✅ API rate limiting (100 req/min)
- ✅ Request size limits (1MB)
- ✅ UUID session IDs (non-sequential)
- ✅ Webhook signature verification
- ✅ Raw body parser for Stripe webhooks

## Development Time

**Estimated:** 2-3 hours for an experienced developer

**Breakdown:**
- Project setup and structure: 15 min
- Frontend HTML/CSS: 45 min
- Frontend JavaScript logic: 30 min
- Backend Express server: 30 min
- Stripe integration: 30 min
- Analytics abstraction layer: 20 min
- Security and rate limiting: 30 min
- Testing and bug fixes: 30 min

## What Was Built

1. **Quiz Interface**
   - 3 customizable questions
   - Progress indicator
   - Smooth animations
   - Mobile-responsive design

2. **Answer Collection**
   - Client-side answer storage
   - Server-side persistence in memory
   - Validation on both frontend and backend

3. **Loading Experience**
   - 2-second loading screen
   - Animated spinner
   - Seamless transition to Stripe

4. **Stripe Integration**
   - Checkout Sessions API
   - Environment-based configuration
   - Success/cancel redirect handling
   - Metadata for tracking quiz answers

5. **Production Features**
   - Environment variable validation
   - Error handling
   - Mobile responsiveness
   - Security best practices
   - Analytics tracking with provider abstraction

6. **Security & Abuse Protection**
   - Rate limiting on checkout endpoint
   - API rate limiting
   - Request size limits
   - UUID session IDs (non-sequential)
   - Stripe webhook signature verification

## Limitations

### Current Limitations

1. **Answer Persistence**
   - Answers stored in memory (Map)
   - Lost on server restart
   - Not suitable for production scale
   - **Solution:** Add database (MongoDB, PostgreSQL)

2. **No Webhook Handling**
   - No payment verification after checkout
   - Cannot handle async payment events
   - **Solution:** Implement `/webhook` endpoint with `stripe.webhooks.constructEvent()`

3. **No Email Delivery**
   - No confirmation emails
   - No plan delivery system
   - **Solution:** Add email service (SendGrid, Postmark) triggered by webhook

4. **No User Authentication**
   - No user accounts
   - Cannot track returning users
   - **Solution:** Add authentication system (JWT, Passport.js)

5. **Hardcoded Questions**
   - Questions are in HTML
   - Cannot change without redeployment
   - **Solution:** Move questions to database or config file

6. **Single Product**
   - Only supports one price point
   - Cannot offer multiple plans
   - **Solution:** Add pricing logic based on answers

7. **No Admin Panel**
   - Cannot view quiz responses
   - Cannot manage products
   - **Solution:** Build admin dashboard

8. **Analytics Not Persistent**
   - Events tracked but not stored server-side
   - No historical analytics data
   - **Solution:** Add analytics database or use external service

### Production Deployment Checklist

Before deploying to production:

- [ ] Add database for answer persistence
- [ ] Implement Stripe webhooks
- [ ] Add email delivery system
- [ ] Set up proper logging (Winston, Pino)
- [ ] Add monitoring (Sentry, DataDog)
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Set up SSL/HTTPS
- [ ] Configure BASE_URL for production domain
- [ ] Add CSP headers
- [ ] Implement proper session management
- [ ] Add backup system for quiz data
- [ ] Set up CI/CD pipeline
- [ ] Add automated tests

## Deployment

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-quiz-funnel

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_PRICE_ID=price_...
heroku config:set BASE_URL=https://your-quiz-funnel.herokuapp.com

# Deploy
git push heroku main

# Open app
heroku open
```

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Add environment variables in Vercel dashboard
4. Deploy with `vercel --prod`

### Deploy to Railway

1. Connect GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

## Support

For issues or questions:
- Check Stripe [documentation](https://stripe.com/docs)
- Review error logs in console
- Verify environment variables are set correctly

## License

MIT