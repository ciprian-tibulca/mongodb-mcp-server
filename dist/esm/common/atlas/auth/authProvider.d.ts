import type { Middleware } from "openapi-fetch";
import type { LoggerBase } from "../../logger.js";
export interface AccessToken {
    access_token: string;
    expires_at?: number;
}
export interface AuthProvider {
    hasCredentials(): boolean;
    getAccessToken(): Promise<string | undefined>;
    validateAccessToken(): Promise<void>;
    revokeAccessToken(): Promise<void>;
    middleware(): Middleware;
    getAuthHeaders(): Promise<Record<string, string> | undefined>;
}
export interface Credentials {
    clientId?: string;
    clientSecret?: string;
}
export interface AuthProviderOptions {
    apiBaseUrl: string;
    userAgent: string;
    credentials: Credentials;
}
export declare class AuthProviderFactory {
    static create(options: AuthProviderOptions, logger: LoggerBase): AuthProvider | undefined;
}
//# sourceMappingURL=authProvider.d.ts.map