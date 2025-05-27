import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users: Map<string, { id: string, location?: { lat: number, lng: number } }> = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    users.set(socket.id, { id: socket.id });

    // Send current users list to new user
    socket.emit('users', Array.from(users.values()));

    // Broadcast new user to others
    socket.broadcast.emit('userJoined', { id: socket.id });

    // Handle location updates
    socket.on('updateLocation', (location: { lat: number, lng: number }) => {
        const user = users.get(socket.id);
        if (user) {
            user.location = location;
            socket.broadcast.emit('locationUpdated', { id: socket.id, location });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        users.delete(socket.id);
        io.emit('userLeft', socket.id);
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});