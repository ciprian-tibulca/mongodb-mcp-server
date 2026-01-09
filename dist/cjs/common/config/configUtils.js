"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchingConfigKey = matchingConfigKey;
exports.getLocalDataPath = getLocalDataPath;
exports.getLogPath = getLogPath;
exports.getExportsPath = getExportsPath;
exports.commaSeparatedToArray = commaSeparatedToArray;
exports.parseBoolean = parseBoolean;
exports.oneWayOverride = oneWayOverride;
exports.onlyLowerThanBaseValueOverride = onlyLowerThanBaseValueOverride;
exports.onlySubsetOfBaseValueOverride = onlySubsetOfBaseValueOverride;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const userConfig_js_1 = require("./userConfig.js");
const levenshteinModule = __importStar(require("ts-levenshtein"));
const levenshtein = levenshteinModule.default;
function matchingConfigKey(key) {
    let minLev = Number.MAX_VALUE;
    let suggestion = undefined;
    for (const validKey of userConfig_js_1.ALL_CONFIG_KEYS) {
        const lev = levenshtein.get(key, validKey);
        // Accepting upto 2 typos and should be better than whatever previous
        // suggestion was.
        if (lev <= 2 && lev < minLev) {
            minLev = lev;
            suggestion = validKey;
        }
    }
    return suggestion;
}
function getLocalDataPath() {
    return process.platform === "win32"
        ? path_1.default.join(process.env.LOCALAPPDATA || process.env.APPDATA || os_1.default.homedir(), "mongodb")
        : path_1.default.join(os_1.default.homedir(), ".mongodb");
}
function getLogPath() {
    const logPath = path_1.default.join(getLocalDataPath(), "mongodb-mcp", ".app-logs");
    return logPath;
}
function getExportsPath() {
    return path_1.default.join(getLocalDataPath(), "mongodb-mcp", "exports");
}
function commaSeparatedToArray(str) {
    if (str === undefined) {
        return undefined;
    }
    if (typeof str === "string") {
        return str
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0);
    }
    if (str.length === 1) {
        return str[0]
            ?.split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0);
    }
    return str;
}
/**
 * Preprocessor for boolean values that handles string "false"/"0" correctly.
 * Zod's coerce.boolean() treats any non-empty string as true, which is not what we want.
 */
function parseBoolean(val) {
    if (val === undefined) {
        return undefined;
    }
    if (typeof val === "string") {
        if (val === "false") {
            return false;
        }
        if (val === "true") {
            return true;
        }
        throw new Error(`Invalid boolean value: ${val}`);
    }
    if (typeof val === "boolean") {
        return val;
    }
    if (typeof val === "number") {
        return val !== 0;
    }
    return !!val;
}
/** Allow overriding only to the allowed value */
function oneWayOverride(allowedValue) {
    return (oldValue, newValue) => {
        // Only allow override if setting to allowed value or current value
        if (newValue === oldValue) {
            return newValue;
        }
        if (newValue === allowedValue) {
            return newValue;
        }
        throw new Error(`Can only set to ${String(allowedValue)}`);
    };
}
/** Allow overriding only to a value lower than the specified value */
function onlyLowerThanBaseValueOverride() {
    return (oldValue, newValue) => {
        if (typeof oldValue !== "number") {
            throw new Error(`Unsupported type for base value for override: ${typeof oldValue}`);
        }
        if (typeof newValue !== "number") {
            throw new Error(`Unsupported type for new value for override: ${typeof newValue}`);
        }
        if (newValue >= oldValue) {
            throw new Error(`Can only set to a value lower than the base value`);
        }
        return newValue;
    };
}
/** Allow overriding only to a subset of an array but not a superset */
function onlySubsetOfBaseValueOverride() {
    return (oldValue, newValue) => {
        if (!Array.isArray(oldValue)) {
            throw new Error(`Unsupported type for base value for override: ${typeof oldValue}`);
        }
        if (!Array.isArray(newValue)) {
            throw new Error(`Unsupported type for new value for override: ${typeof newValue}`);
        }
        if (newValue.length > oldValue.length) {
            throw new Error(`Can only override to a subset of the base value`);
        }
        if (!newValue.every((value) => oldValue.includes(value))) {
            throw new Error(`Can only override to a subset of the base value`);
        }
        return newValue;
    };
}
//# sourceMappingURL=configUtils.js.map