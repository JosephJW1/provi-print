require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./models");

const app = express();

// Hide Express server signature
app.disable("x-powered-by");

// Limit JSON body size to mitigate large-payload DoS attacks
app.use(express.json({ limit: "10kb" }));

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());

// Routers
const authRouter = require("./routes/Auth");
app.use("/auth", authRouter);

const productsRouter = require("./routes/Products");
app.use("/products", productsRouter);

const variantsRouter = require("./routes/ProductVariants");
app.use("/variants", variantsRouter);

const townRouter = require("./routes/Towns");
app.use("/towns", townRouter);

// Health check to verify active server build
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Structured JSON 404 handler (prevents Express default HTML 404 CSP header)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler (catches malformed JSON body errors and unexpected exceptions)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON payload" });
  }
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1);
  });