import type { Middleware } from "openapi-fetch";
import type { LoggerBase } from "../../logger.js";
import type { AuthProvider } from "./authProvider.js";
export interface ClientCredentialsAuthOptions {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    userAgent: string;
}
export declare class ClientCredentialsAuthProvider implements AuthProvider {
    private oauth2Client?;
    private oauth2Issuer?;
    private accessToken?;
    private readonly options;
    private readonly logger;
    private static customFetch;
    constructor(options: ClientCredentialsAuthOptions, logger: LoggerBase);
    getAuthHeaders(): Promise<Record<string, string> | undefined>;
    hasCredentials(): boolean;
    private isAccessTokenValid;
    private getOauthClientAuth;
    private getNewAccessToken;
    getAccessToken(): Promise<string | undefined>;
    validateAccessToken(): Promise<void>;
    revokeAccessToken(): Promise<void>;
    middleware(): Middleware;
}
//# sourceMappingURL=clientCredentials.d.ts.map