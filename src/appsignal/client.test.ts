import { AppSignalClient } from './client.js';
import axios from 'axios';
import { jest } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AppSignalClient', () => {
  const apiToken = 'test-token';
  const appId = 'test-app-id';
  let client: AppSignalClient;

  beforeEach(() => {
    client = new AppSignalClient(apiToken, appId);
    jest.clearAllMocks();
  });

  describe('getIncident', () => {
    it('should fetch an incident by number', async () => {
      // Mock response
      const mockResponse = {
        data: {
          data: {
            app: {
              id: appId,
              incident: {
                id: 'incident-1',
                number: 5321,
                count: 10,
                lastOccurredAt: '2023-05-20T12:00:00Z',
                actionNames: ['Controller#action'],
                exceptionName: 'RuntimeError',
                state: 'open',
                namespace: 'web',
                firstBacktraceLine: 'app/controllers/application_controller.rb:25',
                errorGroupingStrategy: 'standard',
                severity: 'high',
              },
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.getIncident(5321);

      // Verify
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://appsignal.com/graphql?token=${apiToken}`,
        expect.objectContaining({
          variables: {
            appId,
            incidentNumber: 5321,
          },
        }),
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse.data.data.app.incident);
    });

    it('should handle API errors', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      // Execute and verify
      await expect(client.getIncident(5321)).rejects.toThrow('Network error');
    });
  });

  describe('listIncidents', () => {
    it('should list incidents with default parameters', async () => {
      // Mock response
      const mockResponse = {
        data: {
          data: {
            app: {
              id: appId,
              exceptionIncidents: [
                {
                  id: 'incident-1',
                  number: 5321,
                  count: 10,
                  lastOccurredAt: '2023-05-20T12:00:00Z',
                  actionNames: ['Controller#action'],
                  exceptionName: 'RuntimeError',
                  state: 'open',
                  namespace: 'web',
                  firstBacktraceLine: 'app/controllers/application_controller.rb:25',
                  errorGroupingStrategy: 'standard',
                  severity: 'high',
                },
              ],
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.listIncidents();

      // Verify
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://appsignal.com/graphql?token=${apiToken}`,
        expect.objectContaining({
          variables: {
            appId,
            limit: 25,
            state: undefined,
          },
        }),
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse.data.data.app.exceptionIncidents);
    });
  });
});
