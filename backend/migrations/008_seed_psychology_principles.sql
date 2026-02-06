-- ============================================
-- PSYCHOLOGY PRINCIPLES - SEED DATA
-- ============================================
-- Top 20 Psychology Principles for UX/Behavioral Design
-- Based on: INSIGHT_STRATEGY.md
-- Each principle includes academic citation and practical examples

-- ============================================
-- BEHAVIORAL DESIGN PRINCIPLES
-- ============================================

-- 1. Nir Eyal's Hook Model
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Hook Model',
  'behavioral',
  'A four-phase cycle (Trigger → Action → Variable Reward → Investment) that creates habit-forming products. The model explains how products can create user habits through repeated cycles.',
  'Nir Eyal',
  'Eyal, N. (2014). Hooked: How to Build Habit-Forming Products. Portfolio.',
  '[{"title": "Operant conditioning principles", "author": "B.F. Skinner", "year": 1953, "journal": "Science and Human Behavior"}]',
  0.92,
  '["Push notifications (Trigger)", "One-tap actions (Action)", "Random rewards (Variable Reward)", "User-generated content (Investment)"]',
  '["Instagram: Like counts as variable reward", "Duolingo: Daily streak investment", "Slack: Notification triggers for team messages"]',
  '["Dark patterns: Fake scarcity triggers", "Over-notification spam", "Manipulative variable rewards (loot boxes)", "Forced investment requirements"]',
  'verified'
);

-- 2. BJ Fogg's Behavior Model (B=MAP)
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Fogg Behavior Model (B=MAP)',
  'behavioral',
  'Behavior = Motivation × Ability × Prompt. All three elements must converge at the same moment for a behavior to occur. Used to design for behavior change.',
  'BJ Fogg',
  'Fogg, B. J. (2009). A behavior model for persuasive design. Proceedings of the 4th international Conference on Persuasive Technology.',
  '[{"title": "Tiny Habits: The Small Changes That Change Everything", "author": "BJ Fogg", "year": 2019}]',
  0.95,
  '["Onboarding flows", "Call-to-action optimization", "Habit formation", "Conversion optimization"]',
  '["Amazon 1-Click: High ability + clear prompt", "Headspace: Small meditation goals (motivation + ability)", "Nike Run Club: Start run prompt at optimal time"]',
  '["High friction CTAs", "Asking for hard actions without motivation", "Prompts without context"]',
  'verified'
);

-- 3. Operant Conditioning
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Operant Conditioning',
  'behavioral',
  'Behavior is modified by its consequences. Positive reinforcement increases desired behaviors, negative reinforcement removes unpleasant stimuli. Variable ratio schedules create strongest habit formation.',
  'B.F. Skinner',
  'Skinner, B. F. (1953). Science and Human Behavior. Macmillan.',
  '[{"title": "The Behavior of Organisms", "author": "B.F. Skinner", "year": 1938}, {"title": "Schedules of Reinforcement", "author": "Ferster & Skinner", "year": 1957}]',
  0.98,
  '["Gamification systems", "Reward mechanisms", "Achievement badges", "Progress tracking"]',
  '["Duolingo: XP rewards and streaks", "LinkedIn: Profile strength meter", "Fitbit: Achievement badges and challenges"]',
  '["Punishment-based design", "Too predictable rewards (fixed ratio)", "Reward overload causing satiation"]',
  'verified'
);

-- ============================================
-- COGNITIVE PSYCHOLOGY PRINCIPLES
-- ============================================

-- 4. Hick's Law
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Hick''s Law',
  'cognitive',
  'Decision time increases logarithmically with the number of choices: RT = a + b log₂(n+1). More options lead to longer decision times and potential paralysis.',
  'William Edmund Hick',
  'Hick, W. E. (1952). On the rate of gain of information. Quarterly Journal of Experimental Psychology, 4(1), 11-26.',
  '[{"title": "On the rate of gain of information", "author": "W. E. Hick", "year": 1952, "journal": "Quarterly Journal of Experimental Psychology"}]',
  0.96,
  '["Menu design", "Form field reduction", "Feature simplification", "Choice architecture"]',
  '["Google homepage: Minimal options", "Apple product lineup: Good-Better-Best", "Netflix: Top 10 recommendations vs full catalog"]',
  '["Mega-menus with 50+ items", "Unlimited scrolling options", "Equal visual weight on all choices"]',
  'verified'
);

