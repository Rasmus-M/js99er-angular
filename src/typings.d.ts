/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module 'image-map-resizer' {
    export default function imageMapResize(map: HTMLMapElement): void;
}

declare module 'gapi-client' {

    interface AuthInstance {
        isSignedIn: {
            get: () => boolean;
            listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        signIn(): void;
    }

    function load(api: string, callback: () => void);

    namespace client {
        export import Request = gapi.client.Request;
        export import Response = gapi.client.Response;

        function init(config): Promise;
        function request(config): Request<any>;
    }

    declare namespace auth {
        export import GoogleApiOAuth2TokenObject = gapi.auth.GoogleApiOAuth2TokenObject;

        function getToken(): GoogleApiOAuth2TokenObject;
    }

    declare namespace auth2 {
        function getAuthInstance(): AuthInstance;
    }
}
