# Behavioural Hub - İçgörü Üretme Stratejisi

## 🎯 Vizyon
Bilimsel temellere dayalı, güvenilir ve actionable içgörüler üreten bir platform.

## 📊 Veri Mimarisi

### 1. Knowledge Base Yapısı

```
behavioural-hub/
├── backend/
│   ├── src/
│   │   ├── knowledge-base/
│   │   │   ├── psychology-principles.json
│   │   │   ├── ux-patterns.json
│   │   │   ├── neuroscience-insights.json
│   │   │   └── academic-research.json
│   │   │
│   │   ├── data-sources/
│   │   │   ├── integrations/
│   │   │   │   ├── scholar-api.js
│   │   │   │   ├── rss-feeds.js
│   │   │   │   └── content-scraper.js
│   │   │   │
│   │   │   └── curation/
│   │   │       ├── manual-entries.json
│   │   │       └── expert-review.json
│   │   │
│   │   ├── insight-engine/
│   │   │   ├── pattern-detector.js
│   │   │   ├── psychology-mapper.js
│   │   │   ├── evidence-correlator.js
│   │   │   └── recommendation-generator.js
│   │   │
│   │   └── database/
│   │       ├── insights.db
│   │       ├── sources.db
│   │       └── citations.db
```

### 2. Psychology Principles Database Schema

```sql
CREATE TABLE psychology_principles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- 'behavioral', 'cognitive', 'social', 'neuroscience'
  description TEXT,
  framework_owner TEXT, -- 'Nir Eyal', 'BJ Fogg', etc.

  -- Academic grounding
  primary_citation TEXT,
  academic_papers JSON, -- Array of research papers
  confidence_score REAL, -- 0-1

  -- Practical application
  use_cases JSON,
  real_world_examples JSON,

  -- Metadata
  created_at DATETIME,
  last_reviewed DATETIME,
  review_status TEXT -- 'verified', 'pending', 'disputed'
);

CREATE TABLE sources (
  id INTEGER PRIMARY KEY,
  url TEXT,
  title TEXT,
  author TEXT,
  publication_date DATE,

  -- Classification
  tier INTEGER, -- 1: Academic, 2: Industry Expert, 3: Community
  confidence_level REAL,
  content_type TEXT, -- 'research', 'case-study', 'blog', 'book'

  -- Content
  summary TEXT,
  key_takeaways JSON,
  relevant_principles JSON, -- Links to psychology_principles

  -- Metadata
  last_fetched DATETIME,
  fetch_frequency TEXT -- 'daily', 'weekly', 'monthly'
);

CREATE TABLE insights (
  id INTEGER PRIMARY KEY,
  scenario_id INTEGER,

  -- The insight
  title TEXT,
  description TEXT,
  severity TEXT, -- 'critical', 'high', 'medium', 'low'

  -- Evidence
  data_evidence JSON, -- User behavior data
  psychology_evidence JSON, -- Linked principles
  source_citations JSON, -- Linked sources

  -- Recommendation
  recommendation TEXT,
  expected_impact TEXT,
  implementation_effort TEXT,

  -- Confidence
  overall_confidence REAL,
  data_confidence REAL,
  theory_confidence REAL,

  -- Review
  ai_generated BOOLEAN,
  human_reviewed BOOLEAN,
  expert_reviewed BOOLEAN,

  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE citations (
  id INTEGER PRIMARY KEY,
  insight_id INTEGER,
  source_id INTEGER,
  quote TEXT,
  relevance_score REAL,
  FOREIGN KEY (insight_id) REFERENCES insights(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);
```

## 🔬 İçgörü Üretme Workflow

### Phase 1: Data Collection (Otomatik + Manuel)

**Otomatik Veri Toplama:**
```javascript
// Weekly automated tasks
- Fetch new papers from Google Scholar (keywords: UX psychology, behavioral design)
- Check RSS feeds (Nir Eyal, Duolingo, Adapty blogs)
- Scrape curated Medium publications
- Update industry benchmarks (Baymard, NNG)
```

**Manuel Kürasyon:**
- Haftalık expert review sessions
- Yeni academic papers'ın manual classification'ı
- Quality scoring (1-5)
- Relevance tagging

