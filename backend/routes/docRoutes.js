// ../routes/docRoutes.js
const express = require('express');
const docRouter = express.Router(); 

const {
    create_document,
    get_documents_by_code,
    update_documents_by_code,
    delete_documents_by_code,
    allow_user_to_room,
    remove_user_from_room,
    get_my_owned_documents
} = require('../controllers/docController');

const { verify_token } = require('../middleware/auth');

docRouter.post('/create', verify_token, create_document);
docRouter.get('/my-rooms', verify_token, get_my_owned_documents);

docRouter.get('/room/:room_code', verify_token, get_documents_by_code);
docRouter.put('/room/:room_code', verify_token, update_documents_by_code);
docRouter.delete('/room/:room_code', verify_token, delete_documents_by_code);

docRouter.post('/room/access/grant', verify_token, allow_user_to_room);
docRouter.post('/room/access/revoke', verify_token, remove_user_from_room);

module.exports = docRouter;