-- 5. Miller's Law (7±2)
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Miller''s Law (7±2)',
  'cognitive',
  'The average person can hold 7 (±2) items in working memory. Chunking information into groups improves retention and reduces cognitive load.',
  'George A. Miller',
  'Miller, G. A. (1956). The magical number seven, plus or minus two. Psychological Review, 63(2), 81-97.',
  '[{"title": "The Magical Number Seven, Plus or Minus Two", "author": "George A. Miller", "year": 1956, "journal": "Psychological Review"}]',
  0.94,
  '["Navigation menus (5-9 items)", "Form field grouping", "Phone number formatting", "Step indicators"]',
  '["Phone numbers: (555) 123-4567 vs 5551234567", "Credit cards: 1234 5678 9012 3456", "Checkout steps: 3-5 steps max"]',
  '["15-item navigation bars", "Ungrouped long forms", "Too many dashboard widgets"]',
  'verified'
);

-- 6. Cognitive Load Theory
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Cognitive Load Theory',
  'cognitive',
  'Working memory has limited capacity. Intrinsic load (task complexity), extraneous load (poor design), and germane load (learning) all compete for cognitive resources.',
  'John Sweller',
  'Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science, 12(2), 257-285.',
  '[{"title": "Cognitive Load Theory", "author": "John Sweller", "year": 1988, "journal": "Cognitive Science"}]',
  0.93,
  '["Onboarding simplification", "Progressive disclosure", "Visual hierarchy", "Information chunking"]',
  '["TurboTax: Step-by-step tax filing", "Calm app: Simple meditation interface", "Notion: Progressive feature discovery"]',
  '["Information overload dashboards", "Multi-step forms without progress", "Cluttered UI with no visual hierarchy"]',
  'verified'
);

-- 7. Serial Position Effect
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Serial Position Effect',
  'cognitive',
  'People remember the first (primacy) and last (recency) items in a series better than middle items. First and last positions have highest recall rates.',
  'Hermann Ebbinghaus',
  'Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.',
  '[{"title": "Memory: A Contribution to Experimental Psychology", "author": "Hermann Ebbinghaus", "year": 1885}]',
  0.91,
  '["CTA placement", "Feature ordering", "Pricing page design", "Navigation structure"]',
  '["Pricing pages: Best plan first or last", "App stores: Most important permissions first", "Restaurant menus: Specials at top/bottom"]',
  '["Important features buried in middle", "Critical CTAs in center of long lists"]',
  'verified'
);

-- 8. Von Restorff Effect (Isolation Effect)
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Von Restorff Effect',
  'cognitive',
  'Items that stand out from their peers are more memorable. Visual distinctiveness enhances recall and attention.',
  'Hedwig von Restorff',
  'Von Restorff, H. (1933). Über die Wirkung von Bereichsbildungen im Spurenfeld. Psychologische Forschung, 18(1), 299-342.',
  '[{"title": "Isolation Effect in memory", "author": "H. von Restorff", "year": 1933}]',
  0.89,
  '["CTA button design", "Highlighting important info", "Feature differentiation", "Error messages"]',
  '["Spotify: Green premium button", "Stripe: Highlighted pricing tier", "Error messages: Red color + icon"]',
  '["All elements competing for attention", "No visual hierarchy", "Overuse of highlights"]',
  'verified'
);

-- ============================================
-- DECISION MAKING & BEHAVIORAL ECONOMICS
-- ============================================