### Phase 2: Pattern Detection

```javascript
// Kullanıcı davranışından pattern tespit et
function detectPatterns(analyticsData) {
  const patterns = [];

  // Örnek patterns:
  // - High drop-off at specific steps
  // - Time-based behavior changes
  // - Feature adoption curves
  // - User segment differences

  patterns.forEach(pattern => {
    pattern.statisticalSignificance = calculateSignificance(pattern);
    pattern.sampleSize = data.length;
    pattern.timeRange = data.dateRange;
  });

  return patterns.filter(p => p.statisticalSignificance > 0.95);
}
```

### Phase 3: Psychology Mapping

```javascript
// Pattern'i psikoloji prensipleriyle eşleştir
function mapToPsychology(pattern) {
  const matches = [];

  // Rule-based matching
  if (pattern.type === 'high_drop_off' && pattern.step.choiceCount > 5) {
    matches.push({
      principle: 'Hick\'s Law',
      confidence: 0.9,
      reasoning: 'Too many choices increases decision time and abandonment'
    });

    matches.push({
      principle: 'Choice Paradox',
      confidence: 0.85,
      reasoning: 'Barry Schwartz research on choice overload'
    });
  }

  // Semantic search in knowledge base
  const semanticMatches = searchKnowledgeBase(pattern.description);

  return [...matches, ...semanticMatches];
}
```

### Phase 4: Evidence Correlation

```javascript
function buildEvidence(pattern, psychPrinciples) {
  return {
    quantitativeEvidence: {
      metric: pattern.metric,
      value: pattern.value,
      sampleSize: pattern.sampleSize,
      significance: pattern.statisticalSignificance,
      dateRange: pattern.timeRange
    },

    qualitativeEvidence: {
      userFeedback: getRelatedFeedback(pattern),
      sessionRecordings: getRelatedSessions(pattern)
    },

    scientificEvidence: psychPrinciples.map(p => ({
      principle: p.name,
      citation: p.primary_citation,
      academicPapers: p.academic_papers,
      confidence: p.confidence_score
    })),

    benchmarkEvidence: {
      industryStandards: getBenchmarks(pattern.type),
      competitorData: getCompetitorExamples(pattern),
      caseStudies: getCaseStudies(pattern)
    }
  };
}
```

### Phase 5: Recommendation Generation

```javascript
function generateRecommendation(insight, evidence) {
  // Best practices database'den öneriler
  const bestPractices = queryBestPractices(insight.type);

  // A/B test results database'den kanıtlanmış taktikler
  const provenTactics = queryProvenTactics(insight.category);

  return {
    primaryAction: {
      description: "...",
      rationale: "...",
      expectedImpact: "...",
      effort: "low|medium|high",
      timeline: "1 week|2 weeks|1 month",

      // Supporting evidence
      evidence: [
        {
          type: "case_study",
          source: "Duolingo Blog - Onboarding Optimization",
          result: "Reduced drop-off from 60% to 30%",
          link: "https://..."
        },
        {
          type: "academic",
          source: "Hick, W. E. (1952)",
          finding: "RT = a + b log₂(n+1)",
          relevance: "Reaction time increases logarithmically with choices"
        }
      ]
    },

    alternativeActions: [...],

    metrics: {
      trackingMetrics: ["step_2_completion_rate", "time_on_step"],
      successCriteria: "Completion rate > 70%",
      testingApproach: "A/B test with 5% traffic"
    }
  };
}
```

## 📚 Kaynak Kürasyon Stratejisi

### Tier 1: Academic Sources (Highest Confidence)
**Kaynaklar:**
- Google Scholar API
- PubMed (psychology)
- ArXiv (cognitive science)
- ACM Digital Library (HCI research)

**Kürasyon:**
- Otomatik fetch: Haftalık
- Manual review: Her yeni paper
- Minimum requirements: Peer-reviewed, cited >10 times

**Örnek Keywords:**
- "user psychology behavior design"
- "cognitive load interface"
- "gamification motivation psychology"
- "behavioral economics UX"

