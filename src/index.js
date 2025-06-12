const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const app = express();
const PORT = 3005;

// Rate limiter
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
});

// Middleware
app.use(morgan("combined"));
app.use(limiter);

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const response = await axios.get("http://localhost:3000/api/v1/authenticate", {
      headers: {
        "x-access-token": token,
      },
    });

    console.log("Auth response:", response.data);
    if (response.data.success) {
      console.log('going to proxy');
      next(); // proceed to proxy
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.error("Auth check failed:", error.message);
    return res.status(401).json({ message: "Unauthorized - Auth Error" });
  }
};


app.use(
  "/bookingservice",
  authMiddleware,
  createProxyMiddleware({
    target: "http://localhost:3003/",
    changeOrigin: true,
})
);



// Start server
app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
});