-- 9. Choice Paradox
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Paradox of Choice',
  'cognitive',
  'Too many choices lead to decision paralysis, anxiety, and dissatisfaction. Limiting options can increase conversion and satisfaction.',
  'Barry Schwartz',
  'Schwartz, B. (2004). The Paradox of Choice: Why More Is Less. Harper Perennial.',
  '[{"title": "The Paradox of Choice", "author": "Barry Schwartz", "year": 2004}, {"title": "When Choice is Demotivating", "author": "Iyengar & Lepper", "year": 2000, "journal": "Journal of Personality and Social Psychology"}]',
  0.90,
  '["Product SKU reduction", "Pricing tier simplification", "Feature streamlining", "Recommendation algorithms"]',
  '["Jam study: 24 jams vs 6 jams (10x conversion)", "Netflix: Curated rows vs search", "Apple: 3 iPhone models vs competitors 20+"]',
  '["Unlimited customization", "50+ feature toggles", "Complex pricing matrices"]',
  'verified'
);

-- 10. Loss Aversion
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Loss Aversion',
  'cognitive',
  'People feel losses ~2x more strongly than equivalent gains. Framing in terms of potential loss is more motivating than potential gain.',
  'Daniel Kahneman & Amos Tversky',
  'Kahneman, D., & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk. Econometrica, 47(2), 263-291.',
  '[{"title": "Prospect Theory", "author": "Kahneman & Tversky", "year": 1979, "journal": "Econometrica"}, {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "year": 2011}]',
  0.97,
  '["Trial ending warnings", "Cart abandonment", "Cancellation flows", "Upgrade messaging"]',
  '["Spotify: Your playlist will be lost", "Amazon: Save $X by upgrading", "Duolingo: Don''t lose your streak"]',
  '["Overly negative framing", "Fear-mongering", "Manipulative loss messaging"]',
  'verified'
);

-- 11. Anchoring Effect
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Anchoring Effect',
  'cognitive',
  'First piece of information (anchor) disproportionately influences subsequent judgments. Initial price, number, or reference point sets baseline for comparison.',
  'Daniel Kahneman & Amos Tversky',
  'Tversky, A., & Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases. Science, 185(4157), 1124-1131.',
  '[{"title": "Judgment under Uncertainty", "author": "Tversky & Kahneman", "year": 1974, "journal": "Science"}]',
  0.94,
  '["Pricing displays", "Original vs sale price", "Subscription tiers", "Feature comparisons"]',
  '["Was $99, Now $49", "iPhone 15 Pro Max shown first at $1199", "Pricing: Basic $9, Pro $29 (makes $29 seem reasonable)"]',
  '["Unrealistic original prices", "Deceptive anchors", "Too extreme anchors (not credible)"]',
  'verified'
);

-- 12. Default Effect
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Default Effect',
  'cognitive',
  'People disproportionately choose pre-selected default options due to status quo bias and cognitive ease. Defaults can dramatically shape behavior.',
  'Richard Thaler',
  'Thaler, R. H., & Sunstein, C. R. (2008). Nudge: Improving Decisions about Health, Wealth, and Happiness. Yale University Press.',
  '[{"title": "Nudge", "author": "Thaler & Sunstein", "year": 2008}, {"title": "Organ donation defaults", "author": "Johnson & Goldstein", "year": 2003, "journal": "Science"}]',
  0.96,
  '["Organ donation opt-in/out", "Newsletter subscriptions", "Privacy settings", "Subscription billing cycles"]',
  '["Organ donation: 90% vs 10% based on opt-in/out", "GDPR: Privacy defaults", "Annual billing: Often the default (higher LTV)"]',
  '["Dark patterns: Hidden unsubscribe", "Defaults against user interest", "Privacy-invasive defaults"]',
  'verified'
);

