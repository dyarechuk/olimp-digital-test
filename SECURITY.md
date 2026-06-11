# Security Features

## Implemented Security Measures

### 1. Rate Limiting

**Checkout Endpoint** (`/create-checkout-session`)
- **Limit:** 5 requests per minute per IP
- **Purpose:** Prevent abuse of checkout session creation
- **Response:** 429 with retry-after header

**API Endpoints** (`/api/*`)
- **Limit:** 100 requests per minute per user
- **Purpose:** Prevent API abuse
- **Response:** 429 with retry-after header

**Implementation:** 
- Uses `express-rate-limit` for Express middleware
- In-memory rate limiter class for custom limits
- Automatic cleanup of expired records

### 2. Request Size Limits

**API Requests**
- **Limit:** 1 MB for JSON payloads
- **Purpose:** Prevent DoS attacks via large requests
- **Configuration:** `express.json({ limit: '1mb' })`

**File Uploads** (if implemented)
- **Recommended:** 10 MB for file uploads
- **Implementation:** Configure body parser or multer

### 3. UUID for Session IDs

**Before:** Sequential numeric IDs (`Date.now().toString()`)
```javascript
const sessionId = Date.now().toString(); // ❌ Predictable
```

**After:** UUID v4
```javascript
const sessionId = uuidv4(); // ✅ Non-guessable
```

**Purpose:** Prevent session ID enumeration attacks

### 4. Stripe Webhook Signature Verification

**Endpoint:** `POST /webhook`

**Security:**
- Verifies `stripe-signature` header
- Uses `stripe.webhooks.constructEvent()` for validation
- Rejects requests with invalid signatures
- Uses raw body parser for signature verification

**Configuration:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Purpose:** Ensure webhooks come from Stripe, not attackers

### 5. HTTPS Recommended

For production deployment:
- Use HTTPS/TLS for all traffic
- Configure reverse proxy (Nginx, Cloudflare)
- Enable HSTS headers

## Rate Limiting Details

### Implementation Architecture

```
┌─────────────────┐
│  Rate Limiter   │
│   Middleware    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ In-Memory│
    │   Store  │
    │   (Map)  │
    └──────────┘
```

### Custom Rate Limiter Usage

```javascript
const { createCustomRateLimiter } = require('./middleware/rateLimiter');

// Login endpoint: 5 attempts per minute
const loginLimiter = createCustomRateLimiter(
    5, 
    60 * 1000, 
    'Too many login attempts'
);

app.post('/login', loginLimiter, (req, res) => {
    // Login logic
});

// Registration: 3 accounts per hour per IP
const registerLimiter = createCustomRateLimiter(
    3, 
    60 * 60 * 1000, 
    'Too many registration attempts'
);

app.post('/register', registerLimiter, (req, res) => {
    // Registration logic
});
```

### Subscription-Based Limits

For AI generation or feature access:

```javascript
const checkSubscriptionLimit = async (req, res, next) => {
    const userId = req.user.id;
    const subscription = await getUserSubscription(userId);
    
    const limits = {
        free: { daily: 5 },
        pro: { daily: 50 }
    };
    
    const userLimit = limits[subscription] || limits.free;
    const usage = await getTodayUsage(userId);
    
    if (usage >= userLimit.daily) {
        return res.status(429).json({
            error: 'Daily limit reached',
            limit: userLimit.daily,
            subscription: subscription
        });
    }
    
    next();
};
```

## Not Implemented (Recommendations)

### 1. CAPTCHA / Proof-of-Work

**For public forms** (registration, contact, quiz start):

**Option A: Google reCAPTCHA v3**
```html
<script src="https://www.google.com/recaptcha/api.js"></script>
<div class="g-recaptcha" data-sitekey="your_site_key"></div>
```

**Option B: hCaptcha**
```html
<script src="https://js.hcaptcha.com/1/api.js"></script>
<div class="h-captcha" data-sitekey="your_site_key"></div>
```

**Option C: Cloudflare Turnstile** (privacy-friendly)
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
<div class="cf-turnstile" data-sitekey="your_site_key"></div>
```

**Server-side verification required for all options**

### 2. Upstash Redis for Serverless

**For production/serverless deployments:**

```bash
npm install @upstash/redis @upstash/ratelimit
```

```javascript
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
});

app.post('/checkout', async (req, res) => {
  const identifier = req.ip;
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Proceed
});
```

**Benefits:**
- Distributed rate limiting across serverless functions
- Persistent across deploys
- Analytics dashboard

### 3. Additional Headers

**Security headers for production:**

```javascript
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
```

Or use `helmet` package:
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## Testing Rate Limits

### Test Checkout Rate Limit (5/min)

```bash
# Should succeed 5 times
for i in {1..5}; do
  curl -X POST http://localhost:3000/create-checkout-session \
    -H "Content-Type: application/json" \
    -d '{"answers":{"question1":"test"}}'
  echo ""
done

# 6th request should return 429
curl -X POST http://localhost:3000/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"answers":{"question1":"test"}}'
```

### Test Webhook Signature

```bash
# Invalid signature - should fail
curl -X POST http://localhost:3000/webhook \
  -H "stripe-signature: invalid" \
  -d '{"type":"checkout.session.completed"}'

# Expected: 400 Webhook Error
```

### Test Request Size Limit

```bash
# Create 2MB payload - should fail
dd if=/dev/zero bs=2048k count=1 | curl -X POST http://localhost:3000/create-checkout-session \
  -H "Content-Type: application/json" \
  --data-binary @-

# Expected: 413 Payload Too Large
```

## Production Deployment Checklist

- [ ] Switch to Upstash Redis for distributed rate limiting
- [ ] Add CAPTCHA to quiz start page
- [ ] Enable Stripe webhook endpoint signature verification
- [ ] Configure STRIPE_WEBHOOK_SECRET in production
- [ ] Add helmet for security headers
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up monitoring/alerting for rate limit hits
- [ ] Add logging for security events
- [ ] Implement user authentication for /api/* endpoints
- [ ] Add subscription-based limits for premium features

## Environment Variables

Update `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=3000
BASE_URL=http://localhost:3000

# Optional: Upstash Redis (for production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: CAPTCHA
RECAPTCHA_SECRET_KEY=...
```

## Summary

**Implemented:**
✅ Rate limiting on checkout (5/min per IP)
✅ API rate limiting (100/min)
✅ Request size limits (1MB)
✅ UUID session IDs (non-sequential)
✅ Stripe webhook signature verification
✅ Raw body parser for webhooks

**Recommended for Production:**
⚠️ CAPTCHA on public forms
⚠️ Upstash Redis for serverless
⚠️ Helmet for security headers
⚠️ Subscription-based limits
⚠️ User authentication
⚠️ HTTPS enforcement