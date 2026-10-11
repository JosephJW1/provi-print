require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true 
}));
app.use(cookieParser());

const db = require("./models");

// Routers
const townRouter = require("./routes/Towns");
app.use("/towns", townRouter);

const authRouter = require("./routes/Auth");
app.use("/auth", authRouter);

db.sequelize.sync().then(() => {
    app.listen(3001, () => {
        console.log("Server running on port 3001");
    });
});