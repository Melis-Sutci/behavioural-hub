# Growth Autopilot - Focused Implementation Plan

## 🎯 Amaç
Adapty benzeri bir sistem: Competitor pricing analizi, benchmark karşılaştırması, AI-powered test önerileri.

---

## 📊 Sektör Devlerinin Yaklaşımı

### Adapty'nin Sistemi
1. **Data Collection**: 15K+ uygulama verisi topluyor (pricing, conversion rates, trial strategies)
2. **Benchmark Database**: Kategori bazlı metrikler (p25, p50, p75, p90)
3. **AI Analysis**: Mevcut performance + competitor data + benchmarks → Test önerileri
4. **Confidence Scoring**: Her öneri için confidence score (veri kalitesine göre)
5. **Auto-execution**: Tek tıkla test başlatma

### RevenueCat'in Yaklaşımı
1. **Anonymous aggregate data**: Milyonlarca kullanıcı verisi
2. **Cohort analysis**: Benzer uygulamalarla karşılaştırma
3. **Best practices library**: Kanıtlanmış stratejiler

### Bizim Yaklaşımımız
**Gerçekçi olalım**: 15K uygulama verimiz yok. Ama şunları yapabiliriz:
1. **Manual competitor research**: Kullanıcı manuel olarak competitor ekleyecek
2. **Public data sources**: Store listings, public pricing info
3. **Synthetic benchmarks**: Industry reports + academic research + mock data (başlangıç için)
4. **AI-powered analysis**: Claude ile derinlemesine analiz
5. **Learning system**: Her test sonucu → daha iyi öneriler

---

## 🏗️ Sistem Mimarisi

### Backend Components
```
1. Competitor Database
   - Manuel ekleme UI
   - Pricing tracking
   - Paywall screenshots
   - Trial strategies

2. Benchmark Engine
   - Kategori bazlı metrikler
   - Synthetic + real data blend
   - Percentile calculations

3. AI Analysis Service
   - Claude API integration
   - Prompt engineering
   - Structured output parsing

4. Recommendation Engine
   - Test hypothesis generation
   - Sample size calculation
   - Priority scoring
```

### Frontend Components
```
1. Dashboard
   - Performance overview
   - Benchmark comparison
   - Quick stats

2. Competitor Analysis Page
   - Add/edit competitors
   - Pricing comparison table
   - Visual paywall gallery

3. Recommendations Page
   - AI-generated test ideas
   - Priority sorting
   - One-click launch

4. Audit Report
   - Strengths/weaknesses
   - Opportunities
   - Overall score
```

---

## 🗄️ Database Schema

```sql
-- 1. Competitors
CREATE TABLE competitors (
  id TEXT PRIMARY KEY,
  app_name TEXT NOT NULL,
  bundle_id TEXT,
  category TEXT NOT NULL,
  country TEXT DEFAULT 'US',

  -- Pricing
  pricing_weekly REAL,
  pricing_monthly REAL,
  pricing_yearly REAL,
  pricing_lifetime REAL,

  -- Trial
  trial_duration INTEGER,
  trial_type TEXT, -- 'free', 'paid', 'none'

  -- Paywall
  paywall_screenshot_url TEXT,
  paywall_template TEXT, -- 'card_stack', 'hero_image', 'minimal'
  paywall_elements TEXT, -- JSON array

  -- Notes
  notes TEXT,
  market_position TEXT, -- 'premium', 'mid', 'budget'

  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Benchmarks (synthetic + real)
CREATE TABLE benchmarks (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  country TEXT DEFAULT 'global',

  -- Metrics
  metric_name TEXT NOT NULL,
  p25 REAL,
  p50 REAL,
  p75 REAL,
  p90 REAL,

  -- Metadata
  sample_size INTEGER,
  data_source TEXT, -- 'manual', 'industry_report', 'aggregated'
  confidence TEXT, -- 'low', 'medium', 'high'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(category, country, metric_name)
);

-- 3. Autopilot Recommendations
CREATE TABLE autopilot_recommendations (
  id TEXT PRIMARY KEY,
  experiment_id TEXT,

  -- Test details
  test_type TEXT NOT NULL, -- 'pricing', 'trial', 'element', 'positioning'
  hypothesis TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Current vs Suggested
  current_value TEXT, -- JSON
  suggested_value TEXT, -- JSON

  -- Impact
  priority_score INTEGER, -- 0-100
  expected_impact TEXT, -- 'low', 'medium', 'high'
  confidence_score REAL, -- 0-1

  -- Test params
  sample_size_required INTEGER,
  estimated_duration_days INTEGER,

  -- Rationale
  rationale TEXT,
  data_sources TEXT, -- JSON array
  competitor_references TEXT, -- JSON array

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'running', 'completed'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP
);

-- 4. Autopilot Audits
CREATE TABLE autopilot_audits (
  id TEXT PRIMARY KEY,
  experiment_id TEXT,

  -- Scores
  overall_score INTEGER, -- 0-100

  -- Analysis
  strengths TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  opportunities TEXT, -- JSON array

  -- Metrics snapshot
  current_metrics TEXT, -- JSON
  benchmark_comparison TEXT, -- JSON

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Market Intelligence (industry trends)
CREATE TABLE market_intelligence (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,

  insight_type TEXT, -- 'pricing_trend', 'trial_strategy', 'design_pattern'
  title TEXT NOT NULL,
  description TEXT,

  data TEXT, -- JSON
  confidence TEXT,

  source TEXT, -- 'industry_report', 'competitor_analysis', 'user_research'
  source_url TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤖 AI Integration Strategy

### Prompt Engineering Yaklaşımı

```typescript
// src/services/autopilot/prompts.ts

