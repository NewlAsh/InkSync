// ../controllers/docController.js
const { Document } = require('../models/documents');
const { User } = require('../models/user');
const crypto = require('crypto');


async function create_document(req, res) {
    try {
        const { name, title, content } = req.body;
        const room_code = crypto.randomBytes(3).toString('hex').toUpperCase();

        const doc_created = await Document.create({
            name,
            title: title || "Untitled Document",
            room_code,
            content: content || "" ,
            owner: req.user,
            authorized_users: [req.user] 
        });

        return res.status(201).json({ doc_created });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function get_documents_by_code(req, res) {
    try {
        const { room_code } = req.params;
        const document = await Document.findOne({ room_code });
        
        if (!document) {
            return res.status(404).json({ message: `No room found with the code ${room_code}` });
        }
        
        const isOwner = document.owner.toString() === req.user;
        const isAuthorized = document.authorized_users.includes(req.user);

        if (!isOwner && !isAuthorized) {
            return res.status(403).json({ message: "You are not authorized to view this document." });
        }
        
        return res.status(200).json(document);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function update_documents_by_code(req, res) {
    try {
        const { room_code } = req.params;
        const { content, name, title } = req.body;
        
        const document = await Document.findOne({ room_code });

        if (!document) {
            return res.status(404).json({ message: `No room found with the code ${room_code}` });
        }

        const isOwner = document.owner.toString() === req.user;
        const isAuthorized = document.authorized_users.includes(req.user);

        if (!isOwner && !isAuthorized) {
            return res.status(403).json({ message: "You do not have permission to edit this document." });
        }

        document.content = content !== undefined ? content : document.content;
        document.name = name || document.name;
        document.title = title || document.title;
        
        await document.save();

        return res.status(200).json({ document });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function delete_documents_by_code(req, res) {
    try {
        const { room_code } = req.params;
        const document = await Document.findOne({ room_code });

        if (!document) {
            return res.status(404).json({ message: `No room found with the code ${room_code}` });
        }

        if (document.owner.toString() !== req.user) {
            return res.status(403).json({ message: "Only the document owner can delete this room." });
        }

        await Document.findOneAndDelete({ room_code });
        
        return res.status(200).json({ message: "Document deleted successfully", document });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function get_my_owned_documents(req, res) {
    try {
        const documents = await Document.find({ owner: req.user })
            .select('title room_code authorized_users');

        return res.status(200).json({ documents });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function allow_user_to_room(req, res) {
    try {
        const { room_code, user_id_to_add } = req.body;
        
        const document = await Document.findOne({ room_code });
        if (!document) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (document.owner.toString() !== req.user) {
            return res.status(403).json({ message: "Only the owner can add users to this room." });
        }

        // Validate that the user actually exists
        const userExists = await User.findById(user_id_to_add);
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        if (document.authorized_users.includes(user_id_to_add)) {
            return res.status(400).json({ message: "User is already authorized for this room." });
        }

        document.authorized_users.push(user_id_to_add);
        await document.save();

        return res.status(200).json({ message: "User authorized successfully", document });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function remove_user_from_room(req, res) {
    try{
        const {room_code, user_id_to_remove} = req.body;
        const document = await Document.findOne({room_code});
        if (!document) {
            return res.status(404).json({ message: "Room not found" });
        }
        if(document.owner.toString() !== req.user) {
            return res.status(403).json({ message: "Only the owner can remove users from this room." });
        }
        const updatedDocument = await Document.findOneAndUpdate({room_code}, { $pull: { authorized_users: user_id_to_remove } }, {new: true}).select('title authorized_users room_code');
        return res.status(200).json({ 
                message: "User access revoked successfully", 
                document: updatedDocument 
        });
    }catch(error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    create_document,
    get_documents_by_code,
    update_documents_by_code,
    delete_documents_by_code,
    allow_user_to_room,
    get_my_owned_documents,
    remove_user_from_room
};