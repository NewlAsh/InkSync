// ./middleware/auth.js
const jwt = require('jsonwebtoken');

async function verify_token(req, res, next) {
    try {
        // Expecting header format: "Bearer <token>"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Verify token using the secret from your .env file
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the user ID to the request object so controllers can access it
        req.user = decoded.userId; 
    
        next(); // Pass control to the next controller function
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}

module.exports = { verify_token };