### Tier 2: Industry Experts (High Confidence)
**Curated List:**
```json
{
  "experts": [
    {
      "name": "Nir Eyal",
      "blog": "https://www.nirandfar.com/",
      "rss": "https://www.nirandfar.com/feed/",
      "expertise": ["habit formation", "behavioral design"],
      "confidence": 0.95
    },
    {
      "name": "Baymard Institute",
      "url": "https://baymard.com/blog",
      "expertise": ["e-commerce UX", "usability research"],
      "confidence": 0.92
    },
    {
      "name": "Nielsen Norman Group",
      "url": "https://www.nngroup.com/articles/",
      "expertise": ["UX research", "usability"],
      "confidence": 0.95
    },
    {
      "name": "Duolingo Blog",
      "url": "https://blog.duolingo.com/",
      "expertise": ["gamification", "engagement"],
      "confidence": 0.88
    },
    {
      "name": "Adapty Blog",
      "url": "https://adapty.io/blog/",
      "expertise": ["subscription", "monetization psychology"],
      "confidence": 0.85
    },
    {
      "name": "Reforge",
      "url": "https://www.reforge.com/blog",
      "expertise": ["growth psychology", "retention"],
      "confidence": 0.90
    }
  ]
}
```

**Otomatik İşlemler:**
- RSS feed monitoring (günlük)
- Keyword extraction ve tagging
- Otomatik summarization (AI)
- Manual quality review (haftalık)

### Tier 3: Curated Community (Medium Confidence)
**Platformlar:**
- Medium (selected publications only)
  - UX Collective
  - Bootcamp
  - Muzli
- Developer blogs
  - Google Developers
  - Meta Engineering
- Product communities
  - Product Hunt discussions
  - Indie Hackers

**Filtering:**
- Minimum claps/engagement threshold
- Author credibility check
- Cross-reference with Tier 1/2 sources

## 🎯 İçgörü Confidence Scoring

```javascript
function calculateConfidenceScore(insight) {
  const weights = {
    dataQuality: 0.25,      // Sample size, significance
    theoryStrength: 0.30,   // Academic backing
    practicalEvidence: 0.25, // Case studies, benchmarks
    expertReview: 0.20      // Human validation
  };

  const scores = {
    dataQuality: calculateDataQuality(insight.data),
    theoryStrength: calculateTheoryStrength(insight.psychology),
    practicalEvidence: calculatePracticalEvidence(insight.examples),
    expertReview: insight.humanReviewed ? 1.0 : 0.5
  };

  const weightedScore = Object.keys(weights).reduce((sum, key) => {
    return sum + (weights[key] * scores[key]);
  }, 0);

  return {
    overallScore: weightedScore,
    breakdown: scores,
    confidenceLevel: getConfidenceLevel(weightedScore)
    // > 0.8: "Very High"
    // > 0.6: "High"
    // > 0.4: "Medium"
    // < 0.4: "Low" (requires more evidence)
  };
}
```

## 🔄 Quality Control Process

### 1. AI-Generated Insights
- Otomatik pattern detection
- Psychology principle mapping
- Initial confidence scoring
- **Status: Requires Human Review**

### 2. Human Review (Product Manager/Designer)
- Contextual validation
- Business relevance check
- Priority assignment
- **Status: Approved for Testing**

### 3. Expert Review (Optional, for high-impact insights)
- Psychology expert consultation
- Academic validation
- Peer review
- **Status: Scientifically Validated**

### 4. Implementation & Validation
- A/B test results
- Metric tracking
- Outcome documentation
- **Status: Proven/Disproven**

## 📈 Continuous Improvement

