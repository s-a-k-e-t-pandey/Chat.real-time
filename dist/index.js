"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = require("websocket");
const http_1 = __importDefault(require("http"));
const incomingMessages_1 = require("./messages/incomingMessages");
const UserManager_1 = require("./UserManager");
const inMemoryStore_1 = require("./store/inMemoryStore");
const outgoingMessages_1 = require("./messages/outgoingMessages");
const server = http_1.default.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
const userManager = new UserManager_1.UserManager();
const store = new inMemoryStore_1.InMemoryStore();
server.listen(8080, function () {
    console.log((new Date()) + ' server is listening at port 8080');
});
const wsServer = new websocket_1.server({
    httpServer: server,
    autoAcceptConnections: true
});
function originalIsAllowed(origin) {
    return true;
}
wsServer.on('request', function (request) {
    if (!originalIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + 'Connection from Origin ' + request.origin + ' rejected.');
        return;
    }
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + 'Connection accepted.');
    connection.on('message', function (message) {
        console.log(message);
        if (message.type === 'utf8') {
            try {
                console.log('Indie with message ' + message.utf8Data);
                messageHandler(connection, JSON.parse(message.utf8Data));
            }
            catch (e) {
            }
        }
    });
});
function messageHandler(ws, message) {
    if (message.type == incomingMessages_1.SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }
    if (message.type === incomingMessages_1.SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.error("User not found in the db");
            return;
        }
        let chat = store.addChat(payload.userId, user.name, payload.roomId, payload.message);
        if (!chat) {
            return;
        }
        const outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.AddChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
    if (message.type === incomingMessages_1.SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        console.log("Inside Upvote");
        if (!chat) {
            return;
        }
        const outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }
        };
        userManager.broadcast(payload.userId, payload.chatId, outgoingPayload);
    }
}