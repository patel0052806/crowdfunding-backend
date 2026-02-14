require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const router = require("./routes/auth-route");
const connectDb = require("./utils/db");
const errorMiddleware = require("./middlewares/error-middleware");
const contactRoute = require("./routes/contact-route");
const campaignRoute = require("./routes/campaign-router");
const adminRoute = require("./routes/admin-router");
const donationRoute = require("./routes/donation-router");
const paymentRoute = require("./routes/payment-router");

// CORS Configuration for Razorpay
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
    "https://crowdfunding-frontend-sand-two.vercel.app"
  ],
  credentials: true,
  allowedHeaders: [
    "content-type",
    "authorization",
    "x-requested-with",
    "x-rtb-fingerprint-id",
    "x-razorpay-request-id"
  ],
  exposedHeaders: [
    "x-rtb-fingerprint-id",
    "x-razorpay-request-id"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  maxAge: 86400
};

app.use(cors(corsOptions));

// expose custom headers to browser so frontends can read razorpay/rtb headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'x-rtb-fingerprint-id, x-razorpay-request-id');
  next();
});

app.use(express.json());

// ROUTES
app.use("/api/auth", router);
app.use("/api/form", contactRoute);
app.use("/api/data", campaignRoute);

// admin routes
app.use("/api/admin", adminRoute);
app.use("/api/donation", donationRoute);
app.use("/api/payment", paymentRoute);

// Temporary debug route for testing email delivery (enable in production by setting ENABLE_EMAIL_DEBUG=true)
if (process.env.ENABLE_EMAIL_DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
  app.post('/api/debug/send-test-email', async (req, res) => {
    const { email } = req.body || {};
    const to = email || process.env.SMTP_USER || process.env.SENDGRID_FROM || 'test@example.com';
    console.log('DEBUG: /api/debug/send-test-email called for:', to);
    try {
      const result = await require('./utils/sendEmail')({ email: to, subject: 'Debug test email', html: '<p>Debug email</p>' });
      return res.status(200).json({ ok: true, result });
    } catch (err) {
      console.error('DEBUG: send-test-email failed:', err);
      return res.status(500).json({ ok: false, message: err.message, stack: err.stack });
    }
  });
}

// ERROR MIDDLEWARE
app.use(errorMiddleware);

// Startup diagnostics (DO NOT log secrets)
console.log('Startup diagnostics — email config:', {
  NODE_ENV: process.env.NODE_ENV,
  hasSMTP: !!process.env.SMTP_HOST,
  hasSendGrid: !!process.env.SENDGRID_API_KEY,
  smtpHost: process.env.SMTP_HOST ? process.env.SMTP_HOST : undefined,
  smtpPort: process.env.SMTP_PORT ? process.env.SMTP_PORT : undefined,
  smtpFrom: process.env.SMTP_FROM_EMAIL ? process.env.SMTP_FROM_EMAIL : undefined,
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDb().then(() => {
    app.listen(PORT, () => {
      console.log(`server is running at port: ${PORT}`);
    });
  });
} else {
  module.exports = app;
}
