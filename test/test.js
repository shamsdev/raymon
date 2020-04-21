const {RaymonServer} = require('../lib/');

const server = new RaymonServer();
server.start();
console.log(RaymonServer.SocketType.TCP);
server.addRequestHandler("hello", (socketType, user, packet) => {
    console.log(`user ${user.id} sent me ${packet.payload}`);
    server.send(RaymonServer.SocketType.TCP, user, "hello_back", {hello: "back"})
});
