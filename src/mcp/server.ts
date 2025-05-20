import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { AppSignalClient, Incident, Sample } from '../appsignal/index';

export class AppSignalMcpServer {
  private server: McpServer;
  private client: AppSignalClient;

  constructor(apiToken: string, appId: string) {
    this.client = new AppSignalClient(apiToken, appId);
    this.server = new McpServer({
      name: 'AppSignal MCP',
      version: '1.0.0',
    });

    this.setupResources();
    this.setupTools();
    this.setupPrompts();
  }

  /**
   * Set up MCP resources
   */
  private setupResources() {
    // Resource for incident information
    this.server.resource(
      'incident',
      new ResourceTemplate('appsignal://incident/{incidentNumber}', { list: undefined }),
      async (uri, { incidentNumber }) => {
        try {
          const incident = await this.client.getIncident(Number(incidentNumber));
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(incident, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching incident: ${error.message}`,
              }],
            };
          }
          throw error;
        }
      }
    );

    // Resource for incident sample
    this.server.resource(
      'incident-sample',
      new ResourceTemplate('appsignal://incident/{incidentNumber}/sample/{sampleId?}', { list: undefined }),
      async (uri, { incidentNumber, sampleId }) => {
        try {
          // Convert sampleId to string if it's an array (from URI template)
          const sampleIdStr = Array.isArray(sampleId) ? sampleId[0] : sampleId;
          const sample = await this.client.getIncidentSample(Number(incidentNumber), sampleIdStr);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(sample, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching incident sample: ${error.message}`,
              }],
            };
          }
          throw error;
        }
      }
    );

    // Resource for listing incidents
    this.server.resource(
      'incidents',
      'appsignal://incidents',
      async (uri) => {
        try {
          const incidents = await this.client.listIncidents();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(incidents, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching incidents: ${error.message}`,
              }],
            };
          }
          throw error;
        }
      }
    );
  }

  /**
   * Set up MCP tools
   */
  private setupTools() {
    // Tool to fetch an incident by number
    this.server.tool(
      'getIncident',
      {
        incidentNumber: z.number().int().positive(),
      },
      async ({ incidentNumber }) => {
        try {
          const incident = await this.client.getIncident(incidentNumber);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(incident, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              content: [{
                type: 'text',
                text: `Error fetching incident: ${error.message}`,
              }],
              isError: true,
            };
          }
          throw error;
        }
      }
    );

    // Tool to fetch an incident sample
    this.server.tool(
      'getIncidentSample',
      {
        incidentNumber: z.number().int().positive(),
        sampleId: z.string().optional(),
      },
      async ({ incidentNumber, sampleId }) => {
        try {
          const sample = await this.client.getIncidentSample(incidentNumber, sampleId);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(sample, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              content: [{
                type: 'text',
                text: `Error fetching incident sample: ${error.message}`,
              }],
              isError: true,
            };
          }
          throw error;
        }
      }
    );

    // Tool to list incidents
    this.server.tool(
      'listIncidents',
      {
        limit: z.number().int().positive().default(25),
        state: z.enum(['open', 'closed', 'ignored']).optional(),
      },
      async ({ limit, state }) => {
        try {
          const incidents = await this.client.listIncidents(limit, state);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(incidents, null, 2),
            }],
          };
        } catch (error) {
          if (error instanceof Error) {
            return {
              content: [{
                type: 'text',
                text: `Error listing incidents: ${error.message}`,
              }],
              isError: true,
            };
          }
          throw error;
        }
      }
    );
  }

  /**
   * Set up MCP prompts
   */
  private setupPrompts() {
    // Prompt to analyze an incident
    this.server.prompt(
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
    this.server.prompt(
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
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport: any) {
    return this.server.connect(transport);
  }

  /**
   * Close the server connection
   */
  close() {
    return this.server.close();
  }
}
