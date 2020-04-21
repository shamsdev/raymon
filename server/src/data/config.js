module.exports = {
    tcp: {
        enabled: true,
        host: '0.0.0.0',
        port: 3000,
        idle_connection_timeout: 300,
        keep_alive_initial_delay: 30,
    },
    udp: {
        enabled: true,
        host: '0.0.0.0',
        port: 3000
    },
    websocket: {
        enabled: true,
        host: '0.0.0.0',
        port: 3001
    }
};
