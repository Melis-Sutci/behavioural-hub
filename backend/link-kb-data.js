/**
 * Link Knowledge Base Data
 * Creates relationships between principles and sources
 */

const Database = require('better-sqlite3');
const db = new Database('./behavioural_hub.db');

console.log('\n📚 Linking Knowledge Base Data...\n');

// Mapping of principles to sources (based on our added sources)
const principleSourceMappings = [
  // Hook Model -> Nir Eyal sources
  { principleName: 'Hook Model', sourceTitle: 'Hooked: How to Build Habit-Forming Products', relevance: 1.0 },
  { principleName: 'Hook Model', sourceTitle: 'Nir & Far - Behavioral Design Blog', relevance: 0.9 },
  { principleName: 'Hook Model', sourceTitle: "A/B Testing at Scale: Duolingo's Approach to Product Development", relevance: 0.7 },

  // Fogg Behavior Model -> BJ Fogg & relevant sources
  { principleName: 'Fogg Behavior Model (B=MAP)', sourceTitle: "BJ Fogg's Behavior Model - Official Website", relevance: 1.0 },
  { principleName: 'Fogg Behavior Model (B=MAP)', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.8 },
  { principleName: 'Fogg Behavior Model (B=MAP)', sourceTitle: 'Build for Billions - Android Quality Guidelines', relevance: 0.7 },
  { principleName: 'Fogg Behavior Model (B=MAP)', sourceTitle: 'Phiture - Mobile Growth Consultancy', relevance: 0.8 },

  // Loss Aversion -> Kahneman
  { principleName: 'Loss Aversion', sourceTitle: 'Thinking, Fast and Slow', relevance: 1.0 },
  { principleName: 'Loss Aversion', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.8 },

  // Paradox of Choice
  { principleName: 'Paradox of Choice', sourceTitle: 'The Paradox of Choice', relevance: 1.0 },
  { principleName: 'Paradox of Choice', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },
  { principleName: 'Paradox of Choice', sourceTitle: "Building an A/B Testing Culture: Dailymotion's Journey from Design-Driven to Data-Aware", relevance: 0.7 },

  // Social Proof -> Cialdini
  { principleName: 'Social Proof', sourceTitle: 'Influence: The Psychology of Persuasion', relevance: 1.0 },

  // Reciprocity -> Cialdini
  { principleName: 'Reciprocity', sourceTitle: 'Influence: The Psychology of Persuasion', relevance: 1.0 },
  { principleName: 'Reciprocity Principle', sourceTitle: 'Influence: The Psychology of Persuasion', relevance: 1.0 },
  { principleName: 'Reciprocity Principle', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },

  // Scarcity
  { principleName: 'Scarcity Principle', sourceTitle: 'Influence: The Psychology of Persuasion', relevance: 1.0 },

  // Commitment & Consistency
  { principleName: 'Commitment & Consistency', sourceTitle: 'Influence: The Psychology of Persuasion', relevance: 1.0 },

  // Affect Heuristic
  { principleName: 'Affect Heuristic', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 1.0 },
  { principleName: 'Affect Heuristic', sourceTitle: 'The Bear Architects - Behavioural Science Articles', relevance: 0.8 },

  // Endowment Effect
  { principleName: 'Endowment Effect', sourceTitle: 'Thinking, Fast and Slow', relevance: 1.0 },
  { principleName: 'Endowment Effect', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },

  // Price Anchoring
  { principleName: 'Price Anchoring', sourceTitle: 'Thinking, Fast and Slow', relevance: 0.9 },
  { principleName: 'Price Anchoring', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 1.0 },
  { principleName: 'Price Anchoring', sourceTitle: 'Phiture - Mobile Growth Consultancy', relevance: 0.7 },

  // Anchoring Effect
  { principleName: 'Anchoring Effect', sourceTitle: 'Thinking, Fast and Slow', relevance: 1.0 },
  { principleName: 'Anchoring Effect', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },

  // Cognitive Ease
  { principleName: 'Cognitive Ease', sourceTitle: 'Thinking, Fast and Slow', relevance: 1.0 },
  { principleName: 'Cognitive Ease', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },
  { principleName: 'Cognitive Ease', sourceTitle: "A/B Testing Challenges at Hypergrowth: Lessons from Monzo", relevance: 0.7 },

  // Choice Architecture
  { principleName: 'Choice Architecture', sourceTitle: 'Nudge: Improving Decisions About Health, Wealth, and Happiness', relevance: 1.0 },
  { principleName: 'Choice Architecture', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 0.9 },

  // Decoy Effect
  { principleName: 'Decoy Effect', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 1.0 },

  // Order Effect
  { principleName: 'Order Effect (Primacy Effect)', sourceTitle: 'Monetizing in Emerging Markets with Behavioral Science - Google Play', relevance: 1.0 },

  // Cohort Analysis
  { principleName: 'Cohort Analysis', sourceTitle: 'How Cohorts and Correlations Help Us Better Understand Our Learners', relevance: 1.0 },
  { principleName: 'Cohort Analysis', sourceTitle: "A/B Testing at Scale: Duolingo's Approach to Product Development", relevance: 0.8 },

  // Hick's Law
  { principleName: "Hick's Law", sourceTitle: 'Nielsen Norman Group Articles', relevance: 0.9 },
  { principleName: "Hick's Law", sourceTitle: "Building an A/B Testing Culture: Dailymotion's Journey from Design-Driven to Data-Aware", relevance: 0.7 },

  // Cognitive Load Theory
  { principleName: 'Cognitive Load Theory', sourceTitle: 'Cognitive Load During Problem Solving', relevance: 1.0 },
  { principleName: 'Cognitive Load Theory', sourceTitle: 'Build for Billions - Android Quality Guidelines', relevance: 0.8 },

  // Operant Conditioning
  { principleName: 'Operant Conditioning', sourceTitle: "A/B Testing at Scale: Duolingo's Approach to Product Development", relevance: 0.8 },
  { principleName: 'Operant Conditioning', sourceTitle: 'How Cohorts and Correlations Help Us Better Understand Our Learners', relevance: 0.7 }
];