export const AUTOPILOT_PROMPTS = {

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
{
  "overallScore": 75,
  "strengths": [...],
  "weaknesses": [...],
  "opportunities": [...]
}`,

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

Return as JSON array.`,

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

Return structured insights with specific examples.`,

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

Be specific and actionable.`
};
```

### AI Service Implementation

```typescript
// src/services/autopilot/aiService.ts

import Anthropic from '@anthropic-ai/sdk';
import { AUTOPILOT_PROMPTS } from './prompts';

export class AutopilotAIService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateAudit(data: {
    category: string;
    pricing: any;
    trial: any;
    metrics: any;
    competitors: any[];
    benchmarks: any;
  }): Promise<AutopilotAudit> {

    // Format prompt
    const prompt = AUTOPILOT_PROMPTS.AUDIT
      .replace('{category}', data.category)
      .replace('{pricing}', JSON.stringify(data.pricing, null, 2))
      .replace('{trial}', JSON.stringify(data.trial, null, 2))
      .replace('{metrics}', JSON.stringify(data.metrics, null, 2))
      .replace('{competitors}', this.formatCompetitors(data.competitors))
      .replace('{benchmarks}', this.formatBenchmarks(data.benchmarks));

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
    const audit = this.parseAuditResponse(response);

    // Save to database
    const auditId = generateId();
    await db.run(`
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

    return { id: auditId, ...audit };
  }

  async generateRecommendations(data: {
    pricing: any;
    trial: any;
    metrics: any;
    competitors: any[];
    benchmarks: any;
    pastTests?: any[];
  }): Promise<AutopilotRecommendation[]> {

    const prompt = AUTOPILOT_PROMPTS.RECOMMENDATIONS
      .replace('{pricing}', JSON.stringify(data.pricing))
      .replace('{trial}', JSON.stringify(data.trial))
      .replace('{conversionRate}', data.metrics.conversion_rate || 'N/A')
      .replace('{arpu}', data.metrics.arpu || 'N/A')
      .replace('{topCompetitors}', this.formatTopCompetitors(data.competitors))
      .replace('{benchmarks}', this.formatBenchmarks(data.benchmarks))
      .replace('{pastTests}', JSON.stringify(data.pastTests || []));

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 12000,
      temperature: 0.5, // Balanced creativity
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const recommendations = this.parseRecommendations(response);

    // Save to database
    for (const rec of recommendations) {
      const id = generateId();
      await db.run(`
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

    return recommendations;
  }

  private formatCompetitors(competitors: any[]): string {
    return competitors.map((c, i) => `
${i + 1}. ${c.app_name}
   - Pricing: Weekly $${c.pricing_weekly || 'N/A'}, Monthly $${c.pricing_monthly || 'N/A'}, Yearly $${c.pricing_yearly || 'N/A'}
   - Trial: ${c.trial_duration} days ${c.trial_type}
   - Position: ${c.market_position}
    `).join('\n');
  }

  private formatBenchmarks(benchmarks: any): string {
    return Object.entries(benchmarks).map(([metric, data]: [string, any]) => `
${metric}:
  - 25th percentile: ${data.p25}
  - Median (50th): ${data.p50}
  - 75th percentile: ${data.p75}
  - 90th percentile: ${data.p90}
    `).join('\n');
  }

  private parseAuditResponse(response: any): any {
    const content = response.content[0].text;

    // Extract JSON (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse audit response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseRecommendations(response: any): any[] {
    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to parse recommendations:', error);
      throw new Error('Invalid AI response format');
    }
  }
}
```

---

## 🎨 Minimal UI Implementation

### 1. Dashboard (autopilot-dashboard.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Growth Autopilot</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
  <div class="container mx-auto px-4 py-8">

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Growth Autopilot 🚀</h1>
      <p class="text-gray-600">AI-powered growth recommendations</p>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <button onclick="runAudit()" class="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700">
        <div class="text-2xl mb-2">📊</div>
        <div class="font-semibold">Run Audit</div>
      </button>

      <button onclick="showRecommendations()" class="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700">
        <div class="text-2xl mb-2">💡</div>
        <div class="font-semibold">Get Recommendations</div>
      </button>

      <button onclick="showCompetitors()" class="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700">
        <div class="text-2xl mb-2">🎯</div>
        <div class="font-semibold">Competitor Analysis</div>
      </button>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow">
      <div class="border-b">
        <nav class="flex">
          <button class="tab-btn active" data-tab="audit">Audit</button>
          <button class="tab-btn" data-tab="recommendations">Recommendations</button>
          <button class="tab-btn" data-tab="competitors">Competitors</button>
          <button class="tab-btn" data-tab="benchmarks">Benchmarks</button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Tab content will be loaded here -->
        <div id="tab-content"></div>
      </div>
    </div>

  </div>

  <script src="autopilot.js"></script>
</body>
</html>
```

