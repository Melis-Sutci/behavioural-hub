-- ============================================
-- CURATED SOURCES - SEED DATA
-- ============================================
-- Tier 1: Academic Sources (Highest Confidence)
-- Tier 2: Industry Expert Sources (High Confidence)
-- Based on: INSIGHT_STRATEGY.md

-- ============================================
-- TIER 1: ACADEMIC SOURCES
-- ============================================

-- Academic Books - Foundational Works
INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Hooked: How to Build Habit-Forming Products',
  'Nir Eyal',
  'https://www.nirandfar.com/hooked/',
  1,
  0.95,
  'book',
  'Framework for building habit-forming products through a four-phase cycle: Trigger, Action, Variable Reward, Investment. Combines psychology research with practical product design.',
  '["Four-phase Hook Model", "External vs internal triggers", "Variable ratio schedules create strongest habits", "User investment increases product value", "Habit zone: High frequency + high perceived utility"]',
  '[1]',
  'manual',
  '2014-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Thinking, Fast and Slow',
  'Daniel Kahneman',
  'https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow',
  1,
  0.98,
  'book',
  'Nobel Prize winner explains dual-system thinking: System 1 (fast, intuitive) vs System 2 (slow, analytical). Covers cognitive biases, loss aversion, anchoring, and prospect theory.',
  '["System 1 vs System 2 thinking", "Loss aversion is 2x stronger than gain", "Anchoring effect influences all decisions", "Availability heuristic and representativeness", "Planning fallacy and optimism bias"]',
  '[10, 11]',
  'manual',
  '2011-10-25'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Influence: The Psychology of Persuasion',
  'Robert Cialdini',
  'https://www.influenceatwork.com/',
  1,
  0.96,
  'book',
  'Six universal principles of influence: Reciprocity, Commitment/Consistency, Social Proof, Authority, Liking, Scarcity. Based on 35 years of evidence-based research.',
  '["Reciprocity: Give first, receive later", "Social proof: Wisdom of crowds", "Authority: Expert endorsements work", "Scarcity: Limited availability increases value", "Commitment: Small commitments lead to larger ones", "Liking: People say yes to people they like"]',
  '[13, 14, 15, 16, 17]',
  'manual',
  '1984-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'The Paradox of Choice',
  'Barry Schwartz',
  'https://www.ted.com/talks/barry_schwartz_the_paradox_of_choice',
  1,
  0.92,
  'book',
  'Too many choices lead to anxiety, paralysis, and dissatisfaction. Less is more when it comes to decision-making and happiness.',
  '["More choice = less satisfaction", "Decision paralysis with 24+ options", "Maximizers vs satisficers", "Opportunity costs increase with options", "Choice overload reduces conversion"]',
  '[9]',
  'manual',
  '2004-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Nudge: Improving Decisions About Health, Wealth, and Happiness',
  'Richard Thaler & Cass Sunstein',
  'https://en.wikipedia.org/wiki/Nudge_(book)',
  1,
  0.94,
  'book',
  'Choice architecture and how small nudges can dramatically influence behavior without restricting freedom. Defaults, framing, and social norms as behavior change tools.',
  '["Default options shape behavior", "Organ donation: opt-in vs opt-out", "Choice architecture matters", "Libertarian paternalism", "Status quo bias and inertia"]',
  '[12]',
  'manual',
  '2008-01-01'
);

-- Academic Research Papers
INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'On the rate of gain of information',
  'W. E. Hick',
  'https://doi.org/10.1080/17470215208416600',
  1,
  0.96,
  'research',
  'Original research establishing Hick''s Law: Reaction time increases logarithmically with number of choices. RT = a + b log₂(n+1).',
  '["RT increases logarithmically with choices", "Applies to visual search and menu design", "Practiced tasks show reduced effect", "Complexity impacts decision time"]',
  '[4]',
  'manual',
  '1952-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'The Magical Number Seven, Plus or Minus Two',
  'George A. Miller',
  'https://doi.org/10.1037/h0043158',
  1,
  0.95,
  'research',
  'Working memory can hold 7±2 chunks of information. Foundational paper on cognitive limits and information processing.',
  '["Working memory capacity: 7±2 items", "Chunking improves retention", "Applies to STM not LTM", "Individual differences exist"]',
  '[5]',
  'manual',
  '1956-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Cognitive Load During Problem Solving',
  'John Sweller',
  'https://doi.org/10.1207/s15516709cog1202_4',
  1,
  0.93,
  'research',
  'Cognitive load theory: Working memory limitations affect learning and problem-solving. Intrinsic, extraneous, and germane load compete for resources.',
  '["Three types of cognitive load", "Reduce extraneous load through design", "Worked examples reduce load", "Split-attention effect in multimedia"]',
  '[6]',
  'manual',
  '1988-01-01'
);