-- 13. Commitment & Consistency
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Commitment & Consistency',
  'social',
  'People desire to act consistently with their past commitments and self-image. Small initial commitments lead to larger future commitments.',
  'Robert Cialdini',
  'Cialdini, R. B. (1984). Influence: The Psychology of Persuasion. HarperBusiness.',
  '[{"title": "Influence: The Psychology of Persuasion", "author": "Robert Cialdini", "year": 1984}]',
  0.91,
  '["Multi-step onboarding", "Goal setting", "Public commitments", "Progress tracking"]',
  '["Duolingo: Set daily goal (commitment) → daily practice", "LinkedIn: Profile completion % → continued updates", "Fitness apps: Set goal → track progress"]',
  '["Forcing commitments too early", "No escape route from commitments", "Guilting users"]',
  'verified'
);

-- ============================================
-- SOCIAL PSYCHOLOGY
-- ============================================

-- 14. Social Proof
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Social Proof',
  'social',
  'People look to others'' behavior to guide their own actions, especially under uncertainty. "Wisdom of the crowd" influences decision-making.',
  'Robert Cialdini',
  'Cialdini, R. B. (1984). Influence: The Psychology of Persuasion. HarperBusiness.',
  '[{"title": "Social Influence", "author": "Robert Cialdini", "year": 1984}, {"title": "Informational social influence", "author": "Deutsch & Gerard", "year": 1955}]',
  0.93,
  '["User reviews", "Testimonials", "User counts", "Trending indicators", "Case studies"]',
  '["Booking.com: 15 people viewing this hotel", "Amazon: 4.5 stars (12,450 reviews)", "Airbnb: Verified reviews + response rate"]',
  '["Fake reviews", "Inflated user counts", "Cherry-picked testimonials", "Bot-generated social proof"]',
  'verified'
);

-- 15. Scarcity Principle
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Scarcity Principle',
  'social',
  'Limited availability increases perceived value and urgency. Both quantity scarcity (limited stock) and time scarcity (limited time) drive action.',
  'Robert Cialdini',
  'Cialdini, R. B. (1984). Influence: The Psychology of Persuasion. HarperBusiness.',
  '[{"title": "Influence: Scarcity", "author": "Robert Cialdini", "year": 1984}, {"title": "Scarcity effects on value", "author": "Worchel et al.", "year": 1975}]',
  0.88,
  '["Flash sales", "Limited edition products", "Countdown timers", "Stock indicators"]',
  '["Booking.com: Only 2 rooms left", "Amazon: Deal ends in 3:42:15", "Nike SNKRS: Limited release drops"]',
  '["Fake scarcity (always 2 left)", "Anxiety-inducing pressure", "Constant urgency fatigue"]',
  'verified'
);

-- 16. Authority Bias
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Authority Bias',
  'social',
  'People trust and follow advice from perceived experts and authority figures. Credentials, certifications, and expert endorsements influence behavior.',
  'Stanley Milgram / Robert Cialdini',
  'Milgram, S. (1963). Behavioral Study of obedience. Journal of Abnormal and Social Psychology, 67(4), 371-378.',
  '[{"title": "Obedience to Authority", "author": "Stanley Milgram", "year": 1974}, {"title": "Influence: Authority", "author": "Robert Cialdini", "year": 1984}]',
  0.90,
  '["Expert endorsements", "Certifications", "Awards", "Medical/scientific backing"]',
  '["Headspace: Backed by neuroscience", "Stripe: PCI-DSS certified", "Calm: #1 app for meditation (App Store)"]',
  '["Fake credentials", "Misleading expert claims", "Fabricated awards"]',
  'verified'
);

-- 17. Reciprocity
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Reciprocity',
  'social',
  'People feel obligated to return favors and concessions. Giving something first (value, free trial) triggers desire to reciprocate.',
  'Robert Cialdini',
  'Cialdini, R. B. (1984). Influence: The Psychology of Persuasion. HarperBusiness.',
  '[{"title": "Influence: Reciprocity", "author": "Robert Cialdini", "year": 1984}, {"title": "The Norm of Reciprocity", "author": "Alvin Gouldner", "year": 1960}]',
  0.89,
  '["Free trials", "Freemium models", "Gift with purchase", "Free content/resources"]',
  '["Spotify: 3 months free → 23% convert", "HubSpot: Free CRM → 30% upgrade", "Sephora: Free samples → increased basket size"]',
  '["Bait and switch", "Free with hidden costs", "Guilting after free trial"]',
  'verified'
);

