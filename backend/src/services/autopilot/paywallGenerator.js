/**
 * Paywall Generator Service
 *
 * AI-powered paywall design generation with:
 * - 3 paywall variants per generation
 * - Chat-based refinement
 * - Seasonal campaign support
 * - Persona-based personalization
 * - Copy and pricing optimization
 */

const Anthropic = require('@anthropic-ai/sdk');
const { AUTOPILOT_PROMPTS } = require('./prompts');
const { generateId } = require('../../utils/helpers');

class PaywallGenerator {
  constructor(db) {
    this.db = db;

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set. Paywall Generator will not work.');
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.anthropic !== null;
  }

  /**
   * Generate new paywall designs
   */
  async generatePaywalls(params) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    const {
      category = 'General',
      targetSegment = 'all',
      objective = 'maximize_conversions',
      appContext = {},
      seasonalContext = null,
      sessionId = null
    } = params;

    // Get user persona description
    const personaDescription = this.getPersonaDescription(targetSegment);

    // Get competitors
    const competitors = this.db.all(`
      SELECT * FROM competitors
      WHERE category = ?
      ORDER BY market_position DESC
      LIMIT 5
    `, [category]);

    // Get benchmarks
    const benchmarks = this.db.all(`
      SELECT * FROM benchmarks
      WHERE category = ?
    `, [category]);

    // Format prompt
    const prompt = AUTOPILOT_PROMPTS.PAYWALL_DESIGN_GENERATE
      .replace('{category}', category)
      .replace('{targetSegment}', targetSegment)
      .replace('{segmentDescription}', personaDescription.description)
      .replace('{objective}', objective)
      .replace('{appContext}', JSON.stringify(appContext, null, 2))
      .replace('{userPersona}', JSON.stringify(personaDescription, null, 2))
      .replace('{competitors}', this.formatCompetitors(competitors))
      .replace('{benchmarks}', this.formatBenchmarks(benchmarks))
      .replace('{seasonalContext}', seasonalContext ? JSON.stringify(seasonalContext, null, 2) : 'None');

    console.log('🎨 Generating paywall designs with Claude API...');
    const startTime = Date.now();

    // Call Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.6, // Higher for creative designs
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const processingTime = Date.now() - startTime;
    const result = this.parseJsonResponse(response);

