/**
 * AI Prompt Templates for Growth Autopilot
 *
 * These prompts are used with Claude API to generate:
 * - Audit analyses
 * - Test recommendations
 * - Competitor insights
 * - Benchmark comparisons
 */

const AUTOPILOT_PROMPTS = {

  // 1. AUDIT ANALYSIS
  AUDIT: `You are a mobile app monetization expert. Analyze this app's performance.

**App Data:**
- Category: {category}
- Current pricing: {pricing}
- Trial strategy: {trial}
- Key metrics: {metrics}

**Competitor Data:**
{competitors}

**Benchmarks (Industry):**
{benchmarks}

Provide a comprehensive audit:

1. **Overall Score** (0-100): Rate overall monetization health
2. **Strengths** (3-4 items):
   - Area (e.g., "Pricing Strategy")
   - Description (what's working well)
   - Score (0-100)
3. **Weaknesses** (3-4 items):
   - Area
   - Description (what needs improvement)
   - Score (0-100)
4. **Opportunities** (4-6 items):
   - Area
   - Description (specific action to take)
   - Expected Impact (low/medium/high)

Be specific and data-driven. Reference competitors and benchmarks.

Return as JSON:
\`\`\`json
{
  "overallScore": 75,
  "strengths": [
    {
      "area": "string",
      "description": "string",
      "score": 85
    }
  ],
  "weaknesses": [
    {
      "area": "string",
      "description": "string",
      "score": 45
    }
  ],
  "opportunities": [
    {
      "area": "string",
      "description": "string",
      "expectedImpact": "high"
    }
  ]
}
\`\`\``,

  // 2. TEST RECOMMENDATIONS
  RECOMMENDATIONS: `Generate 6-8 high-impact A/B test recommendations.

**Current State:**
- Pricing: {pricing}
- Trial: {trial}
- Conversion rate: {conversionRate}
- ARPU: {arpu}

**Top Competitors:**
{topCompetitors}

**Benchmarks:**
{benchmarks}

**Past Test Results:**
{pastTests}

For each recommendation:
1. **Test Type**: pricing / trial / element / positioning
2. **Hypothesis**: Clear statement of what we expect
3. **Description**: What to test (1 sentence)
4. **Current Value**: What we have now
5. **Suggested Value**: What to test
6. **Rationale**: WHY this will work (reference data)
7. **Priority Score** (0-100): Based on expected ROI
8. **Expected Impact**: low / medium / high
9. **Confidence** (0-1): Based on data quality
10. **Sample Size**: Minimum users needed
11. **Duration**: Estimated days to significance

**Focus areas:**
- Pricing tests (if significantly different from competitors/benchmarks)
- Trial duration optimization
- Annual vs monthly positioning
- Free trial vs paid trial

Be conservative. Only recommend tests with solid rationale.

Return as JSON array:
\`\`\`json
[
  {
    "testType": "pricing",
    "hypothesis": "string",
    "description": "string",
    "currentValue": {},
    "suggestedValue": {},
    "rationale": "string",
    "priorityScore": 85,
    "expectedImpact": "high",
    "confidence": 0.8,
    "sampleSize": 1000,
    "duration": 14,
    "dataSources": ["competitor_analysis", "benchmark_p75"]
  }
]
\`\`\``,

  // 3. COMPETITOR INSIGHTS
  COMPETITOR_ANALYSIS: `Analyze these competitor paywalls and extract insights.

**Competitors:**
{competitors}

Extract:
1. **Pricing Patterns**:
   - Median pricing for each tier (weekly/monthly/yearly)
   - Most common trial strategy
   - Premium vs budget positioning

2. **Design Patterns**:
   - Common elements (testimonials, feature lists, urgency)
   - Layout patterns
   - Visual styles

3. **Positioning Strategies**:
   - Which plan is highlighted?
   - Value proposition approach
   - CTA strategies

4. **Opportunities**:
   - What are competitors NOT doing?
   - What could we test based on outliers?

Return structured insights with specific examples.

Return as JSON:
\`\`\`json
{
  "pricingPatterns": {
    "medianWeekly": 9.99,
    "medianMonthly": 29.99,
    "medianYearly": 99.99,
    "mostCommonTrial": "7_day_free",
    "positioning": "mid_market"
  },
  "designPatterns": {
    "commonElements": ["social_proof", "feature_comparison", "money_back_guarantee"],
    "layoutPattern": "card_stack",
    "urgency": "limited_time_offer"
  },
  "positioningStrategies": {
    "highlightedPlan": "yearly",
    "valueProposition": "cost_per_day",
    "ctaStrategy": "start_free_trial"
  },
  "opportunities": [
    {
      "gap": "string",
      "recommendation": "string",
      "expectedImpact": "medium"
    }
  ]
}
\`\`\``,

  // 4. BENCHMARK INSIGHTS
  BENCHMARK_ANALYSIS: `Compare this app to industry benchmarks.

**App Metrics:**
{appMetrics}

**Benchmarks:**
{benchmarks}

For each key metric:
1. Percentile rank (where app stands)
2. Gap analysis (how far from median/p75)
3. Specific action (if below median, what to do)
4. Expected improvement (realistic estimate)

Focus on: conversion_rate, trial_conversion, arpu, retention_d7, retention_d30

Be specific and actionable.

Return as JSON:
\`\`\`json
{
  "metrics": [
    {
      "name": "conversion_rate",
      "appValue": 3.5,
      "benchmarkMedian": 4.2,
      "benchmarkP75": 6.8,
      "percentileRank": 35,
      "gap": -0.7,
      "gapPercent": -16.7,
      "action": "Add social proof and simplify checkout",
      "expectedImprovement": 1.2,
      "priority": "high"
    }
  ],
  "overallRanking": "below_median",
  "topPriorities": [
    "Improve conversion rate",
    "Optimize trial conversion"
  ]
}
\`\`\``,

  // 5. PATTERN NARRATIVE GENERATION
  PATTERN_NARRATIVE: `Generate an insight narrative from this detected pattern.

**Pattern Data:**
{pattern}

**Related Psychology Principles:**
{principles}

Create:
1. **Title**: Catchy, actionable (max 60 chars)
2. **Description**: Clear explanation of what's happening (2-3 sentences)
3. **Recommendation**: Specific action to take (1-2 sentences)
4. **Evidence**: Key data points that support this (bullet points)
5. **Psychology**: How psychology principles apply

Make it actionable and compelling.

Return as JSON:
\`\`\`json
{
  "title": "string",
  "description": "string",
  "recommendation": "string",
  "evidence": ["string", "string"],
  "psychologyGrounding": "string",
  "category": "conversion|retention|engagement",
  "targetSegment": "string",
  "impactScore": 75,
  "confidenceLevel": "high"
}
\`\`\``
};

module.exports = { AUTOPILOT_PROMPTS };