console.log(`🔗 Processing ${principleSourceMappings.length} principle-source mappings...\n`);

const getPrincipleId = db.prepare('SELECT id FROM psychology_principles WHERE name = ?');
const getSourceId = db.prepare('SELECT id FROM sources WHERE title = ?');
const insertMapping = db.prepare(`
  INSERT OR IGNORE INTO principle_sources (principle_id, source_id, relevance_score)
  VALUES (?, ?, ?)
`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const mapping of principleSourceMappings) {
  try {
    const principle = getPrincipleId.get(mapping.principleName);
    const source = getSourceId.get(mapping.sourceTitle);

    if (!principle) {
      console.log(`⚠️  Principle not found: ${mapping.principleName}`);
      errorCount++;
      continue;
    }

    if (!source) {
      console.log(`⚠️  Source not found: ${mapping.sourceTitle}`);
      errorCount++;
      continue;
    }

    const result = insertMapping.run(principle.id, source.id, mapping.relevance);

    if (result.changes > 0) {
      console.log(`✅ Linked: ${mapping.principleName} <-> ${mapping.sourceTitle.substring(0, 50)}...`);
      successCount++;
    } else {
      skipCount++;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    errorCount++;
  }
}

// Get final statistics
const stats = {
  totalMappings: db.prepare('SELECT COUNT(*) as count FROM principle_sources').get().count,
  principlesWithSources: db.prepare('SELECT COUNT(DISTINCT principle_id) as count FROM principle_sources').get().count,
  sourcesWithPrinciples: db.prepare('SELECT COUNT(DISTINCT source_id) as count FROM principle_sources').get().count,
  avgRelevance: db.prepare('SELECT AVG(relevance_score) as avg FROM principle_sources').get().avg
};

console.log(`\n✨ Summary:`);
console.log(`   Successfully linked: ${successCount}`);
console.log(`   Skipped (already exist): ${skipCount}`);
console.log(`   Errors: ${errorCount}`);
console.log(`\n📊 Knowledge Base Statistics:`);
console.log(`   Total principle-source mappings: ${stats.totalMappings}`);
console.log(`   Principles with sources: ${stats.principlesWithSources}/29`);
console.log(`   Sources with principles: ${stats.sourcesWithPrinciples}/30`);
console.log(`   Average relevance score: ${stats.avgRelevance.toFixed(2)}`);

// Show top connected principles
console.log(`\n🏆 Top Connected Principles:`);
const topPrinciples = db.prepare(`
  SELECT p.name, COUNT(*) as source_count, AVG(ps.relevance_score) as avg_relevance
  FROM psychology_principles p
  JOIN principle_sources ps ON p.id = ps.principle_id
  GROUP BY p.id
  ORDER BY source_count DESC, avg_relevance DESC
  LIMIT 5
`).all();

topPrinciples.forEach((p, i) => {
  console.log(`   ${i + 1}. ${p.name}: ${p.source_count} sources (avg relevance: ${p.avg_relevance.toFixed(2)})`);
});

db.close();
console.log(`\n✅ Done!\n`);