    // Save generation to database
    const generationId = generateId();
    this.db.run(`
      INSERT INTO paywall_generations (
        id, session_id, generation_type, input_prompt, input_parameters,
        model_used, temperature, tokens_used, processing_time_ms,
        output_templates, ai_explanation, design_principles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      generationId,
      sessionId,
      seasonalContext ? 'seasonal' : 'new_design',
      prompt.substring(0, 500) + '...',
      JSON.stringify(params),
      'claude-sonnet-4-5-20250929',
      0.6,
      response.usage.input_tokens + response.usage.output_tokens,
      processingTime,
      JSON.stringify(result.designs),
      result.recommendation || '',
      result.testingStrategy || ''
    ]);

    // Save each design as a template
    const templateIds = [];
    for (const design of result.designs) {
      const templateId = await this.saveTemplate({
        design,
        generationId,
        targetSegment,
        seasonalContext,
        competitorReferences: competitors.map(c => c.id)
      });
      templateIds.push(templateId);
    }

    console.log(`✅ Generated ${result.designs.length} paywall designs in ${processingTime}ms`);

    return {
      generationId,
      templateIds,
      designs: result.designs,
      recommendation: result.recommendation,
      testingStrategy: result.testingStrategy
    };
  }

  /**
   * Refine existing paywall based on user feedback
   */
  async refinePaywall(params) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available.');
    }

    const {
      templateId,
      userFeedback,
      targetSegment,
      objective,
      sessionId
    } = params;

    // Get current design
    const template = this.db.get(`
      SELECT * FROM paywall_templates WHERE id = ?
    `, [templateId]);

    if (!template) {
      throw new Error('Template not found');
    }

    const currentDesign = {
      layoutStructure: JSON.parse(template.layout_config),
      copyConfig: JSON.parse(template.copy_config),
      pricingDisplay: JSON.parse(template.pricing_display),
      visualTheme: JSON.parse(template.visual_config || '{}')
    };

    // Format prompt
    const prompt = AUTOPILOT_PROMPTS.PAYWALL_REFINE
      .replace('{currentDesign}', JSON.stringify(currentDesign, null, 2))
      .replace('{userFeedback}', userFeedback)
      .replace('{targetSegment}', targetSegment)
      .replace('{objective}', objective);

    console.log('🔄 Refining paywall with user feedback...');
    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const processingTime = Date.now() - startTime;
    const result = this.parseJsonResponse(response);

    // Save refined designs as new templates
    const templateIds = [];
    for (const design of result.designs) {
      const newTemplateId = await this.saveTemplate({
        design,
        generationId: null,
        targetSegment,
        competitorReferences: [],
        refinedFrom: templateId
      });
      templateIds.push(newTemplateId);
    }

    console.log(`✅ Refined ${result.designs.length} variants in ${processingTime}ms`);

    return {
      templateIds,
      designs: result.designs
    };
  }

  /**
   * Generate seasonal campaign paywalls
   */
  async generateSeasonalPaywall(params) {
    const {
      eventType,
      country,
      startDate,
      endDate,
      discount,
      urgencyLevel,
      targetSegment = 'all',
      category
    } = params;

    // Get cultural context for the event
    const culturalContext = this.getCulturalContext(eventType, country);

    // Get competitor seasonal campaigns (if any)
    const competitorSeasonalCampaigns = this.db.all(`
      SELECT * FROM seasonal_campaigns
      WHERE event_type = ? AND status = 'completed'
      ORDER BY total_revenue DESC
      LIMIT 3
    `, [eventType]);

    const prompt = AUTOPILOT_PROMPTS.PAYWALL_SEASONAL
      .replace('{eventType}', eventType)
      .replace('{country}', country)
      .replace('{startDate}', startDate)
      .replace('{endDate}', endDate)
      .replace('{culturalContext}', JSON.stringify(culturalContext, null, 2))
      .replace('{discount}', discount || 'None')
      .replace('{specialPricing}', 'Standard')
      .replace('{urgencyLevel}', urgencyLevel)
      .replace('{competitorSeasonalCampaigns}', JSON.stringify(competitorSeasonalCampaigns, null, 2));

    console.log(`🎉 Generating seasonal paywall for ${eventType}...`);
    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.6,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const processingTime = Date.now() - startTime;
    const result = this.parseJsonResponse(response);

    // Create seasonal campaign
    const campaignId = generateId();
    this.db.run(`
      INSERT INTO seasonal_campaigns (
        id, name, description, event_type, event_country,
        start_date, end_date, discount_percentage, urgency_level,
        target_countries, target_segments, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      campaignId,
      `${eventType} Campaign ${new Date().getFullYear()}`,
      `Seasonal paywall campaign for ${eventType}`,
      eventType,
      country,
      startDate,
      endDate,
      discount || 0,
      urgencyLevel,
      JSON.stringify([country]),
      JSON.stringify([targetSegment]),
      'planned'
    ]);

    // Save designs as templates linked to campaign
    const templateIds = [];
    for (const design of result.designs) {
      const templateId = await this.saveTemplate({
        design,
        generationId: null,
        targetSegment,
        campaignId,
        isSeasonal: true,
        seasonalEvent: eventType,
        activeFrom: startDate,
        activeUntil: endDate
      });
      templateIds.push(templateId);
    }

    // Update campaign with template IDs
    this.db.run(`
      UPDATE seasonal_campaigns
      SET paywall_template_ids = ?
      WHERE id = ?
    `, [JSON.stringify(templateIds), campaignId]);

    console.log(`✅ Generated seasonal campaign in ${processingTime}ms`);