-- ============================================
-- TIER 2: INDUSTRY EXPERT SOURCES
-- ============================================

-- Industry Expert Blogs & Publications
INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Nir & Far - Behavioral Design Blog',
  'Nir Eyal',
  'https://www.nirandfar.com/blog/',
  2,
  0.90,
  'blog',
  'Leading blog on behavioral design, habit formation, and ethical persuasion. Author of Hooked and Indistractable.',
  '["Hook Model applications", "Ethical manipulation boundaries", "Habit formation techniques", "Variable reward design", "User investment strategies"]',
  '[1, 3]',
  'weekly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Nielsen Norman Group Articles',
  'Jakob Nielsen & Don Norman',
  'https://www.nngroup.com/articles/',
  2,
  0.95,
  'blog',
  'World leaders in UX research and usability. Evidence-based UX guidelines from decades of user research.',
  '["Jakob''s Law of UX", "F-pattern and Z-pattern reading", "Progressive disclosure principles", "10 Usability Heuristics", "Mobile UX best practices"]',
  '[18, 20]',
  'weekly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Baymard Institute - UX Research',
  'Baymard Institute',
  'https://baymard.com/blog',
  2,
  0.92,
  'blog',
  'Premium UX research institute focused on e-commerce. Large-scale usability testing and checkout optimization.',
  '["Checkout usability findings", "Form field optimization", "Product page best practices", "Mobile commerce patterns", "Cart abandonment research"]',
  '[4, 5, 9]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Duolingo Blog - Product & Growth',
  'Duolingo Engineering Team',
  'https://blog.duolingo.com/',
  2,
  0.88,
  'blog',
  'Case studies on gamification, engagement, and retention from world''s #1 education app. Data-driven insights from 500M+ users.',
  '["Gamification and streak mechanics", "Onboarding optimization tactics", "Push notification strategies", "A/B testing methodologies", "Retention and engagement loops"]',
  '[1, 3, 13]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Adapty Blog - Subscription & Monetization',
  'Adapty',
  'https://adapty.io/blog/',
  2,
  0.85,
  'blog',
  'Subscription psychology, pricing optimization, and monetization strategies for mobile apps. Data from 3000+ apps.',
  '["Pricing psychology", "Paywall optimization", "Trial-to-paid conversion tactics", "Subscription retention strategies", "Loss aversion in cancellation flows"]',
  '[10, 12, 15]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Reforge Blog - Growth & Product',
  'Reforge',
  'https://www.reforge.com/blog',
  2,
  0.90,
  'blog',
  'Advanced growth and product strategy from industry leaders at companies like Airbnb, Netflix, Facebook.',
  '["Behavioral cohort analysis", "Growth loops and flywheels", "Activation optimization", "Retention curves", "North Star metrics"]',
  '[1, 2, 14]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Laws of UX',
  'Jon Yablonski',
  'https://lawsofux.com/',
  2,
  0.93,
  'documentation',
  'Collection of design principles and maxims for creating intuitive, human-centered interfaces. Each law includes academic references.',
  '["Aesthetic-Usability Effect", "Doherty Threshold (400ms)", "Goal-Gradient Effect", "Parkinson''s Law", "Postel''s Law"]',
  '[4, 5, 18, 19, 20]',
  'manual',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'BehavioralEconomics.com',
  'The Decision Lab',
  'https://www.behavioraleconomics.com/',
  2,
  0.87,
  'documentation',
  'Comprehensive behavioral economics encyclopedia. Cognitive biases, heuristics, and decision-making research.',
  '["200+ cognitive biases", "Behavioral economics principles", "Nudge theory applications", "Decision-making heuristics", "Choice architecture patterns"]',
  '[9, 10, 11, 12]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'GoodUI - Evidence-based Patterns',
  'GoodUI',
  'https://goodui.org/',
  2,
  0.84,
  'documentation',
  'A/B tested UI patterns with evidence. Over 100 patterns tested across millions of users.',
  '["Tested conversion patterns", "Social proof implementations", "Form optimization tactics", "CTA design patterns", "Pricing page optimization"]',
  '[7, 8, 14, 15]',
  'manual',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'BJ Fogg - Behavior Model',
  'BJ Fogg (Stanford)',
  'https://behaviormodel.org/',
  2,
  0.94,
  'documentation',
  'Official resource for Fogg Behavior Model (B=MAP). Research from Stanford Behavior Design Lab.',
  '["B=MAP framework", "Ability factors (time, money, effort)", "Motivation waves", "Prompt timing", "Tiny Habits method"]',
  '[2]',
  'manual',
  '2024-01-01'
);

