const Joi = require('joi');

/**
 * Validation Middleware Factory
 * Creates middleware that validates request body/query/params against a Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Get all errors, not just the first
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    // Replace request data with validated (and sanitized) data
    req[property] = value;
    next();
  };
};

// Auth Schemas
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().lowercase().trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    full_name: Joi.string().min(2).max(100).required().trim()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'any.required': 'Full name is required'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().required()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  })
};

// Insight Schemas
const insightSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required().trim(),
    description: Joi.string().min(10).max(2000).required().trim(),
    psychology_principle: Joi.string().min(3).max(100).required().trim(),
    target_segment: Joi.string().max(100).allow('', null).trim(),
    business_impact: Joi.string().max(100).allow('', null).trim(),
    implementation_complexity: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
    impact_score: Joi.number().integer().min(1).max(10).default(5),
    status: Joi.string().valid('Draft', 'Under Review', 'Approved', 'Implemented', 'Archived').default('Draft'),
    discovery_date: Joi.date().iso().default(() => new Date()),
    tags: Joi.string().allow('', null),
    notes: Joi.string().allow('', null).max(5000)
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    description: Joi.string().min(10).max(2000).trim(),
    psychology_principle: Joi.string().min(3).max(100).trim(),
    target_segment: Joi.string().max(100).allow('', null).trim(),
    business_impact: Joi.string().max(100).allow('', null).trim(),
    implementation_complexity: Joi.string().valid('Low', 'Medium', 'High'),
    impact_score: Joi.number().integer().min(1).max(10),
    status: Joi.string().valid('Draft', 'Under Review', 'Approved', 'Implemented', 'Archived'),
    discovery_date: Joi.date().iso(),
    tags: Joi.string().allow('', null),
    notes: Joi.string().allow('', null).max(5000)
  }).min(1) // At least one field must be present
};

// Experiment Schemas
const experimentSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().min(10).max(2000).required().trim(),
    hypothesis: Joi.string().min(10).max(1000).required().trim(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null),
    status: Joi.string().valid('Draft', 'Running', 'Paused', 'Completed', 'Cancelled').default('Draft'),
    success_metric: Joi.string().max(100).allow('', null).trim(),
    variants: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(100).required().trim(),
      description: Joi.string().max(1000).allow('', null).trim(),
      traffic_percentage: Joi.number().min(0).max(100).required()
    })).min(2).required()
      .messages({
        'array.min': 'At least 2 variants are required'
      })
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(200).trim(),
    description: Joi.string().min(10).max(2000).trim(),
    hypothesis: Joi.string().min(10).max(1000).trim(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    status: Joi.string().valid('Draft', 'Running', 'Paused', 'Completed', 'Cancelled'),
    success_metric: Joi.string().max(100).allow('', null).trim()
  }).min(1)
};

// Event Tracking Schema
const eventSchemas = {
  track: Joi.object({
    user_id: Joi.string().max(255).required().trim(),
    event_name: Joi.string().min(1).max(100).required().trim(),
    properties: Joi.object().default({}),
    timestamp: Joi.date().iso().default(() => new Date())
  })
};

// Segment Schemas
const segmentSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    description: Joi.string().max(500).allow('', null).trim(),
    rules: Joi.array().items(Joi.object({
      trait: Joi.string().required(),
      operator: Joi.string().valid('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array()).required()
    })).min(1).required(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    description: Joi.string().max(500).allow('', null).trim(),
    rules: Joi.array().items(Joi.object({
      trait: Joi.string().required(),
      operator: Joi.string().valid('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array()).required()
    })).min(1),
    is_active: Joi.boolean()
  }).min(1)
};

// Settings Schema
const settingsSchemas = {
  update: Joi.object({
    category: Joi.string().max(50).required(),
    key: Joi.string().max(100).required(),
    value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required()
  })
};

// ID Parameter Schema
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  validate,
  authSchemas,
  insightSchemas,
  experimentSchemas,
  eventSchemas,
  segmentSchemas,
  settingsSchemas,
  idSchema
};