-- ============================================
-- UX PSYCHOLOGY
-- ============================================

-- 18. Jakob's Law
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Jakob''s Law',
  'ux',
  'Users spend most of their time on other sites. They prefer your site to work the same way as all the other sites they already know. Familiarity reduces cognitive load.',
  'Jakob Nielsen',
  'Nielsen, J. (2000). Jakob''s Law of the Internet User Experience. Nielsen Norman Group.',
  '[{"title": "Designing Web Usability", "author": "Jakob Nielsen", "year": 1999}]',
  0.92,
  '["Navigation patterns", "Icon conventions", "Interaction patterns", "Form design"]',
  '["Shopping cart icon: universally understood", "Hamburger menu: mobile standard", "F-pattern reading: design accordingly"]',
  '["Reinventing common patterns", "Unconventional navigation", "Non-standard icons"]',
  'verified'
);

-- 19. Fitts's Law
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Fitts''s Law',
  'ux',
  'Time to acquire a target is a function of distance to and size of the target: T = a + b log₂(D/W + 1). Larger, closer targets are faster to click.',
  'Paul Fitts',
  'Fitts, P. M. (1954). The information capacity of the human motor system. Journal of Experimental Psychology, 47(6), 381-391.',
  '[{"title": "The Information Capacity of the Human Motor System", "author": "Paul Fitts", "year": 1954}]',
  0.95,
  '["Button sizing", "Touch target design", "CTA placement", "Mobile UI"]',
  '["iOS: 44×44pt minimum touch target", "Primary CTA: Large button bottom of screen", "Context menus: Near cursor position"]',
  '["Tiny mobile buttons", "Important actions far from user attention", "Inconsistent button sizes"]',
  'verified'
);

-- 20. Progressive Disclosure
INSERT INTO psychology_principles (name, category, description, framework_owner, primary_citation, academic_papers, confidence_score, use_cases, real_world_examples, anti_patterns, review_status) VALUES (
  'Progressive Disclosure',
  'ux',
  'Show only necessary information at each step. Reveal advanced features progressively to avoid overwhelming users. Reduces cognitive load and improves completion rates.',
  'Jakob Nielsen',
  'Nielsen, J. (2006). Progressive Disclosure. Nielsen Norman Group.',
  '[{"title": "Prioritizing Web Usability", "author": "Jakob Nielsen", "year": 2006}]',
  0.90,
  '["Onboarding flows", "Settings panels", "Advanced features", "Form design"]',
  '["Gmail: Basic compose → Advanced options (CC, BCC)", "Slack: Show more options", "Notion: Templates → Advanced customization"]',
  '["Hiding critical features", "Too many disclosure levels", "Unclear information hierarchy"]',
  'verified'
);

-- ============================================
-- Summary
-- ============================================
-- 20 Psychology Principles Added:
--
-- Behavioral Design (3):
--   1. Hook Model (Nir Eyal)
--   2. Fogg Behavior Model (BJ Fogg)
--   3. Operant Conditioning (B.F. Skinner)
--
-- Cognitive Psychology (5):
--   4. Hick's Law
--   5. Miller's Law (7±2)
--   6. Cognitive Load Theory
--   7. Serial Position Effect
--   8. Von Restorff Effect
--
-- Decision Making (5):
--   9. Paradox of Choice
--   10. Loss Aversion
--   11. Anchoring Effect
--   12. Default Effect
--   13. Commitment & Consistency
--
-- Social Psychology (4):
--   14. Social Proof
--   15. Scarcity Principle
--   16. Authority Bias
--   17. Reciprocity
--
-- UX Psychology (3):
--   18. Jakob's Law
--   19. Fitts's Law
--   20. Progressive Disclosure
