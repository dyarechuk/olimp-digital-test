const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

const checkoutLimiter = createRateLimiter(
    60 * 1000,
    5,
    'Too many checkout attempts. Please try again in 1 minute.'
);

const apiLimiter = createRateLimiter(
    60 * 1000,
    100,
    'Too many requests. Please try again in 1 minute.'
);

class InMemoryRateLimiter {
    constructor() {
        this.store = new Map();
        this.cleanup();
    }

    cleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.store.entries()) {
                if (now > value.resetTime) {
                    this.store.delete(key);
                }
            }
        }, 60000);
    }

    check(identifier, maxRequests, windowMs) {
        const now = Date.now();
        const record = this.store.get(identifier);

        if (!record) {
            this.store.set(identifier, {
                count: 1,
                resetTime: now + windowMs
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        if (now > record.resetTime) {
            this.store.set(identifier, {
                count: 1,
                resetTime: now + windowMs
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        if (record.count >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            };
        }

        record.count++;
        return { allowed: true, remaining: maxRequests - record.count };
    }
}

const ipRateLimiter = new InMemoryRateLimiter();

const createCustomRateLimiter = (maxRequests, windowMs, message) => {
    return (req, res, next) => {
        const identifier = req.ip || req.connection.remoteAddress;
        const result = ipRateLimiter.check(identifier, maxRequests, windowMs);

        if (!result.allowed) {
            return res.status(429).json({
                error: message,
                retryAfter: result.retryAfter
            });
        }

        next();
    };
};

module.exports = {
    checkoutLimiter,
    apiLimiter,
    createCustomRateLimiter,
    ipRateLimiter
};