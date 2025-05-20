import axios from 'axios';
import { z } from 'zod';

// Define the schema for incident data
export const IncidentSchema = z.object({
  id: z.string(),
  number: z.number(),
  count: z.number(),
  lastOccurredAt: z.string(),
  actionNames: z.array(z.string()),
  exceptionName: z.string(),
  state: z.string(),
  namespace: z.string(),
  firstBacktraceLine: z.string().optional(),
  errorGroupingStrategy: z.string().optional(),
  severity: z.string().optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;

// Define the schema for sample data
export const SampleSchema = z.object({
  id: z.string(),
  appId: z.string(),
  time: z.string(),
  revision: z.string().optional(),
  action: z.string(),
  namespace: z.string(),
  overview: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
  exception: z.object({
    name: z.string(),
    message: z.string(),
    backtrace: z.array(z.object({
      original: z.string().optional(),
      line: z.number().optional(),
      column: z.number().optional(),
      path: z.string().optional(),
      method: z.string().optional(),
      url: z.string().optional(),
      type: z.string().optional(),
      code: z.object({
        line: z.number().optional(),
        source: z.string().optional(),
      }).optional(),
      error: z.object({
        class: z.string().optional(),
        message: z.string().optional(),
      }).optional(),
    })),
  }),
});

export type Sample = z.infer<typeof SampleSchema>;

export class AppSignalClient {
  private apiToken: string;
  private appId: string;
  private baseUrl: string;

  constructor(apiToken: string, appId: string) {
    this.apiToken = apiToken;
    this.appId = appId;
    this.baseUrl = 'https://appsignal.com/graphql';
  }

  /**
   * Execute a GraphQL query against the AppSignal API
   */
  private async executeQuery<T>(query: string, variables: Record<string, any>): Promise<T> {
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

      return response.data.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch an incident by its number
   */
  async getIncident(incidentNumber: number): Promise<Incident> {
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

    const result = await this.executeQuery<{
      app: {
        id: string;
        incident: Incident;
      };
    }>(query, {
      appId: this.appId,
      incidentNumber,
    });

    return result.app.incident;
  }

  /**
   * Fetch a sample for a specific incident
   */
  async getIncidentSample(incidentNumber: number, sampleId?: string): Promise<Sample> {
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

    const result = await this.executeQuery<{
      app: {
        id: string;
        incident: {
          sample: Sample;
        };
      };
    }>(query, {
      appId: this.appId,
      incidentNumber,
      sampleId,
    });

    return result.app.incident.sample;
  }

  /**
   * List incidents with optional filtering
   */
  async listIncidents(limit: number = 25, state?: string): Promise<Incident[]> {
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

    const result = await this.executeQuery<{
      app: {
        id: string;
        exceptionIncidents: Incident[];
      };
    }>(query, {
      appId: this.appId,
      limit,
      state,
    });

    return result.app.exceptionIncidents;
  }
}