### 2. JavaScript Logic (autopilot.js)

```javascript
// autopilot.js

const API_BASE = 'http://localhost:4000/api/autopilot';

// Run Audit
async function runAudit() {
  const loading = showLoading('Running comprehensive audit...');

  try {
    const response = await fetch(`${API_BASE}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentId: getCurrentExperimentId()
      })
    });

    const audit = await response.json();
    displayAudit(audit);
  } catch (error) {
    showError('Failed to run audit');
  } finally {
    hideLoading(loading);
  }
}

// Display Audit Results
function displayAudit(audit) {
  const html = `
    <div class="audit-results">
      <!-- Overall Score -->
      <div class="text-center mb-8">
        <div class="inline-block">
          <div class="text-6xl font-bold mb-2 ${getScoreColor(audit.overallScore)}">
            ${audit.overallScore}
          </div>
          <div class="text-gray-600">Overall Score</div>
        </div>
      </div>

      <!-- Strengths -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-green-600">✓</span> Strengths
        </h3>
        ${audit.strengths.map(s => `
          <div class="flex justify-between items-start p-3 bg-green-50 rounded mb-2">
            <div>
              <div class="font-semibold">${s.area}</div>
              <div class="text-sm text-gray-600">${s.description}</div>
            </div>
            <span class="text-green-700 font-bold">${s.score}</span>
          </div>
        `).join('')}
      </div>

      <!-- Weaknesses -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-red-600">!</span> Areas for Improvement
        </h3>
        ${audit.weaknesses.map(w => `
          <div class="flex justify-between items-start p-3 bg-red-50 rounded mb-2">
            <div>
              <div class="font-semibold">${w.area}</div>
              <div class="text-sm text-gray-600">${w.description}</div>
            </div>
            <span class="text-red-700 font-bold">${w.score}</span>
          </div>
        `).join('')}
      </div>

      <!-- Opportunities -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-blue-600">→</span> Growth Opportunities
        </h3>
        ${audit.opportunities.map(o => `
          <div class="p-3 bg-blue-50 rounded mb-2">
            <div class="font-semibold">${o.area}</div>
            <div class="text-sm text-gray-600">${o.description}</div>
            <span class="inline-block mt-2 px-2 py-1 bg-blue-200 rounded text-xs">
              ${o.expectedImpact} impact
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('tab-content').innerHTML = html;
}

