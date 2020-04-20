const {RaymonServer} = require('../src/index');

const server = new RaymonServer();
server.start();

server.addRequestHandler("hello", (socketType, user, packet) => {
    console.log(`user ${user.id} sent me ${packet.payload}`);
    server.send(RaymonServer.SocketType.UDP, user, "hello_back", {hello: "back"})
});
