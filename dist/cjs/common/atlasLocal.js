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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultCreateAtlasLocalClient = void 0;
const defaultCreateAtlasLocalClient = async () => {
    try {
        // Import Atlas Local client asyncronously
        // This will fail on unsupported platforms
        const { Client: AtlasLocalClient } = await Promise.resolve().then(() => __importStar(require("@mongodb-js/atlas-local")));
        try {
            // Connect to Atlas Local client
            // This will fail if docker is not running
            return AtlasLocalClient.connect();
        }
        catch {
            console.warn("Cannot connect to Docker. Atlas Local tools are disabled. All other tools continue to work normally.");
        }
    }
    catch {
        console.warn("Atlas Local is not supported on this platform. Atlas Local tools are disabled. All other tools continue to work normally.");
    }
    return undefined;
};
exports.defaultCreateAtlasLocalClient = defaultCreateAtlasLocalClient;
//# sourceMappingURL=atlasLocal.js.map