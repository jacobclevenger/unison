"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const chalk = require("chalk");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const socketio = require("socket.io");
const cors = require("cors");
require("reflect-metadata");
const dependency_injection_1 = require("../dependency-injection/dependency-injection");
const component_1 = require("../components/component");
const socket_1 = require("../components/socket");
/**
 * Unison Web Server
 *
 * @export
 * @class UnisonServer
 */
class UnisonServer {
    constructor(serverConfig) {
        this.serverConfig = serverConfig;
    }
    /**
     * Bootstraps a Unison App.
     *
     * @param {Function} unisonApp
     *
     * @memberOf UnisonServer
     */
    bootstrap(unisonApp) {
        if (Reflect.hasMetadata('unison:app', unisonApp)) {
            this.metadata = Reflect.getMetadata('unison:app', unisonApp);
            // Setup the application server.
            this.application = express();
            this.application.use(bodyParser.urlencoded({ extended: false }));
            this.application.use(bodyParser.json());
            this.application.use(cors({ origin: '*' }));
            // Create either http or https server.
            if (this.serverConfig.https !== undefined && this.serverConfig.https.enabled) {
                this.server
                    = https.createServer(this.serverConfig.https.options, this.application);
            }
            else {
                this.server = http.createServer(this.application);
            }
            this.io = socketio(this.server);
            // Setup app injectables.
            this.metadata.injectables.push({ inject: socket_1.SocketIOServer, use: this.io });
            this.injectables = new dependency_injection_1.Injector(this.metadata.injectables || []).getInjectables();
            let componentRegister = new component_1.ComponentRegister(this.metadata.components, this.injectables, this.application, this.io);
            // Start the server.
            this.server.listen(this.serverConfig.port, this.serverConfig.host, () => {
                console.log(chalk.bgGreen.black(`Listening on port ${this.serverConfig.port}`));
            });
        }
        else {
            console.error(chalk.bgRed('Error: Bootstrapped application must be decorated with the @UnisonApp decorator.'));
        }
    }
}
exports.UnisonServer = UnisonServer;
