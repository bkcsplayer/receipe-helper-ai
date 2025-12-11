import cron from 'node-cron';
import { computeMonthlyMetrics } from './services/metricsService.js';
import { generateMonthlyAnalysis } from './services/analysisService.js';
import { sendMonthlyReportEmail } from './services/emailService.js';
import { monthKeyFromDate } from './services/receiptService.js';

async function nightlyJob() {
  try {
    const monthKey = monthKeyFromDate(new Date());
    console.log(`🌙 Nightly job started for ${monthKey}`);
    await computeMonthlyMetrics(monthKey);
    const report = await generateMonthlyAnalysis(monthKey);
    console.log(`🧠 Analysis generated for ${monthKey}: ${report.id}`);
    await sendMonthlyReportEmail(monthKey);
    console.log('📧 Monthly email sent');
  } catch (err) {
    console.error('❌ Nightly job failed', err.message);
  }
}

// 2:00 AM daily
cron.schedule('0 2 * * *', nightlyJob, { timezone: 'UTC' });

console.log('🛠️ Worker bootstrapped. Nightly cron scheduled for 02:00 UTC.');

