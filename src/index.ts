import { config } from 'dotenv';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { AppSignalMcpServer } from './mcp/index';

// Load environment variables
config();

// Get API credentials from environment variables
const apiToken = process.env.APPSIGNAL_API_TOKEN;
const appId = process.env.APPSIGNAL_APP_ID;

if (!apiToken || !appId) {
  console.error('Error: APPSIGNAL_API_TOKEN and APPSIGNAL_APP_ID environment variables are required');
  process.exit(1);
}

// Create the MCP server
const server = new AppSignalMcpServer(apiToken, appId);

// Determine transport type based on command line arguments
const transportType = process.argv[2] || 'stdio';

async function main() {
  try {
    if (transportType === 'http') {
      // Start HTTP server
      const port = parseInt(process.env.PORT || '3000', 10);

      // This is a simplified example - in a real application, you would
      // integrate this with Express or another HTTP server framework
      console.log(`Starting HTTP server on port ${port}...`);

      // For demonstration purposes only - this won't actually start an HTTP server
      console.log('HTTP transport not fully implemented in this example');

      // In a real implementation, you would do something like:
      // const transport = new StreamableHTTPServerTransport({...});
      // await server.connect(transport);
    } else {
      // Default to stdio transport
      console.log('Starting MCP server with stdio transport...');
      const transport = new StdioServerTransport();
      await server.connect(transport);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error starting server: ${error.message}`);
    } else {
      console.error('Unknown error starting server');
    }
    process.exit(1);
  }
}

main();
