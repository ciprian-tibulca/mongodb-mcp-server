"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHostCommunication = useHostCommunication;
const react_1 = require("react");
const server_1 = require("@mcp-ui/server");
/**
 * Hook for sending UI actions to the parent window via postMessage
 * This is used by iframe-based UI components to communicate back to an MCP client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { intent, tool, link } = useHostCommunication();
 *
 *   return <button onClick={() => intent("create-task", { title: "Buy groceries" })}>Create Task</button>;
 * }
 * ```
 */
function useHostCommunication() {
    const intent = (0, react_1.useCallback)((...args) => {
        const result = (0, server_1.uiActionResultIntent)(...args);
        (0, server_1.postUIActionResult)(result);
        return result;
    }, []);
    const notify = (0, react_1.useCallback)((...args) => {
        const result = (0, server_1.uiActionResultNotification)(...args);
        (0, server_1.postUIActionResult)(result);
        return result;
    }, []);
    const prompt = (0, react_1.useCallback)((...args) => {
        const result = (0, server_1.uiActionResultPrompt)(...args);
        (0, server_1.postUIActionResult)(result);
        return result;
    }, []);
    const tool = (0, react_1.useCallback)((...args) => {
        const result = (0, server_1.uiActionResultToolCall)(...args);
        (0, server_1.postUIActionResult)(result);
        return result;
    }, []);
    const link = (0, react_1.useCallback)((...args) => {
        const result = (0, server_1.uiActionResultLink)(...args);
        (0, server_1.postUIActionResult)(result);
        return result;
    }, []);
    return {
        intent,
        notify,
        prompt,
        tool,
        link,
    };
}
//# sourceMappingURL=useHostCommunication.js.map