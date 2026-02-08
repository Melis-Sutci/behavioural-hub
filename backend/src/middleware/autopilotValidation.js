/**
 * Autopilot API Validation Middleware
 *
 * Validates request bodies for autopilot endpoints
 */

const Joi = require('joi');

/**
 * Audit request validation schema
 */
const auditSchema = Joi.object({
  category: Joi.string().required().min(2).max(50),
  pricing: Joi.object({
    weekly: Joi.number().min(0),
    monthly: Joi.number().min(0),
    yearly: Joi.number().min(0),
    lifetime: Joi.number().min(0)
  }).required(),
  trial: Joi.object({
    duration: Joi.number().integer().min(0).max(365),
    type: Joi.string().valid('free', 'paid', 'none')
  }),
  metrics: Joi.object({
    conversion_rate: Joi.number().min(0).max(1),
    arpu: Joi.number().min(0),
    retention_d7: Joi.number().min(0).max(1),
    retention_d30: Joi.number().min(0).max(1)
  }).required()
});

/**
 * Recommendations request validation schema
 */
const recommendationsSchema = Joi.object({
  category: Joi.string().required().min(2).max(50),
  pricing: Joi.object({
    weekly: Joi.number().min(0),
    monthly: Joi.number().min(0),
    yearly: Joi.number().min(0),
    lifetime: Joi.number().min(0)
  }).required(),
  trial: Joi.object({
    duration: Joi.number().integer().min(0).max(365),
    type: Joi.string().valid('free', 'paid', 'none')
  }),
  metrics: Joi.object({
    conversion_rate: Joi.number().min(0).max(1),
    arpu: Joi.number().min(0)
  }).required(),
  pastTests: Joi.array().items(Joi.object())
});

/**
 * Competitor creation validation schema
 */
const competitorSchema = Joi.object({
  app_name: Joi.string().required().min(2).max(100),
  bundle_id: Joi.string().max(100),
  category: Joi.string().required().min(2).max(50),
  country: Joi.string().length(2).default('US'),
  pricing_weekly: Joi.number().min(0),
  pricing_monthly: Joi.number().min(0),
  pricing_yearly: Joi.number().min(0),
  pricing_lifetime: Joi.number().min(0),
  trial_duration: Joi.number().integer().min(0).max(365),
  trial_type: Joi.string().valid('free', 'paid', 'none'),
  paywall_screenshot_url: Joi.string().uri(),
  paywall_template: Joi.string().max(50),
  paywall_elements: Joi.array(),
  notes: Joi.string().max(1000),
  market_position: Joi.string().valid('premium', 'mid', 'budget')
});

/**
 * Churn prediction request validation schema
 */
const churnPredictionSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).max(1000).required()
});

/**
 * LTV prediction request validation schema
 */
const ltvPredictionSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).max(1000).required()
});

/**
 * Clustering request validation schema
 */
const clusteringSchema = Joi.object({
  k: Joi.number().integer().min(2).max(20).default(5),
  features: Joi.array().items(Joi.string())
});

/**
 * Pattern detection request validation schema
 */
const patternDetectionSchema = Joi.object({
  timeWindow: Joi.string().valid('7d', '14d', '30d', '90d').default('7d')
});

/**
 * Generic validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = {
  validateAudit: validate(auditSchema),
  validateRecommendations: validate(recommendationsSchema),
  validateCompetitor: validate(competitorSchema),
  validateChurnPrediction: validate(churnPredictionSchema),
  validateLtvPrediction: validate(ltvPredictionSchema),
  validateClustering: validate(clusteringSchema),
  validatePatternDetection: validate(patternDetectionSchema)
};
