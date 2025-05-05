# Perplexity Ask MCP Server

An MCP server implementation that integrates the Sonar API to provide Claude with unparalleled real-time, web-wide research.

Please refer to the official [DeepWiki page](https://deepwiki.com/ppl-ai/modelcontextprotocol) for assistance with implementation. 

# High-level System Architecture

*Credits: DeepWiki powered by Devin*

![System Architecture](perplexity-ask/assets/system_architecture.png)





![Demo](perplexity-ask/assets/demo_screenshot.png)


## Tools

- **perplexity_ask**
  - Engage in a conversation with the Sonar API for live web searches.
  - **Inputs:**
    - `messages` (array): An array of conversation messages.
      - Each message must include:
        - `role` (string): The role of the message (e.g., `system`, `user`, `assistant`).
        - `content` (string): The content of the message.

## Configuration

### Step 1: 

Clone this repository:

```bash
git clone git@github.com:ppl-ai/modelcontextprotocol.git
```

Navigate to the `perplexity-ask` directory and install the necessary dependencies:

```bash
cd modelcontextprotocol/perplexity-ask && npm install
```

### Step 2: Get a Sonar API Key

1. Sign up for a [Sonar API account](https://docs.perplexity.ai/guides/getting-started).
2. Follow the account setup instructions and generate your API key from the developer dashboard.
3. Set the API key in your environment as `PERPLEXITY_API_KEY`.

### Step 3: Configure Claude Desktop

1. Download Claude desktop [here](https://claude.ai/download). 

2. Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PERPLEXITY_API_KEY",
        "mcp/perplexity-ask"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "npx",
      "args": [
        "-y",
        "server-perplexity-ask"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

You can access the file using:

```bash
vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 4: Build the Docker Image

Docker build:

```bash
docker build -t mcp/perplexity-ask:latest -f Dockerfile .
```

### Step 5: Testing

Let's make sure Claude for Desktop is picking up the two tools we've exposed in our `perplexity-ask` server. You can do this by looking for the hammer icon:

![Claude Visual Tools](perplexity-ask/assets/visual-indicator-mcp-tools.png)

After clicking on the hammer icon, you should see the tools that come with the Filesystem MCP Server:

![Available Integration](perplexity-ask/assets/available_tools.png)

If you see both of these this means that the integration is active. Congratulations! This means Claude can now ask Perplexity. You can then simply use it as you would use the Perplexity web app.  

### Step 6: Advanced parameters

Currently, the search parameters used are the default ones. You can modify any search parameter in the API call directly in the `index.ts` script. For this, please refer to the official [API documentation](https://docs.perplexity.ai/api-reference/chat-completions).

### Step 7: Configure Proxy Settings (Optional)

If you need to access the Perplexity API through a proxy server, you can set up environment variables:

1. For Docker deployment, add the proxy variables to your Docker run command:

```bash
docker run -i --rm -e PERPLEXITY_API_KEY -e HTTP_PROXY="http://proxy.example.com:8080" -e HTTPS_PROXY="http://proxy.example.com:8080" mcp/perplexity-ask
```

2. For NPX deployment, set the environment variables before running:

```bash
export HTTP_PROXY="http://proxy.example.com:8080"
export HTTPS_PROXY="http://proxy.example.com:8080"
npx -y server-perplexity-ask
```

3. For Claude Desktop configuration, add the proxy settings to your config:

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PERPLEXITY_API_KEY",
        "-e",
        "HTTPS_PROXY",
        "mcp/perplexity-ask"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE",
        "HTTPS_PROXY": "http://proxy.example.com:8080"
      }
    }
  }
}
```

You can also specify `NO_PROXY` environment variable to exclude certain domains from using the proxy.

### Testing Proxy Configuration

To test if your proxy configuration is working:

1. Run the server with proxy settings:

```bash
# 使用代理设置启动服务器
export HTTPS_PROXY="http://your_proxy_server:port"
export PERPLEXITY_API_KEY="your_api_key_here"
npx -y server-perplexity-ask
```

2. You should see a message in the console output indicating that the proxy is enabled:
```
代理配置已启用: http://your_proxy_server:port
```

3. Try using the Perplexity tools in Claude or Cursor and verify that requests are going through your proxy.

### Troubleshooting 

The Claude documentation provides an excellent [troubleshooting guide](https://modelcontextprotocol.io/docs/tools/debugging) you can refer to. However, you can still reach out to us at api@perplexity.ai for any additional support or [file a bug](https://github.com/ppl-ai/api-discussion/issues). 


# Cursor integration

You can also use our MCP with Cursor (or any other app that supports this). To use Sonar with Cursor, you can follow the following steps. 

### Step 1: Navigate to your Cursor settings:

![Cursor Settings](perplexity-ask/assets/cursor-settings.png)

### Step 2: Navigate to the MCP directory

And click on `Add new global MCP server`

![Add Server](perplexity-ask/assets/cursor-mcp-directory.png)


### Step 3: Insert the MCP Server Configuration from above 

This is the same configuration you would use for any other application that supports MCP. 

You should then see the application being part of your available tools like this:

![Cursor MCP](perplexity-ask/assets/perplexity-ask-mcp-cursor.png)


## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