```javascript
// Feedback loop
function updateKnowledgeBase(insight, testResults) {
  if (testResults.successful) {
    // Increase confidence in related principles
    increasePrincipleConfidence(insight.psychologyPrinciples);

    // Add to proven tactics database
    addProvenTactic({
      insight: insight,
      implementation: testResults.implementation,
      results: testResults.metrics
    });

    // Update recommendation engine
    reinforcePattern(insight.pattern, insight.recommendation);
  } else {
    // Analyze why it failed
    const failureAnalysis = analyzeFailure(insight, testResults);

    // Update confidence scores
    adjustConfidenceScores(insight, failureAnalysis);

    // Flag for expert review
    flagForReview(insight, failureAnalysis);
  }
}
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema setup
- [ ] Basic psychology principles database (top 20 principles)
- [ ] Manual source curation (top 10 sources)
- [ ] Simple insight template

### Phase 2: Automation (Week 3-4)
- [ ] RSS feed integration
- [ ] Google Scholar API integration
- [ ] Automated summarization
- [ ] Confidence scoring algorithm

### Phase 3: Intelligence (Week 5-6)
- [ ] Pattern detection algorithms
- [ ] Psychology mapping engine
- [ ] Recommendation generator
- [ ] Citation system

### Phase 4: Validation (Week 7-8)
- [ ] Human review workflow
- [ ] A/B test tracking integration
- [ ] Feedback loop implementation
- [ ] Quality metrics dashboard

## 📖 İçgörü Örneği (Full Cycle)

### Input: User Behavior Data
```json
{
  "scenario": "Onboarding Flow",
  "metric": "Step 2 Completion Rate",
  "value": 0.33,
  "previousValue": 0.65,
  "change": -0.32,
  "sampleSize": 1247,
  "significance": 0.99,
  "context": {
    "recentChanges": "Added 5 new preference options",
    "userSegment": "New mobile users"
  }
}
```

### Processing: AI Analysis
```javascript
// Pattern detected: Significant drop after UI change
// Hypothesis: Too many choices causing decision paralysis

// Psychology mapping:
[
  {
    principle: "Hick's Law",
    confidence: 0.93,
    citation: "Hick, W. E. (1952). On the rate of gain of information."
  },
  {
    principle: "Choice Paradox",
    confidence: 0.88,
    citation: "Schwartz, B. (2004). The Paradox of Choice."
  },
  {
    principle: "Cognitive Load Theory",
    confidence: 0.85,
    citation: "Sweller, J. (1988). Cognitive load during problem solving."
  }
]

