/**
 * Email Service - Professional Financial Report Delivery
 * 
 * Beautiful HTML email templates with clear visual hierarchy
 */

import nodemailer from 'nodemailer';
import { prisma } from './prisma.js';
import { getMetrics } from './metricsService.js';
import { getAnalysisReport } from './analysisService.js';
import { monthKeyFromDate } from './receiptService.js';

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    : undefined
};

if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
  console.warn("⚠️ SMTP not configured. Emails will be logged to console.");
  smtpConfig.streamTransport = true;
  smtpConfig.newline = 'unix';
  smtpConfig.buffer = true;
}

const transporter = nodemailer.createTransport(smtpConfig);

export async function sendMonthlyReportEmail(monthKeyInput) {
  const monthKey = monthKeyInput || monthKeyFromDate(new Date());
  const report = await getAnalysisReport(monthKey);
  const metrics = await getMetrics(monthKey);

  if (!report) {
    throw new Error(`No analysis report for ${monthKey}`);
  }

  if (!process.env.EMAIL_REPORT_TO || !process.env.EMAIL_FROM) {
    throw new Error('Email sender/recipient not configured');
  }

  const html = renderEmailTemplate({ monthKey, report, metrics });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_REPORT_TO,
    subject: `📊 Financial Intelligence Report – ${monthKey}`,
    html
  });

  // Update or create email job record
  const existingJob = await prisma.emailJob.findFirst({
    where: { month: monthKey }
  });

  if (existingJob) {
    await prisma.emailJob.update({
      where: { id: existingJob.id },
      data: { status: 'sent', sentAt: new Date() }
    });
  } else {
    await prisma.emailJob.create({
      data: { month: monthKey, status: 'sent', sentAt: new Date() }
    });
  }
}

// ============ Color Theme ============
const COLORS = {
  primary: '#1a365d',      // Deep navy
  secondary: '#2c5282',    // Medium blue
  accent: '#ed8936',       // Warm orange
  success: '#38a169',      // Green
  warning: '#d69e2e',      // Yellow/Gold
  danger: '#e53e3e',       // Red
  excellent: '#22543d',    // Dark green
  good: '#38a169',         // Green
  cautious: '#d69e2e',     // Yellow
  concerning: '#dd6b20',   // Orange
  critical: '#c53030',     // Red
  bgLight: '#f7fafc',      // Light gray
  bgCard: '#ffffff',       // White
  textPrimary: '#1a202c',  // Almost black
  textSecondary: '#4a5568', // Gray
  textMuted: '#718096',    // Light gray
  border: '#e2e8f0',       // Light border
};

function getMoodColor(mood) {
  const moodColors = {
    excellent: COLORS.excellent,
    good: COLORS.good,
    cautious: COLORS.cautious,
    concerning: COLORS.concerning,
    critical: COLORS.critical
  };
  return moodColors[mood] || COLORS.secondary;
}

function getGradeColor(grade) {
  if (!grade) return COLORS.textSecondary;
  if (grade.startsWith('A')) return COLORS.success;
  if (grade.startsWith('B')) return COLORS.good;
  if (grade.startsWith('C')) return COLORS.warning;
  return COLORS.danger;
}

function getSeverityColor(severity) {
  const colors = { high: COLORS.danger, medium: COLORS.warning, low: COLORS.success };
  return colors[severity] || COLORS.textSecondary;
}

function getFlagColor(flag) {
  const colors = { alert: COLORS.danger, warning: COLORS.warning, watch: COLORS.cautious, normal: COLORS.success };
  return colors[flag] || COLORS.textSecondary;
}

