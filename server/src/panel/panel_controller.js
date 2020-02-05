const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const defaultConfig = {
    port: 3000
};

class panel_controller {
    static #config;

    static init(config = defaultConfig) {
        this.#config = config;
    }

    static start() {
        this._setupMiddleware();
        this._setupRoutes();
        this._setupProduction();

        app.listen(this.#config.port, () => {
            console.log(`Panel started on port ${this.#config.port}`);
        });
    }

    static _setupMiddleware() {
        app.use(bodyParser.json());
        app.use(cors());
    }

    static _setupRoutes() {
        app.use('/api/posts', require('./routes/api/posts'));
    }

    static _setupProduction() {
        if (true || process.env.NODE_ENV === 'production') {
            //Static Folder
            app.use(express.static(path.resolve(__dirname, '../../public/')));

            //Handle SPA
            app.use(/.*/, (req, res) => {
                res.sendFile(path.resolve(__dirname, '../../public/index.html'));
            });
        }
    }
}

module.exports = panel_controller;