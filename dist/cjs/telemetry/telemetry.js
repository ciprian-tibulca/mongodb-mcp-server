"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = void 0;
const logger_js_1 = require("../common/logger.js");
const constants_js_1 = require("./constants.js");
const eventCache_js_1 = require("./eventCache.js");
const container_js_1 = require("../helpers/container.js");
const events_1 = require("events");
const mongodb_redact_1 = require("mongodb-redact");
class Telemetry {
    constructor(session, userConfig, commonProperties, { eventCache, deviceId }) {
        this.session = session;
        this.userConfig = userConfig;
        this.commonProperties = commonProperties;
        this.isBufferingEvents = true;
        this.events = new events_1.EventEmitter();
        this.eventCache = eventCache;
        this.deviceId = deviceId;
    }
    static create(session, userConfig, deviceId, { commonProperties = {}, eventCache = eventCache_js_1.EventCache.getInstance(), } = {}) {
        const mergedProperties = {
            ...constants_js_1.MACHINE_METADATA,
            ...commonProperties,
        };
        const instance = new Telemetry(session, userConfig, mergedProperties, {
            eventCache,
            deviceId,
        });
        void instance.setup();
        return instance;
    }
    async setup() {
        if (!this.isTelemetryEnabled()) {
            this.session.logger.info({
                id: logger_js_1.LogId.telemetryEmitFailure,
                context: "telemetry",
                message: "Telemetry is disabled.",
                noRedaction: true,
            });
            return;
        }
        this.setupPromise = Promise.all([this.deviceId.get(), (0, container_js_1.detectContainerEnv)()]);
        const [deviceIdValue, containerEnv] = await this.setupPromise;
        this.commonProperties.device_id = deviceIdValue;
        this.commonProperties.is_container_env = containerEnv ? "true" : "false";
        this.isBufferingEvents = false;
    }
    async close() {
        this.isBufferingEvents = false;
        this.session.logger.debug({
            id: logger_js_1.LogId.telemetryClose,
            message: `Closing telemetry and flushing ${this.eventCache.size} events`,
            context: "telemetry",
        });
        // Wait up to 5 seconds for events to be sent before closing, but don't throw if it times out
        const flushMaxWaitTime = 5000;
        let flushTimeout;
        await Promise.race([
            new Promise((resolve) => {
                flushTimeout = setTimeout(() => {
                    this.session.logger.debug({
                        id: logger_js_1.LogId.telemetryClose,
                        message: `Failed to flush remaining events within ${flushMaxWaitTime}ms timeout`,
                        context: "telemetry",
                    });
                    resolve();
                }, flushMaxWaitTime);
                flushTimeout.unref();
            }),
            this.emit([]),
        ]);
        clearTimeout(flushTimeout);
    }
    /**
     * Emits events through the telemetry pipeline
     * @param events - The events to emit
     */
    emitEvents(events) {
        if (!this.isTelemetryEnabled()) {
            this.events.emit("events-skipped");
            return;
        }
        // Don't wait for events to be sent - we should not block regular server
        // operations on telemetry
        void this.emit(events);
    }
    /**
     * Gets the common properties for events
     * @returns Object containing common properties for all events
     */
    getCommonProperties() {
        return {
            ...this.commonProperties,
            transport: this.userConfig.transport,
            mcp_client_version: this.session.mcpClient?.version,
            mcp_client_name: this.session.mcpClient?.name,
            session_id: this.session.sessionId,
            config_atlas_auth: this.session.apiClient.hasCredentials() ? "true" : "false",
            config_connection_string: this.userConfig.connectionString ? "true" : "false",
        };
    }
    /**
     * Checks if telemetry is currently enabled
     * This is a method rather than a constant to capture runtime config changes
     *
     * Follows the Console Do Not Track standard (https://consoledonottrack.com/)
     * by respecting the DO_NOT_TRACK environment variable
     */
    isTelemetryEnabled() {
        // Check if telemetry is explicitly disabled in config
        if (this.userConfig.telemetry === "disabled") {
            return false;
        }
        const doNotTrack = "DO_NOT_TRACK" in process.env;
        return !doNotTrack;
    }
    /**
     * Attempts to emit events through authenticated and unauthenticated clients
     * Falls back to caching if both attempts fail
     */
    async emit(events) {
        if (this.isBufferingEvents) {
            this.eventCache.appendEvents(events);
            return;
        }
        try {
            const cachedEvents = this.eventCache.getEvents();
            const allEvents = [...cachedEvents.map((e) => e.event), ...events];
            this.session.logger.debug({
                id: logger_js_1.LogId.telemetryEmitStart,
                context: "telemetry",
                message: `Attempting to send ${allEvents.length} events (${cachedEvents.length} cached)`,
            });
            const result = await this.sendEvents(this.session.apiClient, allEvents);
            if (result.success) {
                this.eventCache.removeEvents(cachedEvents.map((e) => e.id));
                this.session.logger.debug({
                    id: logger_js_1.LogId.telemetryEmitSuccess,
                    context: "telemetry",
                    message: `Sent ${allEvents.length} events successfully: ${JSON.stringify(allEvents)}`,
                });
                this.events.emit("events-emitted");
                return;
            }
            this.session.logger.debug({
                id: logger_js_1.LogId.telemetryEmitFailure,
                context: "telemetry",
                message: `Error sending event to client: ${result.error instanceof Error ? result.error.message : String(result.error)}`,
            });
            this.eventCache.appendEvents(events);
            this.events.emit("events-send-failed");
        }
        catch (error) {
            this.session.logger.debug({
                id: logger_js_1.LogId.telemetryEmitFailure,
                context: "telemetry",
                message: `Error emitting telemetry events: ${error instanceof Error ? error.message : String(error)}`,
                noRedaction: true,
            });
            this.events.emit("events-send-failed");
        }
    }
    /**
     * Attempts to send events through the provided API client.
     * Events are redacted before being sent to ensure no sensitive data is transmitted
     */
    async sendEvents(client, events) {
        try {
            await client.sendEvents(events.map((event) => ({
                ...event,
                properties: {
                    ...(0, mongodb_redact_1.redact)(this.getCommonProperties(), this.session.keychain.allSecrets),
                    ...(0, mongodb_redact_1.redact)(event.properties, this.session.keychain.allSecrets),
                },
            })));
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }
}
exports.Telemetry = Telemetry;
//# sourceMappingURL=telemetry.js.map