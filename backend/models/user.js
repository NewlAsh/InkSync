    // ./models/user.js
    const mongoose = require('mongoose');
    const validator = require('validator');

    const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (val) => validator.isEmail(val),
                message: "Invalid format",
            },
        },
        password: {
            type: String,
            required: true,
        }
    });

    const User = mongoose.model('user', userSchema);
    module.exports = {
        User,
    }