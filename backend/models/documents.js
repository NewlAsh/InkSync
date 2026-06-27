// ./models/documents.js
const mongoose = require('mongoose');
const validator = require('validator');

const documentsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    room_code: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
    // The user who created the document
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    // Array of user IDs who are allowed to view/edit
    authorized_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
});

const Document = mongoose.model('document', documentsSchema);
module.exports = {
    Document,
};