    return {
      campaignId,
      templateIds,
      designs: result.designs
    };
  }

  /**
   * Optimize paywall copy
   */
  async optimizeCopy(params) {
    const { currentCopy, persona, goal, currentRate, painPoints } = params;

    const prompt = AUTOPILOT_PROMPTS.PAYWALL_COPY_OPTIMIZE
      .replace('{currentCopy}', JSON.stringify(currentCopy, null, 2))
      .replace('{persona}', JSON.stringify(persona, null, 2))
      .replace('{goal}', goal)
      .replace('{currentRate}', currentRate || 'Unknown')
      .replace('{painPoints}', JSON.stringify(painPoints, null, 2));

    console.log('📝 Optimizing paywall copy...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7, // Higher for creative copywriting
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseJsonResponse(response);
  }

  /**
   * Optimize pricing strategy
   */
  async optimizePricing(params) {
    const {
      currentPricing,
      competitorPricing,
      benchmarks,
      appMetrics,
      goal = 'maximize_revenue'
    } = params;

    const prompt = AUTOPILOT_PROMPTS.PAYWALL_PRICING_OPTIMIZE
      .replace('{currentPricing}', JSON.stringify(currentPricing, null, 2))
      .replace('{competitorPricing}', JSON.stringify(competitorPricing, null, 2))
      .replace('{benchmarks}', JSON.stringify(benchmarks, null, 2))
      .replace('{arpu}', appMetrics.arpu || 'Unknown')
      .replace('{conversionRate}', appMetrics.conversionRate || 'Unknown')
      .replace('{ltvByPlan}', JSON.stringify(appMetrics.ltvByPlan || {}, null, 2))
      .replace('{goal}', goal);

    console.log('💰 Optimizing pricing strategy...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 10000,
      temperature: 0.4, // Lower for data-driven analysis
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseJsonResponse(response);
  }

  /**
   * Create new chat session
   */
  async createChatSession(params) {
    const {
      objective,
      targetSegment,
      initialPrompt,
      contextData = {}
    } = params;

    const sessionId = generateId();

    this.db.run(`
      INSERT INTO paywall_chat_sessions (
        id, objective, target_segment, initial_prompt, context_data, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      objective,
      targetSegment,
      initialPrompt,
      JSON.stringify(contextData),
      'active'
    ]);

    // Add initial message
    await this.addChatMessage(sessionId, 'user', initialPrompt);

    // Generate initial paywalls
    const result = await this.generatePaywalls({
      ...contextData,
      targetSegment,
      objective,
      sessionId
    });

    // Add AI response
    const assistantMessage = this.formatAssistantMessage(result);
    await this.addChatMessage(sessionId, 'assistant', assistantMessage, {
      generatedTemplates: result.designs
    });

    // Update session
    this.db.run(`
      UPDATE paywall_chat_sessions
      SET generated_templates = ?, total_messages = 2, iterations = 1
      WHERE id = ?
    `, [JSON.stringify(result.templateIds), sessionId]);

    return {
      sessionId,
      ...result
    };
  }

  /**
   * Continue chat session
   */
  async continueChat(sessionId, userMessage, refinementRequest) {
    // Add user message
    await this.addChatMessage(sessionId, 'user', userMessage, {
      refinementRequest
    });

    // Get session
    const session = this.db.get(`
      SELECT * FROM paywall_chat_sessions WHERE id = ?
    `, [sessionId]);

    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    // Get last generated templates
    const lastTemplates = JSON.parse(session.generated_templates || '[]');
    const templateId = lastTemplates[0]; // Use first template as base

    // Refine based on feedback
    const result = await this.refinePaywall({
      templateId,
      userFeedback: userMessage,
      targetSegment: session.target_segment,
      objective: session.objective,
      sessionId
    });

    // Add AI response
    const assistantMessage = this.formatAssistantMessage(result);
    await this.addChatMessage(sessionId, 'assistant', assistantMessage, {
      generatedTemplates: result.designs
    });

    // Update session
    const iterations = session.iterations + 1;
    const totalMessages = session.total_messages + 2;

    this.db.run(`
      UPDATE paywall_chat_sessions
      SET generated_templates = ?, total_messages = ?, iterations = ?, last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(result.templateIds), totalMessages, iterations, sessionId]);

    return result;
  }

  /**
   * Complete chat session
   */
  async completeSession(sessionId, finalTemplateId) {
    this.db.run(`
      UPDATE paywall_chat_sessions
      SET status = 'completed', final_template_id = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [finalTemplateId, sessionId]);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Save paywall template to database
   */
  async saveTemplate(params) {
    const {
      design,
      generationId,
      targetSegment,
      campaignId = null,
      isSeasonal = false,
      seasonalEvent = null,
      activeFrom = null,
      activeUntil = null,
      competitorReferences = [],
      refinedFrom = null
    } = params;

    const templateId = generateId();

    this.db.run(`
      INSERT INTO paywall_templates (
        id, name, description, template_type, target_segment,
        layout_config, copy_config, pricing_display, visual_config,
        created_from, competitor_references, ai_rationale,
        campaign_id, is_seasonal, seasonal_event, active_from, active_until,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      templateId,
      design.name,
      design.description,
      refinedFrom ? 'custom' : (isSeasonal ? 'seasonal' : 'ai_generated'),
      targetSegment,
      JSON.stringify(design.layoutStructure),
      JSON.stringify(design.copyConfig),
      JSON.stringify(design.pricingDisplay),
      JSON.stringify(design.visualTheme || {}),
      refinedFrom || generationId || 'ai_generated',
      JSON.stringify(competitorReferences),
      design.rationale,
      campaignId,
      isSeasonal ? 1 : 0,
      seasonalEvent,
      activeFrom,
      activeUntil,
      'draft'
    ]);

    return templateId;
  }

  /**
   * Add message to chat session
   */
  async addChatMessage(sessionId, role, content, metadata = {}) {
    this.db.run(`
      INSERT INTO paywall_chat_messages (
        session_id, role, content, generated_templates, refinement_request
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      sessionId,
      role,
      content,
      JSON.stringify(metadata.generatedTemplates || null),
      JSON.stringify(metadata.refinementRequest || null)
    ]);
  }

  /**
   * Format assistant message for chat
   */
  formatAssistantMessage(result) {
    let message = `I've generated ${result.designs.length} paywall designs for you:\n\n`;

    result.designs.forEach((design, i) => {
      message += `**${i + 1}. ${design.name}**\n`;
      message += `${design.description}\n\n`;
    });

    if (result.recommendation) {
      message += `\n**Recommendation:** ${result.recommendation}\n`;
    }

    return message;
  }

  /**
   * Get persona description
   */
  getPersonaDescription(segment) {
    const personas = {
      detective: {
        name: 'Detective',
        description: 'Analytical, seeks control, fears being fooled',
        painPoints: ['Lack of control', 'Uncertainty', 'Being manipulated'],
        desires: ['Clarity', 'Evidence', 'Control'],
        copyTone: 'Factual, transparent, data-driven'
      },
      victim: {
        name: 'Victim',
        description: 'Fearful, seeks safety, worries about threats',
        painPoints: ['Danger', 'Vulnerability', 'Lack of protection'],
        desires: ['Safety', 'Security', 'Protection'],
        copyTone: 'Reassuring, protective, empathetic'
      },
      passive: {
        name: 'Passive',
        description: 'Seeks ease, avoids effort, wants simplicity',
        painPoints: ['Complexity', 'Effort', 'Friction'],
        desires: ['Simplicity', 'Ease', 'Convenience'],
        copyTone: 'Simple, effortless, quick'
      },
      all: {
        name: 'General',
        description: 'Broad audience, mixed motivations',
        painPoints: ['Various'],
        desires: ['Value', 'Quality', 'Results'],
        copyTone: 'Balanced, clear, benefit-focused'
      }
    };

    return personas[segment] || personas.all;
  }

  /**
   * Get cultural context for seasonal events
   */
  getCulturalContext(eventType, country) {
    const contexts = {
      ramadan: {
        significance: 'Holy month of fasting, prayer, and charity in Islam',
        timing: 'Ninth month of Islamic calendar, varies by year',
        themes: ['Spiritual reflection', 'Charity', 'Community', 'Gratitude'],
        colors: ['Green', 'Gold', 'White'],
        symbols: ['Crescent moon', 'Stars', 'Lanterns'],
        messaging: 'Focus on giving, self-improvement, and blessings',
        urgency: 'Limited time during blessed month',
        regions: ['MENA', 'Southeast Asia', 'South Asia']
      },
      diwali: {
        significance: 'Festival of lights in Hinduism, symbolizing victory of light over darkness',
        timing: 'October/November',
        themes: ['Prosperity', 'New beginnings', 'Light', 'Joy'],
        colors: ['Orange', 'Red', 'Gold', 'Purple'],
        symbols: ['Diyas (lamps)', 'Rangoli', 'Fireworks'],
        messaging: 'Focus on prosperity, fresh starts, and celebration',
        urgency: 'Limited festival period',
        regions: ['India', 'Nepal', 'South Asian diaspora']
      },
      black_friday: {
        significance: 'Major shopping event in Western countries',
        timing: 'Day after Thanksgiving (November)',
        themes: ['Deals', 'Savings', 'Urgency', 'Scarcity'],
        colors: ['Black', 'Red', 'Gold'],
        symbols: ['Price tags', 'Percentages', 'Countdown timers'],
        messaging: 'Aggressive savings, limited time, scarcity',
        urgency: 'Very high - 24-48 hours',
        regions: ['USA', 'Canada', 'Europe', 'Global']
      },
      new_year: {
        significance: 'Fresh start, goal-setting, resolutions',
        timing: 'January 1st',
        themes: ['Transformation', 'Goals', 'Fresh start', 'Self-improvement'],
        colors: ['Blue', 'Silver', 'Gold'],
        symbols: ['Fireworks', 'Champagne', 'Calendar'],
        messaging: 'Focus on transformation, achieving goals, new you',
        urgency: 'New year momentum',
        regions: ['Global']
      },
      christmas: {
        significance: 'Christian holiday, also secular celebration of giving',
        timing: 'December 25th',
        themes: ['Giving', 'Family', 'Joy', 'Celebration'],
        colors: ['Red', 'Green', 'Gold'],
        symbols: ['Trees', 'Gifts', 'Santa', 'Snow'],
        messaging: 'Focus on gifts, family, spreading joy',
        urgency: 'Gift-giving deadline',
        regions: ['Western countries', 'Global']
      }
    };

    return contexts[eventType] || {
      significance: 'Custom seasonal event',
      themes: ['Special offer', 'Limited time'],
      messaging: 'Create urgency and highlight value'
    };
  }

  /**
   * Format competitors for prompt
   */
  formatCompetitors(competitors) {
    if (!competitors || competitors.length === 0) {
      return 'No competitor data available.';
    }

    return competitors.map((c, i) => `
${i + 1}. ${c.app_name}
   - Pricing: Weekly $${c.pricing_weekly || 'N/A'}, Monthly $${c.pricing_monthly || 'N/A'}, Yearly $${c.pricing_yearly || 'N/A'}
   - Trial: ${c.trial_duration || 'N/A'} days ${c.trial_type || ''}
   - Paywall Template: ${c.paywall_template || 'N/A'}
   - Elements: ${c.paywall_elements || 'N/A'}
   - Position: ${c.market_position || 'N/A'}
    `).join('\n');
  }

  /**
   * Format benchmarks for prompt
   */
  formatBenchmarks(benchmarks) {
    if (!benchmarks || benchmarks.length === 0) {
      return 'No benchmark data available.';
    }

    return benchmarks.map(b => `
${b.metric_name}:
  - 25th percentile: ${b.p25}
  - Median (50th): ${b.p50}
  - 75th percentile: ${b.p75}
  - 90th percentile: ${b.p90}
    `).join('\n');
  }

  /**
   * Parse JSON response from Claude
   */
  parseJsonResponse(response) {
    const content = response.content[0].text;

    // Extract JSON (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.error('Raw response:', content);
      throw new Error('Invalid AI response format');
    }
  }
}

module.exports = PaywallGenerator;
