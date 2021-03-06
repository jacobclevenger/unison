import * as express from 'express';
import * as chalk from 'chalk';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as https from 'https';
import * as socketio from 'socket.io';
import * as fs from 'fs';
import * as cors from 'cors';
import 'reflect-metadata';

import { IServerConfig } from '../server/server-config.interface';
import { IUnisonApp } from '../app/app.interface';
import { Injector } from '../dependency-injection/dependency-injection';
import { ComponentRegister } from '../components/component';
import { SocketRegister } from '../components/socket/socket';
import { SocketIOServer } from '../components/socket';

/**
 * Unison Web Server
 * 
 * @export
 * @class UnisonServer
 */
export class UnisonServer {

    private application: express.Application;
    private metadata: IUnisonApp;
    private injectables: Object;
    private server: http.Server | https.Server;
    private io: SocketIO.Server;

    constructor(
        private serverConfig: IServerConfig
    ) { }

    /**
     * Bootstraps a Unison App.
     * 
     * @param {Function} unisonApp 
     * 
     * @memberOf UnisonServer
     */
    public bootstrap(unisonApp: any): void {

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
            } else {
                this.server = http.createServer(this.application);
            }

            this.io = socketio(this.server);

            // Setup app injectables.
            this.metadata.injectables.push({ inject: SocketIOServer, use: this.io })
            this.injectables = new Injector(this.metadata.injectables || []).getInjectables();

            let componentRegister = new ComponentRegister(
                    this.metadata.components, 
                    this.injectables, 
                    this.application, 
                    this.io);

            // Start the server.
            this.server.listen(this.serverConfig.port, this.serverConfig.host, () => {
                console.log(chalk.bgGreen.black(`Listening on port ${this.serverConfig.port}`));
            });

        } else {
            console.error(chalk.bgRed('Error: Bootstrapped application must be decorated with the @UnisonApp decorator.'))
        }

    }

}