// Real-world examples found:
[
  {
    source: "Duolingo Blog - Onboarding Simplification",
    result: "Reducing onboarding steps from 5 to 3 increased completion by 40%",
    link: "https://blog.duolingo.com/...",
    confidence: 0.87
  },
  {
    source: "Baymard Institute - Checkout Usability",
    finding: "37% of users abandon checkout due to too many form fields",
    relevance: "Similar cognitive overload pattern",
    confidence: 0.82
  }
]
```

### Output: Actionable Insight
```json
{
  "id": 1247,
  "title": "Onboarding Step 2: Seçenek Sayısı Kullanıcı Kayıplarını Artırıyor",
  "severity": "critical",
  "confidence": 0.87,

  "description": "2. onboarding adımında tercih seçeneklerinin 3'ten 8'e çıkarılması, tamamlama oranını %65'ten %33'e düşürdü. Bu, mobil kullanıcılarda karar yorgunluğu (decision fatigue) yaratıyor.",

  "evidence": {
    "data": {
      "metric": "Step 2 completion dropped from 65% to 33%",
      "impact": "~800 lost users per week",
      "significance": "99% statistically significant (p < 0.01)",
      "segment": "New mobile users (sample size: 1,247)"
    },

    "psychology": [
      {
        "principle": "Hick's Law",
        "explanation": "Karar verme süresi, seçenek sayısıyla logaritmik olarak artar. 8 seçenek, 3 seçeneğe göre ~50% daha fazla cognitive load oluşturur.",
        "citation": "Hick, W. E. (1952). On the rate of gain of information. Quarterly Journal of Experimental Psychology, 4(1), 11-26.",
        "confidence": 0.93
      },
      {
        "principle": "Choice Paradox",
        "explanation": "Barry Schwartz'ın araştırmasına göre, çok fazla seçenek paradoksal olarak karar vermemeye (inaction) yol açar.",
        "citation": "Schwartz, B. (2004). The Paradox of Choice: Why More Is Less.",
        "confidence": 0.88
      }
    ],

    "realWorld": [
      {
        "company": "Duolingo",
        "action": "Onboarding steps reduced from 5 to 3",
        "result": "+40% completion rate",
        "source": "https://blog.duolingo.com/onboarding-optimization-2023",
        "relevance": "Similar mobile onboarding optimization",
        "confidence": 0.87
      },
      {
        "benchmark": "Baymard Institute",
        "finding": "Optimal form fields: 7±2 (Miller's Law)",
        "data": "37% cart abandonment due to excessive fields",
        "source": "https://baymard.com/checkout-usability",
        "confidence": 0.82
      }
    ]
  },

  "recommendation": {
    "primary": {
      "action": "Seçenek sayısını 8'den 3'e düşür (en popüler 3 tercih)",
      "rationale": "Cognitive load'u azaltarak karar vermeyi kolaylaştır",
      "expectedImpact": "Completion rate %33 -> %60+ (Duolingo benchmark)",
      "effort": "Low (1 gün dev work)",
      "priority": "P0 - Critical"
    },

    "alternative": {
      "action": "Progressive disclosure: İlk 3 seçenek + 'More options' toggle",
      "rationale": "Power users için flexibility, yeni kullanıcılar için simplicity",
      "expectedImpact": "Completion rate %33 -> %55+",
      "effort": "Medium (3 gün dev work)"
    },

    "testing": {
      "approach": "A/B test: Mevcut (8 options) vs. Basitleştirilmiş (3 options)",
      "traffic": "50/50 split, minimum 1,000 users per variant",
      "duration": "7 days",
      "successMetric": "Step 2 completion rate > 60%",
      "secondaryMetrics": ["Overall onboarding completion", "Time on step", "Back button clicks"]
    }
  },

  "citations": [
    "Hick, W. E. (1952). On the rate of gain of information. Quarterly Journal of Experimental Psychology.",
    "Schwartz, B. (2004). The Paradox of Choice: Why More Is Less. Harper Perennial.",
    "Duolingo Engineering Blog (2023). How we increased onboarding completion by 40%.",
    "Baymard Institute (2024). Checkout Usability Research Findings."
  ],

  "metadata": {
    "createdBy": "AI Insight Engine v1.0",
    "createdAt": "2026-02-05T10:30:00Z",
    "aiConfidence": 0.87,
    "humanReviewed": false,
    "expertReviewed": false,
    "status": "pending_review",
    "reviewers": []
  }
}
```

## 💡 Key Principles

1. **Science-First**: Her içgörü mutlaka psikoloji/nörobilim prensibine dayanmalı
2. **Evidence-Based**: Data + Theory + Real-world examples trinity
3. **Confidence Transparency**: Kullanıcı her zaman confidence score'u görmeli
4. **Citation Culture**: Her claim için kaynak gösterilmeli (akademik standart)
5. **Continuous Learning**: A/B test sonuçları sistemi sürekli günceller
6. **Human-in-the-Loop**: AI generates, humans validate
7. **Actionable Focus**: Sadece "ne oldu" değil, "ne yapmalı" da söylenmeli

## 🎓 Knowledge Base Başlangıç İçeriği

### Top 20 Psychology Principles (MVP için)

1. **Behavioral Design**
   - Nir Eyal's Hook Model
   - BJ Fogg's Behavior Model (B=MAP)
   - Operant Conditioning (Skinner)

2. **Cognitive Psychology**
   - Hick's Law
   - Miller's Law (7±2)
   - Cognitive Load Theory
   - Serial Position Effect
   - Von Restorff Effect

3. **Decision Making**
   - Choice Paradox
   - Loss Aversion (Kahneman & Tversky)
   - Anchoring Effect
   - Default Effect
   - Commitment & Consistency

4. **Social Psychology**
   - Social Proof (Cialdini)
   - Scarcity Principle
   - Authority Bias
   - Reciprocity

5. **UX Psychology**
   - Jakob's Law
   - Fitts's Law
   - Gestalt Principles
   - Progressive Disclosure

Her principle için:
- Academic citation
- Plain language explanation
- Use cases
- Real examples
- Anti-patterns

---

## Next Steps

Bu stratejiyi implement etmek için:

1. **Backend database schema'yı** yukarıdaki SQL ile oluştur
2. **Initial knowledge base'i** populate et (top 20 principles)
3. **RSS feed crawler'ı** kur (Tier 2 sources)
4. **Insight generation algorithm'u** prototype et
5. **Frontend'e citation display** ekle

Sana bir prototip kod da yazayım mı? Yoksa önce bu strateji üzerinde tartışalım mı?
