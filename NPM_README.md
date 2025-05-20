# mcp-appsignal

An MCP (Model Context Protocol) server for connecting to AppSignal and fetching incident information.

## Installation

```bash
npm install -g mcp-appsignal
```

## Usage

### Command Line

```bash
# Set environment variables
export APPSIGNAL_API_TOKEN=your-api-token
export APPSIGNAL_APP_ID=your-app-id

# Run the server
mcp-appsignal
```

### With Cursor

Add to your Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "appsignal": {
        "command": "npx",
        "args": ["mcp-appsignal"],
        "env": {
          "APPSIGNAL_API_TOKEN": "your-api-token",
          "APPSIGNAL_APP_ID": "your-app-id"
        }
      }
    }
  }
}
```

## Features

- Connect to AppSignal's GraphQL API
- Fetch incident details and samples
- List and search incidents
- Provide prompts for analyzing incidents and suggesting fixes

## MCP Resources

- `appsignal://incident/{incidentNumber}` - Get details about a specific incident
- `appsignal://incident/{incidentNumber}/sample/{sampleId?}` - Get a sample for a specific incident
- `appsignal://incidents` - List all incidents

## MCP Tools

- `getIncident` - Fetch an incident by number
- `getIncidentSample` - Fetch a sample for a specific incident
- `listIncidents` - List incidents with optional filtering

## MCP Prompts

- `analyzeIncident` - Analyze an incident and provide insights
- `suggestFixes` - Suggest fixes for an error

## License

MIT