-- Industry Case Studies
INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Stripe - Designing Payment Flows',
  'Stripe Design Team',
  'https://stripe.com/blog',
  2,
  0.86,
  'case-study',
  'How Stripe designs low-friction payment flows and builds trust. Authority signals, progressive disclosure, and error handling.',
  '["Authority badges (PCI-DSS)", "Progressive form disclosure", "Real-time validation", "Error prevention patterns", "Trust indicators"]',
  '[16, 20]',
  'monthly',
  '2024-01-01'
);

INSERT INTO sources (title, author, url, tier, confidence_level, content_type, summary, key_takeaways, relevant_principles, fetch_frequency, publication_date) VALUES (
  'Airbnb - Trust & Belonging',
  'Airbnb Design Team',
  'https://airbnb.design/',
  2,
  0.87,
  'case-study',
  'Building trust in two-sided marketplace. Social proof, authority signals, and reducing friction in booking flow.',
  '["Review system design", "Photo quality impact", "Host response rate", "Superhost badges", "Instant booking psychology"]',
  '[14, 16]',
  'monthly',
  '2024-01-01'
);

-- ============================================
-- PRINCIPLE-SOURCE MAPPINGS
-- ============================================
-- Link sources to relevant psychology principles

-- Hook Model (principle_id: 1)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (1, 1, 1.0); -- Hooked book
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (1, 9, 0.95); -- Nir's blog
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (1, 12, 0.85); -- Duolingo blog

-- Fogg Behavior Model (principle_id: 2)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (2, 18, 1.0); -- BJ Fogg site

-- Hick's Law (principle_id: 4)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (4, 6, 1.0); -- Original paper
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (4, 15, 0.90); -- Laws of UX

-- Miller's Law (principle_id: 5)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (5, 7, 1.0); -- Original paper
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (5, 15, 0.90); -- Laws of UX

-- Cognitive Load Theory (principle_id: 6)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (6, 8, 1.0); -- Sweller paper

-- Paradox of Choice (principle_id: 9)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (9, 4, 1.0); -- Schwartz book
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (9, 11, 0.85); -- Baymard

-- Loss Aversion (principle_id: 10)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (10, 2, 1.0); -- Thinking Fast and Slow
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (10, 13, 0.88); -- Adapty blog

-- Anchoring (principle_id: 11)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (11, 2, 1.0); -- Thinking Fast and Slow

-- Default Effect (principle_id: 12)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (12, 5, 1.0); -- Nudge book

-- Commitment & Consistency (principle_id: 13)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (13, 3, 1.0); -- Influence book
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (13, 12, 0.85); -- Duolingo

-- Social Proof (principle_id: 14)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (14, 3, 1.0); -- Influence book
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (14, 20, 0.90); -- Airbnb case study

-- Scarcity (principle_id: 15)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (15, 3, 1.0); -- Influence book

-- Authority (principle_id: 16)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (16, 3, 1.0); -- Influence book
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (16, 19, 0.90); -- Stripe case study

-- Reciprocity (principle_id: 17)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (17, 3, 1.0); -- Influence book

-- Jakob's Law (principle_id: 18)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (18, 10, 1.0); -- NNG
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (18, 15, 0.95); -- Laws of UX

-- Fitts's Law (principle_id: 19)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (19, 15, 0.95); -- Laws of UX

-- Progressive Disclosure (principle_id: 20)
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (20, 10, 1.0); -- NNG
INSERT INTO principle_sources (principle_id, source_id, relevance_score) VALUES (20, 19, 0.85); -- Stripe case study

-- ============================================
-- Summary
-- ============================================
-- 20 Curated Sources Added:
--
-- Tier 1 - Academic (8 sources):
--   - 5 foundational books
--   - 3 seminal research papers
--
-- Tier 2 - Industry Experts (12 sources):
--   - 6 expert blogs (Nir Eyal, NNG, Baymard, Duolingo, Adapty, Reforge)
--   - 4 documentation sites (Laws of UX, BehavioralEconomics, GoodUI, BJ Fogg)
--   - 2 case studies (Stripe, Airbnb)
--
-- 30+ Principle-Source mappings created
