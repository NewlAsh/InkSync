// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');    

const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PATCH"],
    }
});

const socketHandler = require('../backend/sockets/socketHandler');
socketHandler(io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

const docRouter = require("./routes/docRoutes");
const authRouter = require("./routes/authRoutes");

app.use("/auth", authRouter); 
app.use("/docs", docRouter);

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));