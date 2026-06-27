// ../sockets/socketHandler.js
const jwt = require('jsonwebtoken');
const { Document } = require('../models/documents');

module.exports = (io) => {
    const debounceTimers = {};
    const rooms = new Map();
    // 1. Socket.io Middleware: Authenticate connection before handshake completes
    io.use((socket, next) => {
        try {
            // Expecting token passed via frontend auth options: { auth: { token: "YOUR_JWT_TOKEN" } }
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication error: No token provided."));
            }

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach the validated user's ID directly to the socket object
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            return next(new Error("Authentication error: Invalid or expired token."));
        }
    });

    // 2. Establish connection lifecycle listeners
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id} (Database User ID: ${socket.userId})`);

        // Event: Request to join a specific document room
        socket.on('join-room', async (room_code) => {
            try {
                // Find document in database to check authorization permissions
                const document = await Document.findOne({ room_code });

                if (!document) {
                    socket.emit('error', { message: "Room not found." });
                    return;
                }

                // Authorization Check: Must be the owner or explicitly listed inside authorized_users
                const isOwner = document.owner.toString() === socket.userId;
                const isAuthorized = document.authorized_users.includes(socket.userId);

                if (!isOwner && !isAuthorized) {
                    socket.emit('error', { message: "You are not authorized to join this room." });
                    return;
                }

                // Safely isolate client inside the room
                socket.join(room_code);
                if(!rooms.has(room_code)) rooms.set(room_code, new Set());
                rooms.get(room_code).add(socket.userId);
                io.to(room_code).emit('room-users', [...rooms.get(room_code)]);
                console.log(`User ${socket.userId} joined room: ${room_code}`);

                // Send the initial text content down to the newly joined client
                socket.emit('load-document', document.content);

            } catch (error) {
                socket.emit('error', { message: "Server error joining room." });
            }
        });

        // Event: Text modification broadcast loop
        socket.on('edit-text', (data) => {
            // data should look like: { room_code: "XYZ", content: "Updated text string..." }
            const { room_code, content } = data;

            if (!socket.rooms.has(room_code)) {
                socket.emit('error', { message: "You are not in this room." });
                return;
            }

            
            // Broadcast the text modification to everyone in the room except the sender
            socket.to(room_code).emit('receive-changes', content);

            if (debounceTimers[room_code]) clearTimeout(debounceTimers[room_code]);
            debounceTimers[room_code] = setTimeout(async () => {
                await Document.findOneAndUpdate({ room_code }, { content });
                delete debounceTimers[room_code];
            }, 1000);
        });

        // Event: Clean up when client disconnects
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            rooms.forEach((users, room_code) => {
                if(users.has(socket.userId)) {
                    users.delete(socket.userId);
                    io.to(room_code).emit('room-users', [...users]);
                    if(users.size === 0) rooms.delete(room_code);
                }
            });
        });
    });
};