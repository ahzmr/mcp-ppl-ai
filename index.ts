#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

/**
 * Definition of the Perplexity Ask Tool.
 * This tool accepts an array of messages and returns a chat completion response
 * from the Perplexity API, with citations appended to the message if provided.
 */
const PERPLEXITY_ASK_TOOL: Tool = {
  name: "perplexity_ask",
  description:
    "Engages in a conversation using the Sonar API. " +
    "Accepts an array of messages (each with a role and content) . " +
        "and the last message must have role `user`. " +
    "and returns a ask completion response from the Perplexity model.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
    },
    required: ["messages"],
  },
};

/**
 * Definition of the Perplexity Research Tool.
 * This tool performs deep research queries using the Perplexity API.
 */
const PERPLEXITY_RESEARCH_TOOL: Tool = {
  name: "perplexity_research",
  description:
    "Performs deep research using the Perplexity API. " +
    "Accepts an array of messages (each with a role and content) . " +
        "and the last message must have role `user`. " +
    "and returns a comprehensive research response with citations.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
    },
    required: ["messages"],
  },
};

/**
 * Definition of the Perplexity Reason Tool.
 * This tool performs reasoning queries using the Perplexity API.
 */
const PERPLEXITY_REASON_TOOL: Tool = {
  name: "perplexity_reason",
  description:
    "Performs reasoning tasks using the Perplexity API. " +
    "Accepts an array of messages (each with a role and content) . " +
        "and the last message must have role `user`. " +
    "and returns a well-reasoned response using the sonar-reasoning-pro model.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
    },
    required: ["messages"],
  },
};

// Retrieve the Perplexity API key from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  console.error("Error: PERPLEXITY_API_KEY environment variable is required");
  process.exit(1);
}

// 获取代理配置环境变量
const HTTP_PROXY = process.env.HTTP_PROXY || process.env.http_proxy;
const HTTPS_PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const NO_PROXY = process.env.NO_PROXY || process.env.no_proxy;

if (HTTP_PROXY || HTTPS_PROXY) {
  console.error(`代理配置已启用: ${HTTPS_PROXY || HTTP_PROXY}`);
}

/**
 * Performs a chat completion by sending a request to the Perplexity API.
 * Appends citations to the returned message content if they exist.
 * Supports HTTP/HTTPS proxy through environment variables via httpsAgent.
 *
 * @param {Array<{ role: string; content: string }>} messages - An array of message objects.
 * @param {string} model - The model to use for the completion.
 * @returns {Promise<string>} The chat completion result with appended citations.
 * @throws Will throw an error if the API request fails.
 */
async function performChatCompletion(
  messages: Array<{ role: string; content: string }>,
  model: string = "sonar-pro"
): Promise<string> {
  // Construct the API endpoint URL and request body
  const url = "https://api.perplexity.ai/chat/completions";
  const body = {
    model: model, // Model identifier passed as parameter
    messages: messages,
    // Additional parameters can be added here if required (e.g., max_tokens, temperature, etc.)
    // See the Sonar API documentation for more details: 
    // https://docs.perplexity.ai/api-reference/chat-completions
  };

  // 配置 axios 选项
  const axiosConfig: any = {
    method: "POST",
    url: url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
    },
    data: body,
  };

  // 使用 HttpsProxyAgent 方式添加代理配置（如果存在）
  if (HTTPS_PROXY) {
    console.error(`使用 httpsAgent 方式配置代理: ${HTTPS_PROXY}`);
    axiosConfig.httpsAgent = new HttpsProxyAgent(HTTPS_PROXY);
  } else if (HTTP_PROXY) {
    console.error(`使用 httpsAgent 方式配置代理: ${HTTP_PROXY}`);
    axiosConfig.httpsAgent = new HttpsProxyAgent(HTTP_PROXY);
  }

  // 检查 NO_PROXY 设置
  if (axiosConfig.httpsAgent && NO_PROXY) {
    const hostname = new URL(url).hostname;
    const noProxyList = NO_PROXY.split(',').map(item => item.trim());
    if (noProxyList.some(pattern => {
      if (pattern.startsWith('.')) {
        return hostname.endsWith(pattern) || hostname === pattern.substring(1);
      } else {
        return hostname === pattern;
      }
    })) {
      console.error(`${hostname} 匹配 NO_PROXY 设置，跳过代理`);
      delete axiosConfig.httpsAgent;
    }
  }

  try {
    const response = await axios(axiosConfig);
    
    // 处理响应数据
    const data = response.data;
    
    // Directly retrieve the main message content from the response 
    let messageContent = data.choices[0].message.content;

    // If citations are provided, append them to the message content
    if (data.citations && Array.isArray(data.citations) && data.citations.length > 0) {
      messageContent += "\n\nCitations:\n";
      data.citations.forEach((citation: string, index: number) => {
        messageContent += `[${index + 1}] ${citation}\n`;
      });
    }

    return messageContent;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Perplexity API error: ${error.response.status} ${error.response.statusText}\n${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error(`Network error while calling Perplexity API: No response received`);
      } else {
        throw new Error(`Error setting up Perplexity API request: ${error.message}`);
      }
    } else {
      throw new Error(`Error while calling Perplexity API: ${error}`);
    }
  }
}

// Initialize the server with tool metadata and capabilities
const server = new Server(
  {
    name: "example-servers/perplexity-ask",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Registers a handler for listing available tools.
 * When the client requests a list of tools, this handler returns all available Perplexity tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [PERPLEXITY_ASK_TOOL, PERPLEXITY_RESEARCH_TOOL, PERPLEXITY_REASON_TOOL],
}));

/**
 * Registers a handler for calling a specific tool.
 * Processes requests by validating input and invoking the appropriate tool.
 *
 * @param {object} request - The incoming tool call request.
 * @returns {Promise<object>} The response containing the tool's result or an error.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    if (!args) {
      throw new Error("No arguments provided");
    }
    switch (name) {
      case "perplexity_ask": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_ask: 'messages' must be an array");
        }
        // Invoke the chat completion function with the provided messages
        const messages = args.messages;
        const result = await performChatCompletion(messages, "sonar-pro");
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      case "perplexity_research": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_research: 'messages' must be an array");
        }
        // Invoke the chat completion function with the provided messages using the deep research model
        const messages = args.messages;
        const result = await performChatCompletion(messages, "sonar-deep-research");
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      case "perplexity_reason": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_reason: 'messages' must be an array");
        }
        // Invoke the chat completion function with the provided messages using the reasoning model
        const messages = args.messages;
        const result = await performChatCompletion(messages, "sonar-reasoning-pro");
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      default:
        // Respond with an error if an unknown tool is requested
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    // Return error details in the response
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Initializes and runs the server using standard I/O for communication.
 * Logs an error and exits if the server fails to start.
 */
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Perplexity MCP Server running on stdio with Ask, Research, and Reason tools");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

// Start the server and catch any startup errors
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
