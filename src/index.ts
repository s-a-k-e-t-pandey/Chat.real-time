import {server as WebsocketServer, connection} from "websocket"
import http from "http"
import { IncomingMessage, SupportedMessage } from "./messages/incomingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/inMemoryStore";
import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessages } from "./messages/outgoingMessages";

const server = http.createServer(function(request: any, response: any){
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
})

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function(){
    console.log((new Date()) + ' server is listening at port 8080');
});

const wsServer = new WebsocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originalIsAllowed(origin: string){
    return true;
}

wsServer.on('request', function(request){
    if(!originalIsAllowed(request.origin)){
        request.reject();
        console.log((new Date())+ 'Connection from Origin '+ request.origin + ' rejected.');
        return;
    }
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + 'Connection accepted.');
    connection.on('message', function(message){
        if(message.type === 'utf8'){
            try{
                messageHandler(connection, JSON.parse(message.utf8Data));
            } catch(e){

            }
        }
    })
})


function messageHandler(ws: connection, message: IncomingMessage){
    if(message.type == SupportedMessage.JoinRoom){
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws)
    }

    if (message.type === SupportedMessage.SendMessage) {
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

        const outgoingPayload: OutgoingMessage= {
            type: OutgoingSupportedMessages.AddChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        }
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

     if(message.type === SupportedMessage.UpvoteMessage){
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        console.log("Inside Upvote");

        if(!chat){
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }
        }
        userManager.broadcast(payload.userId, payload.chatId, outgoingPayload);
     }
}