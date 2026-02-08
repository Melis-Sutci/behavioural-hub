const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Behavioural Hub API',
      version: '1.0.0',
      description: `
# Behavioural Hub API Documentation

A comprehensive behavioral insights and A/B testing platform for mobile applications.

## Features

- 🧠 **Behavioral Insights Management** - Track and manage psychological insights
- 🧪 **A/B Testing** - Complete experiment management with variant assignment
- 👥 **User Segmentation** - Advanced rule-based user segmentation
- 📊 **Analytics** - Comprehensive analytics and reporting
- 🔒 **Authentication** - JWT-based authentication with API keys
- ⚙️ **Settings Management** - Centralized configuration system

## Authentication

This API uses JWT (JSON Web Token) for authentication. To access protected endpoints:

1. Register a new account or login at \`/api/auth/register\` or \`/api/auth/login\`
2. Use the returned token in the Authorization header:
   \`\`\`
   Authorization: Bearer YOUR_JWT_TOKEN
   \`\`\`
3. Alternatively, use an API key in the X-API-Key header:
   \`\`\`
   X-API-Key: YOUR_API_KEY
   \`\`\`

## Rate Limiting

- General API endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Headers include rate limit information

## Error Responses

All error responses follow this format:
\`\`\`json
{
  "success": false,
  "error": "Error message description"
}
\`\`\`

Common HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
      `,
      contact: {
        name: 'API Support',
        email: 'support@behavioural-hub.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      },
      {
        url: 'https://api.behavioural-hub.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /api/auth/login'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for programmatic access'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Please provide a valid email address'
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            full_name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer'],
              example: 'user'
            }
          }
        },
        Insight: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'Social Proof increases conversions'
            },
            description: {
              type: 'string',
              example: 'Users are more likely to complete purchase when seeing other users activities'
            },
            psychology_principle: {
              type: 'string',
              example: 'Social Proof'
            },
            target_segment: {
              type: 'string',
              example: 'New Users'
            },
            business_impact: {
              type: 'string',
              example: 'Increased conversion rate'
            },
            implementation_complexity: {
              type: 'string',
              enum: ['Low', 'Medium', 'High'],
              example: 'Medium'
            },
            impact_score: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              example: 8
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Under Review', 'Approved', 'Implemented', 'Archived'],
              example: 'Approved'
            },
            discovery_date: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            tags: {
              type: 'string',
              example: 'conversion,social-proof,mobile'
            },
            notes: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Experiment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Button Color Test'
            },
            description: {
              type: 'string',
              example: 'Testing different button colors for conversion'
            },
            hypothesis: {
              type: 'string',
              example: 'Green buttons will have higher conversion than blue'
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Running', 'Paused', 'Completed', 'Cancelled'],
              example: 'Running'
            },
            start_date: {
              type: 'string',
              format: 'date-time'
            },
            end_date: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            success_metric: {
              type: 'string',
              example: 'conversion_rate'
            }
          }
        },
        Segment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Premium Users'
            },
            description: {
              type: 'string',
              example: 'Users with premium subscription'
            },
            rules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trait: {
                    type: 'string',
                    example: 'subscription_type'
                  },
                  operator: {
                    type: 'string',
                    enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in'],
                    example: 'equals'
                  },
                  value: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'number' },
                      { type: 'boolean' },
                      { type: 'array' }
                    ],
                    example: 'premium'
                  }
                }
              }
            },
            is_active: {
              type: 'boolean',
              example: true
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        apiKeyAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Insights',
        description: 'Behavioral insights management'
      },
      {
        name: 'Experiments',
        description: 'A/B testing and experiments'
      },
      {
        name: 'Segments',
        description: 'User segmentation'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting'
      },
      {
        name: 'Settings',
        description: 'Application settings'
      },
      {
        name: 'Knowledge Base',
        description: 'Psychology principles and sources'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
