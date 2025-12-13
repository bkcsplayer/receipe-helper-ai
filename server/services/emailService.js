import nodemailer from 'nodemailer';
import { prisma } from './prisma.js';
import { getMetrics } from './metricsService.js';
import { getAnalysisReport } from './analysisService.js';
import { monthKeyFromDate } from './receiptService.js';

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default fallback
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    : undefined
};

// Fallback logic for development
if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
  console.warn("⚠️ SMTP not configured. Emails will be logged to console instead of sent.");
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
    subject: `💰 Wealth & Optimization Report – ${monthKey}`,
    html
  });

  // Find existing job or create new one
  const existingJob = await prisma.emailJob.findFirst({
    where: { month: monthKey }
  });

  if (existingJob) {
    await prisma.emailJob.update({
      where: { id: existingJob.id },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });
  } else {
    await prisma.emailJob.create({
      data: {
        month: monthKey,
        status: 'sent',
        sentAt: new Date()
      }
    });
  }
}

function renderEmailTemplate({ monthKey, report, metrics }) {
  // Extract data from the enriched AI report
  const summary = report.summaryText;
  const cashFlow = report.rawResponse?.cash_flow_analysis || {};
  const taxStrategy = report.rawResponse?.tax_strategy || [];
  const opportunities = report.recommendations || []; // mapped from savings_opportunities
  
  // Helper for currency
  const fmt = (val) => val ? val.toString() : 'N/A';

  const taxRows = taxStrategy.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px;">${item.item}</td>
      <td style="padding: 8px;">${item.category}</td>
      <td style="padding: 8px;"><span style="background: #e6fffa; color: #00796b; padding: 2px 6px; border-radius: 4px;">${item.deduction_potential}</span></td>
    </tr>
  `).join('');

  const oppsCards = opportunities.map(opp => `
    <div style="background: #fff8f0; border-left: 4px solid #ff8c42; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
      <h4 style="margin: 0 0 4px 0; color: #d35400;">${opp.title || 'Optimization'}</h4>
      <p style="margin: 0; font-size: 14px;"><strong>Action:</strong> ${opp.action_plan || opp.recommended_action || opp.detail || 'Review and optimize'}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">Potential Savings: <strong>${opp.projected_annual_savings || opp.savings || 'Variable'}</strong></p>
    </div>
  `).join('');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      
      <!-- Header -->
      <div style="background: #2A3A68; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Wealth Report</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.8;">${monthKey}</p>
      </div>

      <!-- Summary -->
      <div style="padding: 20px; background: #fff; border: 1px solid #eee;">
        <h3 style="margin-top: 0; border-bottom: 2px solid #ff8c42; display: inline-block; padding-bottom: 5px;">Executive Summary</h3>
        <p>${summary}</p>
        
        <div style="display: flex; gap: 10px; margin-top: 15px;">
           <div style="flex: 1; background: #f4f6f8; padding: 10px; border-radius: 4px; text-align: center;">
             <span style="display: block; font-size: 12px; color: #666;">Burn Rate</span>
             <strong style="color: ${cashFlow.burn_rate_status === 'Critical' ? 'red' : 'green'};">${cashFlow.burn_rate_status || 'N/A'}</strong>
           </div>
           <div style="flex: 1; background: #f4f6f8; padding: 10px; border-radius: 4px; text-align: center;">
             <span style="display: block; font-size: 12px; color: #666;">Net Savings</span>
             <strong>${cashFlow.net_savings || 'N/A'}</strong>
           </div>
        </div>
      </div>

      <!-- Opportunities -->
      <div style="padding: 20px; background: #fff; border: 1px solid #eee; border-top: none;">
        <h3 style="margin-top: 0; border-bottom: 2px solid #ff8c42; display: inline-block; padding-bottom: 5px;">💸 Profit Opportunities</h3>
        ${oppsCards}
      </div>

      <!-- Tax Strategy -->
      <div style="padding: 20px; background: #fff; border: 1px solid #eee; border-top: none;">
        <h3 style="margin-top: 0; border-bottom: 2px solid #ff8c42; display: inline-block; padding-bottom: 5px;">🛡️ Tax Shield Candidates</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead style="background: #f9f9f9;">
            <tr>
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: left;">Category</th>
              <th style="padding: 8px; text-align: left;">Potential</th>
            </tr>
          </thead>
          <tbody>
            ${taxRows}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>Generated by Receipt AI Agent • <a href="#" style="color: #ff8c42;">View Dashboard</a></p>
      </div>
    </div>
  `;
}
