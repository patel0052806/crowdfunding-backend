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

// CORS
app.use(cors());

app.use(express.json());

// ROUTES
app.use("/api/auth", router);
app.use("/api/form", contactRoute);
app.use("/api/data", campaignRoute);

// admin routes
app.use("/api/admin", adminRoute);
app.use("/api/donation", donationRoute);

// ERROR MIDDLEWARE
app.use(errorMiddleware);

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
