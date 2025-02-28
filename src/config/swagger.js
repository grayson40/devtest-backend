const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevTest API Documentation',
      version: '1.0.0',
      description: 'API documentation for DevTest - Test Automation Platform',
    },
    components: {
      schemas: {
        Ticket: {
          type: 'object',
          required: ['ticketId', 'title'],
          properties: {
            ticketId: {
              type: 'string',
              description: 'Unique ticket identifier (e.g., PROJ-123)',
              example: 'TEST-456',
            },
            title: {
              type: 'string',
              description: 'Ticket title',
              example: 'Implement login flow tests',
            },
            description: {
              type: 'string',
              description: 'Detailed ticket description',
              example: 'Create automated tests for the new login flow',
            },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
              default: 'open',
              description: 'Current ticket status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              default: 'medium',
              description: 'Ticket priority level',
            },
            testCases: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Test case ID',
              },
              description: 'Array of linked test case IDs',
            },
            metadata: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  enum: ['jira', 'manual'],
                  default: 'manual',
                },
                url: {
                  type: 'string',
                },
                assignee: {
                  type: 'string',
                },
                reporter: {
                  type: 'string',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message details',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Tickets',
        description: 'Ticket management endpoints',
      },
    ],
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
