class RayEventEmitter {
    constructor() {
        this._messageHandlersList = {};
        this._eventHandlersList = {};
    }


    addMessageHandler(cmd, handler) {
        if (!this._messageHandlersList[cmd]) {
            this._messageHandlersList[cmd] = [handler];
        } else {
            this._messageHandlersList[cmd].push(handler);
        }
    }

    removeMessageHandler(cmd, handler = null) {
        if (!this._messageHandlersList[cmd])
            return;

        if (handler == null) {
            this._messageHandlersList = {}; //Remove all handlers
            return;
        }

        for (let i = 0; i < this._messageHandlersList[cmd].length; i++) {
            if (this._messageHandlersList[cmd][i] === handler) {
                this._messageHandlersList[cmd].splice(i, 1);
                if (this._messageHandlersList[cmd].length === 0)
                    delete this._messageHandlersList[cmd];
                break;
            }
        }
    }

    addEventHandler(handlerType, handler) {
        if (!this._eventHandlersList[handlerType]) {
            this._eventHandlersList[handlerType] = [handler];
        } else {
            this._eventHandlersList[handlerType].push(handler);
        }
    }

    removeEventHandler(handlerType, handler = null) {
        if (!this._eventHandlersList[handlerType])
            return;

        if (handler == null) {
            this._eventHandlersList = {}; //Remove all handlers
            return;
        }

        for (let i = 0; i < this._eventHandlersList[handlerType].length; i++) {
            if (this._eventHandlersList[handlerType][i] === handler) {
                this._eventHandlersList[handlerType].splice(i, 1);
                if (this._eventHandlersList[handlerType].length === 0)
                    delete this._eventHandlersList[handlerType];
                break;
            }
        }
    }

    fireEvent(handlerType, args = null) {
        const handler = this._eventHandlersList[handlerType];
        if (handler) {
            for (let i = 0; i < handler.length; i++) {
                handler[i](args);
            }
        }
    }

    fireMessage(cmd,args) {
        const handler = this._messageHandlersList[cmd];
        if (handler) {
            for (let i = 0; i < handler.length; i++) {
                handler[i](args);
            }
        }
    }

}

module.exports = RayEventEmitter;
