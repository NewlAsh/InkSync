// ./controllers/authController.js
const {User} = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function register_user(req, res) {
    const {name, email, password} = req.body;
    if(!name || !email || !password) {
        return res.status(400).json({message: "ALL FIELDS ARE REQUIRED"});
    }
    const existing_user = await User.findOne({email});
    if(existing_user) {
        return res.status(400).json({message: `user with the email ${email} already exists`});
    }
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);

    const user = await User.create({
        email: email,
        name: name,
        password: hashed_password,
    });

    return res.json({message: "user successfully created. Now you can login using the same credentials"});
}

async function login_user(req, res) {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({message: "Invalid email or password"});
        }
        const match_password = await bcrypt.compare(password, user.password);
        if(!match_password) {
            return res.status(400).json({message: "Invalid email or password"});
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({token});
    } catch(err) {
        return res.status(500).json({message: "Server error"});
    }
}

module.exports = {
    register_user,
    login_user,
};