/**
 * Autopilot AI Service
 *
 * Integrates with Claude API to generate:
 * - Audit analyses
 * - Test recommendations
 * - Competitor insights
 * - Pattern narratives
 */

const Anthropic = require('@anthropic-ai/sdk');
const { AUTOPILOT_PROMPTS } = require('./prompts');
const { generateId } = require('../../utils/helpers');

class AutopilotAIService {
  constructor(db) {
    this.db = db;

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set. AI features will not work.');
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return this.anthropic !== null;
  }

  /**
   * Generate comprehensive audit
   */
  async generateAudit(data) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    // Format prompt
    const prompt = AUTOPILOT_PROMPTS.AUDIT
      .replace('{category}', data.category || 'General')
      .replace('{pricing}', JSON.stringify(data.pricing || {}, null, 2))
      .replace('{trial}', JSON.stringify(data.trial || {}, null, 2))
      .replace('{metrics}', JSON.stringify(data.metrics || {}, null, 2))
      .replace('{competitors}', this.formatCompetitors(data.competitors || []))
      .replace('{benchmarks}', this.formatBenchmarks(data.benchmarks || {}));

    console.log('🤖 Calling Claude API for audit analysis...');

    // Call Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.3, // Lower for more consistent analysis
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse response
    const audit = this.parseJsonResponse(response);

    // Save to database
    const auditId = generateId();
    this.db.run(`
      INSERT INTO autopilot_audits (
        id, overall_score, strengths, weaknesses,
        opportunities, current_metrics, benchmark_comparison
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      auditId,
      audit.overallScore,
      JSON.stringify(audit.strengths),
      JSON.stringify(audit.weaknesses),
      JSON.stringify(audit.opportunities),
      JSON.stringify(data.metrics),
      JSON.stringify(data.benchmarks)
    ]);

    console.log(`✅ Audit saved with ID: ${auditId}`);

    return { id: auditId, ...audit };
  }

  /**
   * Generate test recommendations
   */
  async generateRecommendations(data) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    const prompt = AUTOPILOT_PROMPTS.RECOMMENDATIONS
      .replace('{pricing}', JSON.stringify(data.pricing || {}))
      .replace('{trial}', JSON.stringify(data.trial || {}))
      .replace('{conversionRate}', data.metrics?.conversion_rate || 'N/A')
      .replace('{arpu}', data.metrics?.arpu || 'N/A')
      .replace('{topCompetitors}', this.formatTopCompetitors(data.competitors || []))
      .replace('{benchmarks}', this.formatBenchmarks(data.benchmarks || {}))
      .replace('{pastTests}', JSON.stringify(data.pastTests || []));

    console.log('🤖 Calling Claude API for recommendations...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 12000,
      temperature: 0.5, // Balanced creativity
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const recommendations = this.parseJsonResponse(response);
    const recommendationsList = Array.isArray(recommendations) ? recommendations : [recommendations];

    // Save to database
    for (const rec of recommendationsList) {
      const id = generateId();
      this.db.run(`
        INSERT INTO autopilot_recommendations (
          id, test_type, hypothesis, description,
          current_value, suggested_value,
          priority_score, expected_impact, confidence_score,
          sample_size_required, estimated_duration_days,
          rationale, data_sources
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        rec.testType,
        rec.hypothesis,
        rec.description,
        JSON.stringify(rec.currentValue),
        JSON.stringify(rec.suggestedValue),
        rec.priorityScore,
        rec.expectedImpact,
        rec.confidence,
        rec.sampleSize,
        rec.duration,
        rec.rationale,
        JSON.stringify(rec.dataSources || [])
      ]);
    }

    console.log(`✅ ${recommendationsList.length} recommendations saved`);

    return recommendationsList;
  }

  /**
   * Analyze competitors
   */
  async analyzeCompetitors(competitors) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    const prompt = AUTOPILOT_PROMPTS.COMPETITOR_ANALYSIS
      .replace('{competitors}', this.formatCompetitors(competitors));

    console.log('🤖 Calling Claude API for competitor analysis...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000,
      temperature: 0.4,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseJsonResponse(response);
  }

  /**
   * Compare with benchmarks
   */
  async compareBenchmarks(appMetrics, benchmarks) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    const prompt = AUTOPILOT_PROMPTS.BENCHMARK_ANALYSIS
      .replace('{appMetrics}', JSON.stringify(appMetrics, null, 2))
      .replace('{benchmarks}', this.formatBenchmarks(benchmarks));

    console.log('🤖 Calling Claude API for benchmark analysis...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 5000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseJsonResponse(response);
  }

  /**
   * Generate insight narrative from pattern
   */
  async generatePatternNarrative(pattern, principles) {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please set ANTHROPIC_API_KEY.');
    }

    const prompt = AUTOPILOT_PROMPTS.PATTERN_NARRATIVE
      .replace('{pattern}', JSON.stringify(pattern, null, 2))
      .replace('{principles}', JSON.stringify(principles, null, 2));

    console.log('🤖 Calling Claude API for pattern narrative...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.6,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseJsonResponse(response);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Format competitors for prompt
   */
  formatCompetitors(competitors) {
    if (!competitors || competitors.length === 0) {
      return 'No competitor data available.';
    }

    return competitors.map((c, i) => `
${i + 1}. ${c.app_name || c.name}
   - Pricing: Weekly $${c.pricing_weekly || 'N/A'}, Monthly $${c.pricing_monthly || 'N/A'}, Yearly $${c.pricing_yearly || 'N/A'}
   - Trial: ${c.trial_duration || 'N/A'} days ${c.trial_type || ''}
   - Position: ${c.market_position || 'N/A'}
    `).join('\n');
  }

  /**
   * Format top competitors
   */
  formatTopCompetitors(competitors) {
    const top = competitors.slice(0, 5);
    return this.formatCompetitors(top);
  }

  /**
   * Format benchmarks for prompt
   */
  formatBenchmarks(benchmarks) {
    if (!benchmarks || Object.keys(benchmarks).length === 0) {
      return 'No benchmark data available.';
    }

    return Object.entries(benchmarks).map(([metric, data]) => `
${metric}:
  - 25th percentile: ${data.p25}
  - Median (50th): ${data.p50}
  - 75th percentile: ${data.p75}
  - 90th percentile: ${data.p90}
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

module.exports = AutopilotAIService;
