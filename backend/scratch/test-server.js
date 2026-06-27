const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const path = require('path');

const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-index.html'));
}); 

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for keystrokes sent by a client
    socket.on('typing', (data) => {
        console.log(`Broadcast content: ${data}`);
        
        // Pattern: Send to everyone EXCEPT the person who typed it
        socket.broadcast.emit('update-editor', data);
    });

    // Detect when a tab is closed
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Day 1 server running on http://localhost:${PORT}`);
});