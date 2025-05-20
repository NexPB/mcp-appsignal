import { AppSignalMcpServer } from './server.js';
import { AppSignalClient } from '../appsignal/client.js';
import { jest } from '@jest/globals';

// Mock the AppSignalClient
jest.mock('../appsignal/client.js');
const MockedAppSignalClient = AppSignalClient as jest.MockedClass<typeof AppSignalClient>;

describe('AppSignalMcpServer', () => {
  const apiToken = 'test-token';
  const appId = 'test-app-id';
  let server: AppSignalMcpServer;
  let mockClient: jest.Mocked<AppSignalClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up mock implementation
    mockClient = {
      getIncident: jest.fn(),
      getIncidentSample: jest.fn(),
      listIncidents: jest.fn(),
    } as unknown as jest.Mocked<AppSignalClient>;

    // Mock the constructor to return our mock client
    MockedAppSignalClient.mockImplementation(() => mockClient);

    // Create the server
    server = new AppSignalMcpServer(apiToken, appId);
  });

  describe('constructor', () => {
    it('should create an AppSignalClient with the provided credentials', () => {
      expect(MockedAppSignalClient).toHaveBeenCalledWith(apiToken, appId);
    });
  });

  // Note: Testing the actual MCP server functionality would require more complex
  // mocking of the MCP SDK. In a real-world scenario, you would use integration
  // tests with the MCP Inspector to verify the server's behavior.
});