// Get Recommendations
async function showRecommendations() {
  const loading = showLoading('Generating recommendations...');

  try {
    const response = await fetch(`${API_BASE}/recommendations`);
    const recommendations = await response.json();
    displayRecommendations(recommendations);
  } catch (error) {
    showError('Failed to load recommendations');
  } finally {
    hideLoading(loading);
  }
}

// Display Recommendations
function displayRecommendations(recommendations) {
  const sorted = recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

  const html = `
    <div class="recommendations-list">
      <div class="mb-6">
        <h2 class="text-2xl font-bold">Test Recommendations</h2>
        <p class="text-gray-600">AI-generated A/B test ideas based on market data</p>
      </div>

      ${sorted.map(rec => `
        <div class="border rounded-lg p-6 mb-4 hover:shadow-lg transition">
          <!-- Header -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex gap-3">
              <div class="priority-badge bg-blue-100 p-3 rounded text-center">
                <div class="text-xs text-gray-600">Priority</div>
                <div class="text-2xl font-bold text-blue-700">${rec.priorityScore}</div>
              </div>
              <div>
                <h3 class="text-lg font-semibold">${rec.description}</h3>
                <p class="text-sm text-gray-600">${rec.hypothesis}</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded ${getImpactBadge(rec.expectedImpact)}">
              ${rec.expectedImpact} impact
            </span>
          </div>

          <!-- Current vs Suggested -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 class="font-semibold mb-2 text-sm">Current</h4>
              <pre class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
${JSON.stringify(rec.currentValue, null, 2)}
              </pre>
            </div>
            <div>
              <h4 class="font-semibold mb-2 text-sm">Suggested</h4>
              <pre class="bg-green-50 p-3 rounded text-xs overflow-auto max-h-32">
${JSON.stringify(rec.suggestedValue, null, 2)}
              </pre>
            </div>
          </div>

          <!-- Rationale -->
          <div class="bg-blue-50 p-4 rounded mb-4">
            <h4 class="font-semibold mb-2 text-sm">Why this will work</h4>
            <p class="text-sm">${rec.rationale}</p>
          </div>

          <!-- Test Details -->
          <div class="flex gap-6 mb-4 text-sm text-gray-600">
            <div>
              <span class="font-semibold">${rec.sampleSizeRequired.toLocaleString()}</span> users needed
            </div>
            <div>
              <span class="font-semibold">${rec.estimatedDurationDays}</span> days
            </div>
            <div>
              Confidence: <span class="font-semibold">${Math.round(rec.confidenceScore * 100)}%</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              onclick="launchTest('${rec.id}')"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Launch Test
            </button>
            <button class="border py-2 px-4 rounded hover:bg-gray-50">
              Edit
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('tab-content').innerHTML = html;
}

// Helper Functions
function getScoreColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getImpactBadge(impact) {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  };
  return colors[impact] || colors.low;
}

function showLoading(message) {
  // Simple loading implementation
  const el = document.createElement('div');
  el.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
  el.innerHTML = `<div class="bg-white p-6 rounded-lg">${message}</div>`;
  document.body.appendChild(el);
  return el;
}