function renderEmailTemplate({ monthKey, report, metrics }) {
  const raw = report.rawResponse || {};
  
  // Parse month for display
  const [year, month] = monthKey.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const displayMonth = `${monthNames[parseInt(month) - 1]} ${year}`;

  // Extract data
  const healthScore = raw.financial_health_score || {};
  const executive = raw.executive_summary || {};
  const cashFlow = raw.cash_flow_analysis || {};
  const moneyLeaks = raw.money_leaks || [];
  const spending = raw.spending_breakdown || [];
  const taxOpt = raw.tax_optimization || {};
  const behavioral = raw.behavioral_insights || {};
  const actionPlan = raw.action_plan || {};
  const comparison = raw.monthly_comparison || {};

  // Build sections
  const healthScoreSection = renderHealthScore(healthScore);
  const executiveSummarySection = renderExecutiveSummary(executive);
  const cashFlowSection = renderCashFlow(cashFlow);
  const moneyLeaksSection = renderMoneyLeaks(moneyLeaks);
  const spendingSection = renderSpending(spending);
  const taxSection = renderTaxOptimization(taxOpt);
  const behavioralSection = renderBehavioralInsights(behavioral);
  const actionSection = renderActionPlan(actionPlan);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Report - ${displayMonth}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bgLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Main Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; margin: 0 auto;">
    <tr>
      <td style="padding: 20px;">
        
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); border-radius: 16px 16px 0 0;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                📊 Financial Intelligence Report
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.85); font-size: 18px;">
                ${displayMonth}
              </p>
            </td>
          </tr>
        </table>

        <!-- Content Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${COLORS.bgCard}; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 0;">
              
              ${healthScoreSection}
              ${executiveSummarySection}
              ${cashFlowSection}
              ${moneyLeaksSection}
              ${spendingSection}
              ${taxSection}
              ${behavioralSection}
              ${actionSection}

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid ${COLORS.border};">
                    <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 13px;">
                      Generated by <strong>Receipt AI Agent</strong> • Powered by Claude AI
                    </p>
                    <p style="margin: 8px 0 0 0;">
                      <a href="${process.env.ADMIN_V2_BASE_URL || '#'}" style="color: ${COLORS.accent}; text-decoration: none; font-weight: 600;">
                        View Full Dashboard →
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

