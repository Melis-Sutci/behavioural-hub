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
\`\`\``,

  // 6. PAYWALL DESIGN GENERATION
  PAYWALL_DESIGN_GENERATE: `You are an expert paywall designer specializing in mobile app monetization.

**Context:**
- Category: {category}
- Target Segment: {targetSegment} ({segmentDescription})
- Objective: {objective}
- App Context: {appContext}

**User Persona:**
{userPersona}

**Competitor Paywalls:**
{competitors}

**Benchmarks:**
{benchmarks}

**Seasonal/Campaign Context:**
{seasonalContext}

**Design Requirements:**
Generate 3 distinct paywall designs optimized for {objective}. Each should:
1. Target the specific user persona's psychology
2. Apply proven conversion principles
3. Stand out from competitors while following best practices
4. Be culturally appropriate (if seasonal event specified)

**For Each Design, Provide:**

1. **Layout Structure:**
   - Element order (hero, features, pricing, social proof, CTA)
   - Visual hierarchy
   - Spacing and positioning
   - Screen sections (header, body, footer)

2. **Copy Configuration:**
   - Headline (emotional hook based on persona)
   - Subheadline (value proposition)
   - Feature highlights (3-5 items, persona-specific)
   - Social proof elements (testimonials, user counts, ratings)
   - CTA button text (action-oriented)
   - Microcopy (trial terms, guarantees)

3. **Pricing Display:**
   - Which plans to show (weekly/monthly/yearly/lifetime)
   - Price positioning (cost per day, savings percentage)
   - Default selection
   - Trial emphasis strategy
   - Discount/offer presentation (if seasonal)

4. **Visual Theme:**
   - Color scheme (primary, secondary, accent)
   - Typography style
   - Background type (gradient, image, solid)
   - Iconography style
   - Cultural elements (if seasonal)

5. **Psychology Principles Applied:**
   - Which cognitive biases used (scarcity, social proof, anchoring, etc.)
   - Personalization elements
   - Urgency tactics
   - Trust signals

6. **Design Rationale:**
   - Why this design will convert the target segment
   - How it differs from competitors
   - Expected performance vs current baseline

**Return 3 complete paywall designs:**

\`\`\`json
{
  "designs": [
    {
      "name": "string (e.g., 'Social Proof Hero')",
      "description": "string (one-sentence summary)",
      "layoutStructure": {
        "sections": [
          {
            "section": "header",
            "elements": ["logo", "skip_button"],
            "positioning": "top",
            "height": "10%"
          },
          {
            "section": "hero",
            "elements": ["headline", "subheadline", "hero_image"],
            "positioning": "top",
            "height": "25%"
          }
        ],
        "visualHierarchy": "headline > pricing > cta > features",
        "scrollable": false
      },
      "copyConfig": {
        "headline": "string (max 60 chars, emotional)",
        "subheadline": "string (max 120 chars, value prop)",
        "features": [
          {
            "icon": "checkmark",
            "text": "string",
            "emphasis": "high|medium|low"
          }
        ],
        "socialProof": {
          "type": "testimonials|user_count|rating|awards",
          "content": "string",
          "prominence": "high|medium|low"
        },
        "cta": {
          "primary": "string (button text)",
          "secondary": "string (e.g., 'Maybe later')"
        },
        "microcopy": {
          "trial": "string (e.g., 'Cancel anytime')",
          "guarantee": "string (e.g., '30-day money back')",
          "terms": "string (link text)"
        }
      },
      "pricingDisplay": {
        "plansShown": ["yearly", "monthly", "weekly"],
        "defaultSelection": "yearly",
        "displayStyle": "cards|list|toggle",
        "pricePresentation": {
          "showOriginalPrice": true,
          "showSavings": true,
          "showCostPerDay": true,
          "showTrialFirst": true
        },
        "discountBadge": {
          "show": true,
          "text": "string (e.g., '50% OFF')",
          "style": "urgent|elegant|subtle"
        },
        "planHighlights": {
          "yearly": "Most popular",
          "monthly": null,
          "weekly": null
        }
      },
      "visualTheme": {
        "colorScheme": {
          "primary": "#hexcode",
          "secondary": "#hexcode",
          "accent": "#hexcode",
          "background": "#hexcode",
          "text": "#hexcode"
        },
        "typography": {
          "headlineFont": "font-family",
          "bodyFont": "font-family",
          "headlineSize": "32px",
          "bodySize": "16px",
          "headlineWeight": "bold|semibold|regular"
        },
        "background": {
          "type": "gradient|image|solid|video",
          "value": "string (color/url)",
          "overlay": "rgba(0,0,0,0.3)"
        },
        "iconStyle": "minimal|detailed|illustrated",
        "culturalElements": [
          "string (e.g., 'crescent moon for Ramadan')"
        ]
      },
      "psychologyPrinciples": [
        {
          "principle": "scarcity|social_proof|anchoring|loss_aversion|reciprocity",
          "application": "string (how it's used in design)",
          "targetedAt": "detective|victim|passive"
        }
      ],
      "personalization": {
        "segmentAlignment": "string (how it targets the persona)",
        "emotionalTriggers": ["string"],
        "valueFraming": "string (time-saving|cost-saving|status|safety)"
      },
      "rationale": "string (2-3 sentences: why this will convert)",
      "competitorDifferentiation": "string (how it differs from competitors)",
      "expectedPerformance": {
        "conversionLift": "15-25%",
        "confidence": "high|medium|low"
      }
    }
  ],
  "recommendation": "string (which design to start with and why)",
  "testingStrategy": "string (how to A/B test these 3 designs)"
}
\`\`\``,

  // 7. PAYWALL REFINEMENT (Chat-based)
  PAYWALL_REFINE: `You are refining a paywall design based on user feedback.

**Current Design:**
{currentDesign}

**User Feedback:**
"{userFeedback}"

**Context:**
- Target Segment: {targetSegment}
- Objective: {objective}

**Task:**
Apply the user's requested changes while maintaining conversion best practices.

**Common Refinement Types:**
- Copy changes (headline, CTA, features)
- Layout adjustments (element order, emphasis)
- Pricing display (which plans, how to show)
- Visual theme (colors, fonts)
- Psychology tactics (add urgency, social proof)

**Generate 3 refined versions** that incorporate the feedback in different ways.

Return same JSON structure as PAYWALL_DESIGN_GENERATE with "designs" array containing 3 refined versions.

**Important:**
- Explain what changed and why
- Keep conversion principles intact
- Show trade-offs if feedback conflicts with best practices`,

  // 8. SEASONAL PAYWALL GENERATION
  PAYWALL_SEASONAL: `Generate paywalls optimized for a seasonal event or campaign.

**Event Details:**
- Event Type: {eventType}
- Country/Region: {country}
- Start Date: {startDate}
- End Date: {endDate}

**Cultural Context:**
{culturalContext}

**Campaign Specifics:**
- Discount: {discount}
- Special Pricing: {specialPricing}
- Urgency Level: {urgencyLevel}

**Competitor Seasonal Campaigns:**
{competitorSeasonalCampaigns}

**Design Requirements:**
Create 3 paywall designs that:
1. Honor cultural significance of the event
2. Create appropriate urgency (based on urgency level)
3. Highlight limited-time nature
4. Use culturally appropriate visuals and messaging

**Cultural Considerations:**
- For Ramadan: Emphasize charity, reflection, community, sunset timing
- For Diwali: Focus on prosperity, new beginnings, light over darkness
- For Black Friday: Aggressive urgency, scarcity, savings emphasis
- For New Year: Fresh start, goals, transformation
- For Christmas: Gift-giving, family, celebration

Return same JSON structure as PAYWALL_DESIGN_GENERATE with additional fields:
- "urgencyElements": array of urgency tactics used
- "culturalSensitivity": how design respects cultural context
- "countdownTimer": configuration if applicable`,

  // 9. PAYWALL COPY OPTIMIZATION
  PAYWALL_COPY_OPTIMIZE: `Optimize paywall copy for maximum conversion.

**Current Copy:**
{currentCopy}

**Target Persona:**
{persona}

**Context:**
- Conversion Goal: {goal}
- Current Conversion Rate: {currentRate}
- Pain Points: {painPoints}

**Optimization Focus:**
Generate 3 variations optimizing for:
1. **Emotional Resonance** - Connect with persona's desires/fears
2. **Clarity & Simplicity** - Remove friction, make value obvious
3. **Urgency & FOMO** - Create scarcity and time pressure

**For Each Variation:**
- Headline (A/B/C versions)
- Subheadline
- Feature bullets (reframe benefits)
- CTA button text
- Social proof copy
- Urgency messaging

**Psychology Principles to Apply:**
- Loss aversion (what they'll miss)
- Social proof (others are doing it)
- Anchoring (price positioning)
- Reciprocity (what they get)

Return JSON:
\`\`\`json
{
  "variations": [
    {
      "name": "Emotional Resonance",
      "headline": "string",
      "subheadline": "string",
      "features": ["string"],
      "cta": "string",
      "socialProof": "string",
      "urgency": "string",
      "psychologyUsed": ["loss_aversion", "social_proof"],
      "rationale": "string"
    }
  ]
}
\`\`\``,

  // 10. PAYWALL PRICING STRATEGY
  PAYWALL_PRICING_OPTIMIZE: `Optimize pricing strategy and presentation for maximum revenue.

**Current Pricing:**
{currentPricing}

**Competitor Pricing:**
{competitorPricing}

**Benchmarks:**
{benchmarks}

**App Metrics:**
- ARPU: {arpu}
- Conversion Rate: {conversionRate}
- LTV by Plan: {ltvByPlan}

**Optimization Goal:** {goal} (maximize_revenue|maximize_conversions|maximize_ltv)

**Generate 3 Pricing Strategies:**

1. **Premium Positioning** - Higher prices, emphasis on value
2. **Volume Play** - Lower prices, maximize conversions
3. **Balanced Optimization** - Data-driven sweet spot

**For Each Strategy:**
- Recommended prices (weekly/monthly/yearly)
- Plan positioning (which to highlight)
- Discount structure
- Trial strategy
- Price anchoring tactics
- Display recommendations

Return JSON:
\`\`\`json
{
  "strategies": [
    {
      "name": "string",
      "pricing": {
        "weekly": 9.99,
        "monthly": 29.99,
        "yearly": 199.99
      },
      "planHighlight": "yearly",
      "trialStrategy": {
        "duration": 7,
        "type": "free",
        "emphasis": "high"
      },
      "displayRecommendations": {
        "showSavings": true,
        "showCostPerDay": true,
        "anchorPlan": "yearly",
        "discountBadge": "50% OFF"
      },
      "psychologyTactics": ["anchoring", "decoy_pricing"],
      "expectedImpact": {
        "conversionChange": "+15%",
        "arpuChange": "+25%",
        "ltvChange": "+30%"
      },
      "rationale": "string",
      "risks": ["string"]
    }
  ],
  "recommendation": "string"
}
\`\`\``
};

module.exports = { AUTOPILOT_PROMPTS };
