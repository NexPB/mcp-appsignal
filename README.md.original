# AppSignal MCP Server

An MCP (Model Context Protocol) server for connecting to AppSignal and fetching incident information.

## Features

- Connect to AppSignal's GraphQL API
- Fetch incident details and samples
- List and search incidents
- Provide prompts for analyzing incidents and suggesting fixes

## Prerequisites

- Node.js 18 or higher
- AppSignal API token and App ID

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-appsignal.git
   cd mcp-appsignal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your AppSignal credentials:
   ```
   APPSIGNAL_API_TOKEN=your-api-token
   APPSIGNAL_APP_ID=your-app-id
   ```

## Usage

### Running the MCP Server

```bash
node src/index.js
```

### Integrating with Cursor

To use this MCP server with Cursor, add the following configuration to your Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "appsignal": {
        "command": "node",
        "args": ["/path/to/mcp-appsignal/src/index.js"],
        "env": {
          "APPSIGNAL_API_TOKEN": "your-api-token",
          "APPSIGNAL_APP_ID": "your-app-id"
        }
      }
    }
  }
}
```

Replace `/path/to/mcp-appsignal` with the actual path to your repository.

## MCP Resources

The server exposes the following resources:

- `appsignal://incident/{incidentNumber}` - Get details about a specific incident
- `appsignal://incident/{incidentNumber}/sample/{sampleId?}` - Get a sample for a specific incident
- `appsignal://incidents` - List all incidents

## MCP Tools

The server provides the following tools:

- `getIncident` - Fetch an incident by number
- `getIncidentSample` - Fetch a sample for a specific incident
- `listIncidents` - List incidents with optional filtering

## MCP Prompts

The server offers the following prompts:

- `analyzeIncident` - Analyze an incident and provide insights
- `suggestFixes` - Suggest fixes for an error

## Testing with MCP Inspector

You can test the server using the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector):

1. Install the MCP Inspector:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Run the inspector and point it to your server:
   ```bash
   mcp-inspector --command "node src/index.js"
   ```

## License

MIT
