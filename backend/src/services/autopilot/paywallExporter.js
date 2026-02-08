/**
 * Paywall Exporter Service
 *
 * Exports paywall templates to various formats:
 * - HTML (standalone with inline CSS)
 * - JSON (design data)
 */

class PaywallExporter {
  constructor(db) {
    this.db = db;
  }

  /**
   * Export paywall template as standalone HTML
   */
  async exportAsHTML(templateId) {
    const template = this.db.get(`
      SELECT * FROM paywall_templates WHERE id = ?
    `, [templateId]);

    if (!template) {
      throw new Error('Template not found');
    }

    const layout = JSON.parse(template.layout_config);
    const copy = JSON.parse(template.copy_config);
    const pricing = JSON.parse(template.pricing_display);
    const visual = JSON.parse(template.visual_config || '{}');

    // Generate standalone HTML
    const html = this.generateHTML(template.name, layout, copy, pricing, visual);

    return {
      templateId,
      name: template.name,
      html,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Export paywall template as JSON
   */
  async exportAsJSON(templateId) {
    const template = this.db.get(`
      SELECT * FROM paywall_templates WHERE id = ?
    `, [templateId]);

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      templateId,
      name: template.name,
      description: template.description,
      type: template.template_type,
      targetSegment: template.target_segment,
      layout: JSON.parse(template.layout_config),
      copy: JSON.parse(template.copy_config),
      pricing: JSON.parse(template.pricing_display),
      visual: JSON.parse(template.visual_config || '{}'),
      rationale: template.ai_rationale,
      createdAt: template.created_at,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Generate standalone HTML with inline CSS
   */
  generateHTML(title, layout, copy, pricing, visual) {
    const bgColor = visual.backgroundColor || '#FFFFFF';
    const primaryColor = visual.primaryColor || '#8B5CF6';
    const textColor = visual.textColor || '#1F2937';
    const accentColor = visual.accentColor || '#10B981';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .paywall-container {
            max-width: 480px;
            width: 100%;
            background: white;
            border-radius: 24px;
            padding: 40px 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .paywall-header {
            margin-bottom: 32px;
        }
        .paywall-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }
        .paywall-title {
            font-size: 28px;
            font-weight: 700;
            color: ${textColor};
            margin-bottom: 12px;
            line-height: 1.2;
        }
        .paywall-subtitle {
            font-size: 16px;
            color: #6B7280;
            line-height: 1.5;
        }
        .features-list {
            margin: 32px 0;
            text-align: left;
        }
        .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 12px;
            background: #F9FAFB;
            border-radius: 12px;
        }
        .feature-icon {
            font-size: 24px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .feature-text {
            font-size: 15px;
            color: ${textColor};
            line-height: 1.5;
        }
        .pricing-section {
            margin: 32px 0;
            padding: 24px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);
            border-radius: 16px;
            color: white;
        }
        .price-amount {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        .price-period {
            font-size: 16px;
            opacity: 0.9;
        }
        .price-details {
            margin-top: 12px;
            font-size: 14px;
            opacity: 0.8;
        }
        .cta-button {
            width: 100%;
            padding: 18px 32px;
            background: ${primaryColor};
            color: white;
            border: none;
            border-radius: 14px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
        }
        .footer-text {
            margin-top: 24px;
            font-size: 13px;
            color: #9CA3AF;
        }
        .footer-links {
            margin-top: 16px;
            display: flex;
            justify-content: center;
            gap: 16px;
        }
        .footer-link {
            color: #6B7280;
            text-decoration: none;
            font-size: 13px;
        }
        .footer-link:hover {
            color: ${primaryColor};
        }
    </style>
</head>
<body>
    <div class="paywall-container">
        <div class="paywall-header">
            <div class="paywall-icon">${visual.icon || '✨'}</div>
            <h1 class="paywall-title">${copy.headline || 'Unlock Premium Features'}</h1>
            <p class="paywall-subtitle">${copy.subheadline || 'Get unlimited access to all features'}</p>
        </div>

        <div class="features-list">
            ${(copy.features || []).map(feature => `
                <div class="feature-item">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">${feature}</div>
                </div>
            `).join('')}
        </div>

        <div class="pricing-section">
            <div class="price-amount">${pricing.price || '$9.99'}</div>
            <div class="price-period">${pricing.period || 'per month'}</div>
            ${pricing.trial ? `<div class="price-details">${pricing.trial}</div>` : ''}
        </div>

        <button class="cta-button">${copy.ctaText || 'Start Free Trial'}</button>

        <p class="footer-text">${copy.disclaimer || 'Cancel anytime. No credit card required for trial.'}</p>

        <div class="footer-links">
            <a href="#" class="footer-link">Terms of Service</a>
            <a href="#" class="footer-link">Privacy Policy</a>
            <a href="#" class="footer-link">Restore Purchase</a>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = PaywallExporter;
