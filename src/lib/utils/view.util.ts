
/**
 * Generates a route with a proper uri.
 * 
 * @export
 * @param {string} base - The base route.
 * @param {string} route - The extending route.
 * @returns {string} 
 */
export function GenerateURI(base: string, route: string): string {

    // Determines if the base ends with a slash or the route starts with a slash.
    if ((base.slice(-1) === '/' && route.slice(0, 1) !== '/') ||
        (base.slice(-1) !== '/' && route.slice(0, 1) === '/'))
        return base + route;

    // Determins if the base and route both have slashes in their respecitive places.
    if (base.slice(-1) === '/' && route.slice(0, 1) === '/')
        return base.slice(0, -1) + route;

    return `${base}/${route}`;

}