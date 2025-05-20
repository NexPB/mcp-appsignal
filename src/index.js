#!/usr/bin/env node

// Simple MCP server for AppSignal
// Based on the MCP TypeScript SDK examples

// Load dependencies
require('dotenv').config();
const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const axios = require('axios');
const { z } = require('zod');

// Get API credentials from environment variables
const apiToken = process.env.APPSIGNAL_API_TOKEN;
const appId = process.env.APPSIGNAL_APP_ID;

if (!apiToken || !appId) {
  console.error('Error: APPSIGNAL_API_TOKEN and APPSIGNAL_APP_ID environment variables are required');
  process.exit(1);
}

// Create the AppSignal client
class AppSignalClient {
  constructor(apiToken, appId) {
    this.apiToken = apiToken;
    this.appId = appId;
    this.baseUrl = 'https://appsignal.com/graphql';
  }

  async executeQuery(query, variables) {
    try {
      const response = await axios.post(
        `${this.baseUrl}?token=${this.apiToken}`,
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getIncident(incidentNumber) {
    const query = `
      query IncidentQuery($appId: String!, $incidentNumber: Int!) {
        app(id: $appId) {
          id
          incident(incidentNumber: $incidentNumber) {
            ... on ExceptionIncident {
              id
              number
              count
              lastOccurredAt
              actionNames
              exceptionName
              state
              namespace
              firstBacktraceLine
              errorGroupingStrategy
              severity
            }
          }
        }
      }
    `;

    const result = await this.executeQuery(query, {
      appId: this.appId,
      incidentNumber,
    });

    return result.app.incident;
  }

  async getIncidentSample(incidentNumber, sampleId) {
    const query = `
      query IncidentSampleQuery($appId: String!, $incidentNumber: Int!, $sampleId: String) {
        app(id: $appId) {
          id
          incident(incidentNumber: $incidentNumber) {
            ... on ExceptionIncident {
              sample(id: $sampleId) {
                id
                appId
                time
                revision
                action
                namespace
                overview {
                  key
                  value
                }
                exception {
                  name
                  message
                  backtrace {
                    original
                    line
                    column
                    path
                    method
                    url
                    type
                    code {
                      line
                      source
                    }
                    error {
                      class
                      message
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.executeQuery(query, {
      appId: this.appId,
      incidentNumber,
      sampleId,
    });

    return result.app.incident.sample;
  }

  async listIncidents(limit = 25, state) {
    const query = `
      query ExceptionIncidentsQuery(
        $appId: String!
        $limit: Int
        $state: IncidentStateEnum
      ) {
        app(id: $appId) {
          id
          exceptionIncidents(
            limit: $limit
            state: $state
          ) {
            id
            number
            count
            lastOccurredAt
            actionNames
            exceptionName
            state
            namespace
            firstBacktraceLine
            errorGroupingStrategy
            severity
          }
        }
      }
    `;

    const result = await this.executeQuery(query, {
      appId: this.appId,
      limit,
      state,
    });

    return result.app.exceptionIncidents;
  }
}

// Create the AppSignal client
const client = new AppSignalClient(apiToken, appId);

// Create the MCP server
const server = new McpServer({
  name: 'AppSignal MCP',
  version: '1.0.0',
});

// Resource for incident information
server.resource(
  'incident',
  new ResourceTemplate('appsignal://incident/{incidentNumber}', { list: undefined }),
  async (uri, { incidentNumber }) => {
    try {
      const incident = await client.getIncident(Number(incidentNumber));
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(incident, null, 2),
        }],
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching incident: ${error.message}`,
        }],
      };
    }
  }
);

// Resource for incident sample
server.resource(
  'incident-sample',
  new ResourceTemplate('appsignal://incident/{incidentNumber}/sample/{sampleId?}', { list: undefined }),
  async (uri, { incidentNumber, sampleId }) => {
    try {
      // Convert sampleId to string if it's an array (from URI template)
      const sampleIdStr = Array.isArray(sampleId) ? sampleId[0] : sampleId;
      const sample = await client.getIncidentSample(Number(incidentNumber), sampleIdStr);
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(sample, null, 2),
        }],
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching incident sample: ${error.message}`,
        }],
      };
    }
  }
);

// Resource for listing incidents
server.resource(
  'incidents',
  'appsignal://incidents',
  async (uri) => {
    try {
      const incidents = await client.listIncidents();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(incidents, null, 2),
        }],
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching incidents: ${error.message}`,
        }],
      };
    }
  }
);

// Tool to fetch an incident by number
server.tool(
  'getIncident',
  {
    incidentNumber: z.number().int().positive(),
  },
  async ({ incidentNumber }) => {
    try {
      const incident = await client.getIncident(incidentNumber);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(incident, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching incident: ${error.message}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool to fetch an incident sample
server.tool(
  'getIncidentSample',
  {
    incidentNumber: z.number().int().positive(),
    sampleId: z.string().optional(),
  },
  async ({ incidentNumber, sampleId }) => {
    try {
      const sample = await client.getIncidentSample(incidentNumber, sampleId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(sample, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching incident sample: ${error.message}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool to list incidents
server.tool(
  'listIncidents',
  {
    limit: z.number().int().positive().default(25),
    state: z.enum(['open', 'closed', 'ignored']).optional(),
  },
  async ({ limit, state }) => {
    try {
      const incidents = await client.listIncidents(limit, state);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(incidents, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing incidents: ${error.message}`,
        }],
        isError: true,
      };
    }
  }
);

// Prompt to analyze an incident
server.prompt(
  'analyzeIncident',
  {
    incidentNumber: z.string(),
  },
  (args) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Please analyze AppSignal incident #${args.incidentNumber} and provide insights on:
1. What is the root cause of this error?
2. How severe is this issue?
3. What are potential solutions to fix it?
4. Are there any patterns or trends to be aware of?`,
      },
    }],
  })
);

// Prompt to suggest fixes for an error
server.prompt(
  'suggestFixes',
  {
    incidentNumber: z.string(),
  },
  (args) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `For AppSignal incident #${args.incidentNumber}, please:
1. Analyze the error and backtrace
2. Suggest specific code changes to fix the issue
3. Provide any additional context or recommendations for preventing similar issues`,
      },
    }],
  })
);

// Start the server with stdio transport
console.log('Starting MCP server with stdio transport...');
const transport = new StdioServerTransport();

// Connect the server to the transport
server.connect(transport).catch(error => {
  console.error(`Error starting server: ${error.message}`);
  process.exit(1);
});
