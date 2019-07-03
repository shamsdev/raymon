"use strict";

module.exports = (server, message, user) => {
    console.log(user.id + " says : " + message);
    user.variable["name"] = message;
};