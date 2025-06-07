import { error, json, text, type Handle } from '@sveltejs/kit';
/*
 * CSRF protection copied from sveltekit but with the ability to turn it off for specific routes.
 * Logic duplicated from `src/runtime/respond#respond` as of commit
 * `008056b6ef33b554f8b03131c2635cc14b677ff1`
 * https://github.com/sveltejs/kit/issues/6784
 */
export function csrf(allowedPaths: (string | { path: string, actions?: string[] })[]): Handle {
    return async ({ event, resolve }) => {
        const { request, url } = event;
        
        const forbidden = isFormContentType(request) &&
        (
            request.method === "POST" ||
            request.method === "PUT" ||
            request.method === "PATCH" ||
            request.method === "DELETE") &&
            request.headers.get("origin") !== url.origin &&
            !allowedPaths.some((pathConfig) => {
                const path = typeof pathConfig === 'string' ? pathConfig : pathConfig.path;
                const actions = typeof pathConfig === 'object' ? pathConfig.actions : undefined;
                
                const regex = new RegExp(`^${path.replace("*", ".*")}$`);
                const pathMatch = regex.test(url.pathname);
                
                if (pathMatch && actions) {
                    const actionHeader = request.headers.get("x-sveltekit-action");
                    return actions.some(action => actionHeader?.startsWith(action));
                }
                
                return pathMatch;
            }
        );
        
        if (forbidden) {
            const message = `Cross-site ${request.method} form submissions are forbidden`;
            if (request.headers.get("accept") === "application/json") {
                return json({ message }, { status: 403 });
            }
            return text(message, { status: 403 });
        }
        return resolve(event);
    };
}

function isContentType(request: Request, ...types: string[]) {
    const type = request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";
    return types.includes(type.toLowerCase());
}

function isFormContentType(request: Request) {
    return isContentType(
        request,
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "text/plain",
    );
}