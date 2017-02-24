import { Application, Request, Response } from 'express';
import * as chalk from 'chalk';

import { ClassName } from '../utils/general.util';
import { IViewDecorator } from './view.interface';
import { IRouteDecorator } from "./route.interface";
import { GenerateURI } from "../utils/view.util";
import { MethodMap } from "./method.enum";
import { RequiredBody } from '../required/body.decorator';
import { RequiredHeaders } from '../required/headers.decorator';
import { RequiredQuery } from '../required/query.decorator';

/**
 * Registeres the view for the application.
 * 
 * @export
 * @class ViewRegister
 */
export class ViewRegister {

    constructor(
        private views: Array<any>,
        private injectables: Object,
        private application: Application
    ) {
        console.log(chalk.bgCyan.black('Registering Routes'));

        for (let view of this.views)
            this.register(view);

        console.log(chalk.bgCyan.black(`Registered ${this.views.length} Routes`));
    }

    private register(view: any): void {

        // Get the view metadata.
        let metadata: IViewDecorator = Reflect.getMetadata('unison:view', view);

        // Loop through all the methods of the view.
        for (let method of Object.getOwnPropertyNames(Object.getPrototypeOf(new view))) {
            if (Reflect.hasMetadata('unison:route', new view(), method)) {

                // Get the route data and the route permissions.
                let routeMetadata: IRouteDecorator = Reflect.getMetadata('unison:route', new view(), method);
                let permissions: Array<any> = Reflect.getMetadata('unison:permissions', new view(), method);

                // Generate the route uri from the route and view metadata.
                let uri = GenerateURI(metadata.base, routeMetadata.route);

                // Register the express routes.
                this.application[MethodMap[routeMetadata.method]](uri, (request: Request, response: Response) => {

                    let requiredQueryParams = Reflect.getMetadata('unison:required-query', new view(), method);
                    let requiredBodyParams = Reflect.getMetadata('unison:required-body', new view(), method);
                    let requiredHeaders = Reflect.getMetadata('unison:required-headers', new view(), method);

                    console.log(request.body);

                    if (requiredQueryParams !== undefined && requiredQueryParams.length > 0) {
                        for (let param of requiredQueryParams) {
                            if (request.query[param] === undefined) {
                                return response.json({
                                    success: false,
                                    error: `Missing Query Parameter: ${param}`
                                });
                            }
                        }
                    }

                    if (requiredHeaders !== undefined && requiredHeaders.length > 0) {
                        for (let header of requiredHeaders) {
                            if (request.headers[header] === undefined) {
                                return response.json({
                                    success: false,
                                    error: `Missing Header Parameter: ${header}`
                                });
                            }
                        }
                    }

                    if (requiredBodyParams !== undefined && requiredBodyParams.length > 0) {
                        for (let param of requiredBodyParams) {
                            if (request.body[param] === undefined) {
                                return response.json({
                                    success: false,
                                    error: `Missing Body Parameter: ${param}`
                                });
                            }
                        }
                    }

                    // Ensure request passses all permission checks.
                    if (permissions !== undefined && permissions.length > 0) {
                        for (let permission of permissions) {
                            if (!this.injectables[ClassName(permission)]['check'](request, response)) {
                                return this.injectables[ClassName(permission)]['reject'](request, response);
                            }
                        }
                    }

                    // Inject view dependencies.
                    let dependencies = [];

                    if (Reflect.getMetadata('design:paramtypes', view) !== undefined &&
                        Reflect.getMetadata('design:paramtypes', view).length > 0) {
                        for (let dependency of Reflect.getMetadata('design:paramtypes', view)) {
                            dependencies.push(this.injectables[ClassName(dependency)]);
                        }
                    }

                    new view(...dependencies)[method](request, response);

                });

            }
        }

    }

}