function hideLoading(el) {
  el?.remove();
}
```

---

## 📝 Implementation Checklist

### Phase 1: Foundation (2-3 hours)
- [ ] Create database tables (competitors, benchmarks, autopilot_recommendations, autopilot_audits, market_intelligence)
- [ ] Add sample benchmark data (seed script)
- [ ] Add 3-5 sample competitors per category
- [ ] Test database queries

### Phase 2: Backend API (3-4 hours)
- [ ] AutopilotAIService class
- [ ] Prompt templates
- [ ] API routes (/audit, /recommendations, /competitors, /benchmarks)
- [ ] Response parsing logic
- [ ] Error handling

### Phase 3: Frontend UI (2-3 hours)
- [ ] Dashboard HTML
- [ ] JavaScript logic (fetch, display)
- [ ] Tab switching
- [ ] Responsive design
- [ ] Loading states

### Phase 4: Testing & Refinement (2 hours)
- [ ] Test with real Claude API
- [ ] Refine prompts based on responses
- [ ] Add error handling
- [ ] Polish UI

**Total Time: 9-12 hours**

---

## 🎓 Senin Yapman Gerekenler

### 1. Data Collection (Optional ama yararlı)
- **Competitor Research**: Kendi kategorindeki 5-10 rakip uygulamayı manuel olarak ekle
- **Pricing Data**: App Store'dan güncel fiyatları topla
- **Screenshots**: Paywall ekran görüntüleri kaydet (reference için)

### 2. Benchmark Data (Opsiyonel)
- Industry reports bulursan share et (RevenueCat reports, Adapty blog posts, etc.)
- Gerçek metrikler varsa (conversion rates, ARPU) ekle

### 3. API Key
- Anthropic API key gerekli (zaten var gibi görünüyor)

### 4. Feedback Loop
- İlk AI cevaplarını gör ve bana feedback ver
- Prompt'ları birlikte refine ederiz

---

## 🚫 SALLAMA ÖNLEME STRATEJİSİ

### AI için Guardrails

1. **Confidence Thresholds**:
```typescript
if (recommendation.confidenceScore < 0.6) {
  recommendation.status = 'needs_review';
  recommendation.warning = 'Low confidence - human review recommended';
}
```

2. **Data Source Requirements**:
```typescript
// Her recommendation için minimum data source gerekliliği
if (recommendation.dataSources.length < 2) {
  throw new Error('Insufficient data sources');
}
```

3. **Benchmark Validation**:
```typescript
// Synthetic benchmarks için confidence düşür
if (benchmark.dataSource === 'synthetic') {
  benchmark.confidence = 'low';
  recommendation.confidenceScore *= 0.7;
}
```

4. **Conservative Estimates**:
```typescript
// Prompt'a ekle:
"Be conservative with impact estimates.
Only mark 'high' if you have strong evidence.
Default to 'medium' or 'low' if uncertain."
```

5. **Require Specific References**:
```typescript
// Prompt'a ekle:
"For each recommendation, cite specific:
- Competitor examples (by name)
- Benchmark percentiles (exact numbers)
- Psychology principles (named frameworks)

Do NOT make generic claims without data backing."
```

---

## 📊 Synthetic Benchmarks (Başlangıç için)

Industry reports ve academic research'ten derlenen gerçekçi rakamlar:

```javascript
const SYNTHETIC_BENCHMARKS = {
  'fitness': {
    conversion_rate: { p25: 2.5, p50: 4.2, p75: 6.8, p90: 9.5 },
    trial_conversion: { p25: 35, p50: 48, p75: 62, p90: 75 },
    arpu: { p25: 12.50, p50: 18.75, p75: 28.50, p90: 42.00 },
    retention_d7: { p25: 15, p50: 22, p75: 32, p90: 45 },
    retention_d30: { p25: 8, p50: 12, p75: 18, p90: 28 },
  },
  'productivity': {
    conversion_rate: { p25: 3.0, p50: 5.5, p75: 8.5, p90: 12.0 },
    trial_conversion: { p25: 40, p50: 52, p75: 65, p90: 78 },
    arpu: { p25: 8.00, p50: 15.00, p75: 25.00, p90: 40.00 },
  },
  // ...more categories
};
```

---

## 🔄 Learning & Improvement Loop

```typescript
// Her test tamamlandığında:
async function recordTestResult(recommendationId: string, result: TestResult) {
  // Update recommendation
  await db.run(`
    UPDATE autopilot_recommendations
    SET status = 'completed',
        actual_impact = ?
    WHERE id = ?
  `, [result.improvement, recommendationId]);

  // Learn from result
  const recommendation = await db.get('SELECT * FROM autopilot_recommendations WHERE id = ?', recommendationId);

  // If actual impact > expected, increase confidence in similar tests
  if (result.improvement > recommendation.expectedImpact) {
    await updateSimilarRecommendationsConfidence(recommendation.testType, 1.1);
  } else if (result.improvement < recommendation.expectedImpact * 0.5) {
    await updateSimilarRecommendationsConfidence(recommendation.testType, 0.9);
  }
}
```

---

## 🎯 Success Criteria

**Minimum Viable Product:**
- [ ] User can add competitors manually
- [ ] System generates 5-8 test recommendations
- [ ] Recommendations have solid rationale (not generic)
- [ ] One-click test launch
- [ ] Basic UI (functional, not beautiful)

**Success Metrics:**
- Recommendation acceptance rate > 40%
- Test ideas feel "smart" (not obvious)
- Users trust the rationale
- System doesn't hallucinate data

---

**Bu plan şimdi implementasyona hazır. Başlayalım mı?**