function renderHealthScore(score) {
  if (!score || !score.overall) return '';
  
  const grade = score.grade || 'N/A';
  const gradeColor = getGradeColor(grade);
  const overall = score.overall || 0;
  const components = score.components || {};
  
  // Visual score bar
  const scoreBarColor = overall >= 80 ? COLORS.success : overall >= 60 ? COLORS.warning : COLORS.danger;

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 30px;">
        <!-- Section Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td>
              <h2 style="margin: 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
                🏆 Financial Health Score
              </h2>
            </td>
          </tr>
        </table>

        <!-- Score Display -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, ${COLORS.bgLight} 0%, #edf2f7 100%); border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <!-- Big Score -->
              <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: ${COLORS.bgCard}; box-shadow: 0 4px 15px rgba(0,0,0,0.1); line-height: 120px; margin-bottom: 15px;">
                <span style="font-size: 42px; font-weight: 800; color: ${scoreBarColor};">${overall}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="display: inline-block; padding: 6px 16px; background: ${gradeColor}; color: #fff; font-size: 18px; font-weight: 700; border-radius: 20px;">
                  Grade: ${grade}
                </span>
              </div>
              <p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 14px;">
                Trend: <strong style="color: ${score.trend === 'improving' ? COLORS.success : score.trend === 'declining' ? COLORS.danger : COLORS.textSecondary};">${score.trend || 'stable'}</strong>
              </p>
            </td>
          </tr>
        </table>

        <!-- Component Scores -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
          <tr>
            ${renderScoreComponent('💰 Savings', components.savings_discipline)}
            ${renderScoreComponent('📊 Spending', components.spending_efficiency)}
          </tr>
          <tr>
            ${renderScoreComponent('⚖️ Balance', components.category_balance)}
            ${renderScoreComponent('🛡️ Tax Opt.', components.tax_optimization)}
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderScoreComponent(label, score) {
  if (score === undefined || score === null) return '<td></td>';
  const color = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;
  
  return `
  <td style="width: 50%; padding: 8px;">
    <div style="background: ${COLORS.bgLight}; border-radius: 8px; padding: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: ${COLORS.textSecondary}; font-size: 13px;">${label}</span>
        <span style="color: ${color}; font-weight: 700; font-size: 16px;">${score}</span>
      </div>
      <div style="margin-top: 8px; height: 6px; background: ${COLORS.border}; border-radius: 3px; overflow: hidden;">
        <div style="width: ${score}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
      </div>
    </div>
  </td>`;
}

function renderExecutiveSummary(exec) {
  if (!exec || (!exec.headline && !exec.key_insight)) return '';
  
  const moodColor = getMoodColor(exec.mood);
  const moodEmoji = { excellent: '🌟', good: '✅', cautious: '⚠️', concerning: '🔶', critical: '🚨' };
  
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, ${moodColor}15 0%, ${moodColor}08 100%); border-left: 4px solid ${moodColor}; border-radius: 0 12px 12px 0;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="margin: 0 0 10px 0; color: ${moodColor}; font-size: 18px; font-weight: 700;">
                ${moodEmoji[exec.mood] || '📋'} ${exec.headline || 'Monthly Summary'}
              </h3>
              <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 15px; line-height: 1.6;">
                ${exec.key_insight || 'Analysis complete.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderCashFlow(cf) {
  if (!cf || !cf.total_expenses) return '';
  
  const statusColors = { Healthy: COLORS.success, Moderate: COLORS.warning, Elevated: COLORS.concerning, Critical: COLORS.danger };
  const statusColor = statusColors[cf.burn_rate_status] || COLORS.textSecondary;
  
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          💸 Cash Flow Analysis
        </h2>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="width: 33%; padding: 8px;">
              <div style="background: ${COLORS.success}15; border-radius: 10px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase;">Income</p>
                <p style="margin: 0; color: ${COLORS.success}; font-size: 20px; font-weight: 700;">${cf.total_income || '$0'}</p>
              </div>
            </td>
            <td style="width: 33%; padding: 8px;">
              <div style="background: ${COLORS.danger}15; border-radius: 10px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase;">Expenses</p>
                <p style="margin: 0; color: ${COLORS.danger}; font-size: 20px; font-weight: 700;">${cf.total_expenses || '$0'}</p>
              </div>
            </td>
            <td style="width: 33%; padding: 8px;">
              <div style="background: ${COLORS.primary}10; border-radius: 10px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase;">Net Flow</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">${cf.net_cash_flow || '$0'}</p>
              </div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
          <tr>
            <td style="padding: 15px; background: ${COLORS.bgLight}; border-radius: 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="color: ${COLORS.textSecondary}; font-size: 13px;">Burn Rate:</span>
                    <span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: ${statusColor}20; color: ${statusColor}; font-size: 12px; font-weight: 600; border-radius: 12px;">
                      ${cf.burn_rate_status || 'Unknown'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <span style="color: ${COLORS.textSecondary}; font-size: 13px;">Savings Rate:</span>
                    <strong style="margin-left: 8px; color: ${COLORS.success};">${cf.savings_rate_percent || 0}%</strong>
                  </td>
                </tr>
              </table>
              ${cf.insight ? `<p style="margin: 12px 0 0 0; color: ${COLORS.textSecondary}; font-size: 14px; line-height: 1.5;">${cf.insight}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderMoneyLeaks(leaks) {
  if (!leaks || leaks.length === 0) return '';
  
  const leakRows = leaks.slice(0, 5).map(leak => {
    const severityColor = getSeverityColor(leak.severity);
    const typeEmoji = { subscription_creep: '🔄', convenience_tax: '💨', impulse: '⚡', recurring_waste: '🗑️' };
    
    return `
    <tr style="border-bottom: 1px solid ${COLORS.border};">
      <td style="padding: 12px 0;">
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: 18px; margin-right: 10px;">${typeEmoji[leak.leak_type] || '💧'}</span>
          <div>
            <p style="margin: 0; font-weight: 600; color: ${COLORS.textPrimary}; font-size: 14px;">${leak.category}</p>
            <p style="margin: 4px 0 0 0; color: ${COLORS.textMuted}; font-size: 13px;">${leak.description}</p>
          </div>
        </div>
      </td>
      <td style="padding: 12px 0; text-align: right; vertical-align: top;">
        <p style="margin: 0; color: ${COLORS.danger}; font-weight: 700; font-size: 14px;">${leak.monthly_cost}/mo</p>
        <p style="margin: 4px 0 0 0; color: ${COLORS.textMuted}; font-size: 12px;">= ${leak.annual_impact}/yr</p>
        <span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background: ${severityColor}20; color: ${severityColor}; font-size: 11px; font-weight: 600; border-radius: 10px; text-transform: uppercase;">
          ${leak.severity}
        </span>
      </td>
    </tr>`;
  }).join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          🚨 Money Leaks Detected
        </h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tbody>
            ${leakRows}
          </tbody>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderSpending(breakdown) {
  if (!breakdown || breakdown.length === 0) return '';
  
  const categoryEmojis = {
    'Housing': '🏠', 'Transportation': '🚗', 'Dining': '🍽️', 'Groceries': '🛒',
    'Utilities': '💡', 'Entertainment': '🎬', 'Shopping': '🛍️', 'Healthcare': '🏥',
    'Subscriptions': '📱', 'Insurance': '🛡️', 'Education': '📚', 'Travel': '✈️',
    'Personal Care': '💅', 'Financial': '🏦', 'Gifts': '🎁', 'Pets': '🐕', 'Income': '💰'
  };

  const rows = breakdown.slice(0, 8).map(item => {
    const flagColor = getFlagColor(item.flag);
    const trendIcon = item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️';
    const emoji = Object.entries(categoryEmojis).find(([k]) => item.category?.includes(k))?.[1] || '📊';
    
    return `
    <tr style="border-bottom: 1px solid ${COLORS.border};">
      <td style="padding: 10px 0;">
        <span style="font-size: 16px; margin-right: 8px;">${emoji}</span>
        <span style="color: ${COLORS.textPrimary}; font-weight: 500;">${item.category}</span>
      </td>
      <td style="padding: 10px 0; text-align: center;">
        <span style="color: ${COLORS.textPrimary}; font-weight: 600;">${item.amount}</span>
      </td>
      <td style="padding: 10px 0; text-align: center;">
        <span style="color: ${COLORS.textSecondary};">${item.percentage}%</span>
      </td>
      <td style="padding: 10px 0; text-align: center;">
        <span>${trendIcon}</span>
      </td>
      <td style="padding: 10px 0; text-align: right;">
        <span style="padding: 2px 8px; background: ${flagColor}20; color: ${flagColor}; font-size: 11px; font-weight: 600; border-radius: 10px;">
          ${item.flag || 'normal'}
        </span>
      </td>
    </tr>`;
  }).join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          📊 Spending Breakdown
        </h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid ${COLORS.border};">
              <th style="padding: 10px 0; text-align: left; color: ${COLORS.textMuted}; font-weight: 600; font-size: 12px;">Category</th>
              <th style="padding: 10px 0; text-align: center; color: ${COLORS.textMuted}; font-weight: 600; font-size: 12px;">Amount</th>
              <th style="padding: 10px 0; text-align: center; color: ${COLORS.textMuted}; font-weight: 600; font-size: 12px;">%</th>
              <th style="padding: 10px 0; text-align: center; color: ${COLORS.textMuted}; font-weight: 600; font-size: 12px;">Trend</th>
              <th style="padding: 10px 0; text-align: right; color: ${COLORS.textMuted}; font-weight: 600; font-size: 12px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderTaxOptimization(tax) {
  if (!tax || (!tax.potential_deductions?.length && !tax.recommendations?.length)) return '';
  
  const deductionRows = (tax.potential_deductions || []).slice(0, 5).map(d => {
    const confColor = { high: COLORS.success, medium: COLORS.warning, low: COLORS.textMuted };
    return `
    <tr style="border-bottom: 1px solid ${COLORS.border};">
      <td style="padding: 10px 0; color: ${COLORS.textPrimary}; font-weight: 500;">${d.item}</td>
      <td style="padding: 10px 0; color: ${COLORS.textSecondary};">${d.category}</td>
      <td style="padding: 10px 0; color: ${COLORS.success}; font-weight: 600;">${d.amount}</td>
      <td style="padding: 10px 0;">
        <span style="padding: 2px 8px; background: ${confColor[d.confidence] || COLORS.textMuted}20; color: ${confColor[d.confidence] || COLORS.textMuted}; font-size: 11px; border-radius: 10px;">
          ${d.confidence}
        </span>
      </td>
    </tr>`;
  }).join('');

  const recommendationsList = (tax.recommendations || []).map(r => 
    `<li style="margin-bottom: 8px; color: ${COLORS.textSecondary}; font-size: 14px;">${r}</li>`
  ).join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          🛡️ Tax Optimization
        </h2>
        
        ${tax.estimated_tax_savings ? `
        <div style="background: ${COLORS.success}15; border-radius: 10px; padding: 16px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0 0 5px 0; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase;">Estimated Tax Savings</p>
          <p style="margin: 0; color: ${COLORS.success}; font-size: 28px; font-weight: 800;">${tax.estimated_tax_savings}</p>
        </div>` : ''}

        ${deductionRows ? `
        <h3 style="margin: 0 0 15px 0; color: ${COLORS.textSecondary}; font-size: 14px; font-weight: 600;">Potential Deductions</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid ${COLORS.border};">
              <th style="padding: 8px 0; text-align: left; color: ${COLORS.textMuted};">Item</th>
              <th style="padding: 8px 0; text-align: left; color: ${COLORS.textMuted};">Type</th>
              <th style="padding: 8px 0; text-align: left; color: ${COLORS.textMuted};">Amount</th>
              <th style="padding: 8px 0; text-align: left; color: ${COLORS.textMuted};">Confidence</th>
            </tr>
          </thead>
          <tbody>${deductionRows}</tbody>
        </table>` : ''}

        ${recommendationsList ? `
        <h3 style="margin: 20px 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px; font-weight: 600;">Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px;">${recommendationsList}</ul>` : ''}
      </td>
    </tr>
  </table>`;
}

function renderBehavioralInsights(behavioral) {
  if (!behavioral || (!behavioral.spending_patterns?.length && !behavioral.risk_factors?.length && !behavioral.positive_habits?.length)) return '';

  const patterns = (behavioral.spending_patterns || []).map(p => {
    const impactColor = { positive: COLORS.success, neutral: COLORS.textMuted, negative: COLORS.danger };
    const impactIcon = { positive: '✅', neutral: '➖', negative: '⚠️' };
    return `
    <div style="background: ${COLORS.bgLight}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
      <p style="margin: 0; font-weight: 600; color: ${COLORS.textPrimary};">
        ${impactIcon[p.impact] || '📊'} ${p.pattern}
      </p>
      <p style="margin: 6px 0 0 0; color: ${COLORS.textSecondary}; font-size: 13px;">${p.description}</p>
    </div>`;
  }).join('');

  const risks = (behavioral.risk_factors || []).map(r => 
    `<span style="display: inline-block; margin: 4px; padding: 4px 10px; background: ${COLORS.danger}15; color: ${COLORS.danger}; font-size: 12px; border-radius: 15px;">⚠️ ${r}</span>`
  ).join('');

  const positives = (behavioral.positive_habits || []).map(h => 
    `<span style="display: inline-block; margin: 4px; padding: 4px 10px; background: ${COLORS.success}15; color: ${COLORS.success}; font-size: 12px; border-radius: 15px;">✅ ${h}</span>`
  ).join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          🧠 Behavioral Insights
        </h2>
        ${patterns}
        ${risks ? `<div style="margin-top: 15px;"><strong style="color: ${COLORS.textSecondary}; font-size: 13px;">Risk Factors:</strong><div style="margin-top: 8px;">${risks}</div></div>` : ''}
        ${positives ? `<div style="margin-top: 15px;"><strong style="color: ${COLORS.textSecondary}; font-size: 13px;">Positive Habits:</strong><div style="margin-top: 8px;">${positives}</div></div>` : ''}
      </td>
    </tr>
  </table>`;
}

function renderActionPlan(plan) {
  if (!plan || (!plan.immediate?.length && !plan.short_term?.length && !plan.long_term?.length)) return '';

  const immediateRows = (plan.immediate || []).slice(0, 5).map((a, i) => {
    const effortColor = { '5min': COLORS.success, '1hour': COLORS.warning, '1day': COLORS.concerning, '1week': COLORS.danger };
    return `
    <tr style="border-bottom: 1px solid ${COLORS.border};">
      <td style="padding: 12px 0; width: 30px; vertical-align: top;">
        <span style="display: inline-block; width: 24px; height: 24px; background: ${COLORS.accent}; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">
          ${a.priority || i + 1}
        </span>
      </td>
      <td style="padding: 12px 0; padding-left: 10px;">
        <p style="margin: 0; color: ${COLORS.textPrimary}; font-weight: 500; font-size: 14px;">${a.action}</p>
        <p style="margin: 6px 0 0 0;">
          <span style="display: inline-block; margin-right: 10px; padding: 2px 8px; background: ${COLORS.success}15; color: ${COLORS.success}; font-size: 11px; border-radius: 10px;">
            Save: ${a.potential_savings}
          </span>
          <span style="display: inline-block; padding: 2px 8px; background: ${effortColor[a.effort] || COLORS.textMuted}15; color: ${effortColor[a.effort] || COLORS.textMuted}; font-size: 11px; border-radius: 10px;">
            ⏱️ ${a.effort}
          </span>
        </p>
      </td>
    </tr>`;
  }).join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="margin: 0 0 20px 0; color: ${COLORS.primary}; font-size: 20px; font-weight: 700;">
          🎯 Action Plan
        </h2>
        
        <div style="background: ${COLORS.accent}10; border-left: 4px solid ${COLORS.accent}; border-radius: 0 10px 10px 0; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: ${COLORS.accent}; font-size: 16px; font-weight: 700;">
            ⚡ Quick Wins (Do This Week)
          </h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tbody>${immediateRows}</tbody>
          </table>
        </div>

        ${(plan.short_term?.length) ? `
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px; font-weight: 600;">📅 This Month</h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px;">
          ${plan.short_term.slice(0, 3).map(s => `<li style="margin-bottom: 8px; color: ${COLORS.textSecondary}; font-size: 14px;">${s.action} <em style="color: ${COLORS.textMuted};">(${s.timeline})</em></li>`).join('')}
        </ul>` : ''}

        ${(plan.long_term?.length) ? `
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px; font-weight: 600;">🎯 Long-Term Goals</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${plan.long_term.slice(0, 3).map(l => `<li style="margin-bottom: 8px; color: ${COLORS.textSecondary}; font-size: 14px;"><strong>${l.goal}</strong>: ${l.strategy}</li>`).join('')}
        </ul>` : ''}
      </td>
    </tr>
  </table>`;
}
