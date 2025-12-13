import axios from 'axios';
import { prisma } from './prisma.js';
import { getMetrics } from './metricsService.js';
import { monthKeyFromDate } from './receiptService.js';

const AI_ANALYSIS_MODEL = process.env.AI_ANALYSIS_MODEL || 'anthropic/claude-3.5-sonnet';
const AI_ANALYSIS_ROLE = process.env.AI_ANALYSIS_ROLE || 'Certified Personal Finance Expert';

function buildPrompt(monthKey, metrics, context = {}) {
  const lines = metrics.map((metric) => {
    if (metric.valueNumeric !== null && metric.valueNumeric !== undefined) {
      return `${metric.metricKey}: ${metric.valueNumeric} (${metric.unit || 'raw'})`;
    }
    if (metric.valueJson) {
      return `${metric.metricKey}: ${JSON.stringify(metric.valueJson)}`;
    }
    return `${metric.metricKey}: n/a`;
  });

  return `You are ${AI_ANALYSIS_ROLE}. Analyze the user's personal finances for month ${monthKey}.
  
CONTEXT & DATA:
${JSON.stringify(context, null, 2)}

METRICS SUMMARY:
${lines.join('\n')}

YOUR MISSION:
Find leaks, identify "convenience tax" (overspending on small items), highlight "subscription creep", and maximize tax deductions.

Respond ONLY with valid JSON matching this structure:
{
  "executive_summary": "High-level financial health check (max 3 sentences)",
  "cash_flow_analysis": {
    "burn_rate_status": "Safe/Warning/Critical",
    "net_savings": "string with currency",
    "insight": "string"
  },
  "tax_strategy": [
    {"item": "string", "category": "string", "deduction_potential": "High/Medium/Low", "reason": "string"}
  ],
  "savings_opportunities": [
    {
      "title": "string (e.g., 'Coffee Habit')", 
      "current_spend": "string", 
      "projected_annual_savings": "string", 
      "action_plan": "string"
    }
  ],
  "spending_breakdown": [
    {"category": "string", "percentage": number, "trend": "up/down/flat"}
  ]
}`;
}

export async function generateMonthlyAnalysis(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  
  // Fetch Metrics
  const metrics = await getMetrics(effectiveMonth);
  if (!metrics.length) {
    throw new Error(`No metrics found for ${effectiveMonth}. Run computeMonthlyMetrics first.`);
  }

  const endDate = new Date(`${effectiveMonth}-01`);
  endDate.setMonth(endDate.getMonth() + 1);

  // Fetch Raw Data for Deep Dive
  const receipts = await prisma.receipt.findMany({
    where: { 
      transactionDate: {
        gte: new Date(`${effectiveMonth}-01`),
        lt: endDate
      }
    },
    include: { items: true },
    take: 50 // limit context window
  });
  
  const rawContext = {
    receipt_count: receipts.length,
    sample_items: receipts.flatMap(r => r.items).slice(0, 30).map(i => `${i.name} ($${i.totalPrice})`)
  };

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY missing');
  }

  const prompt = buildPrompt(effectiveMonth, metrics, rawContext);

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: AI_ANALYSIS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an elite financial coach specializing in personal finance optimization, tax strategy, and wealth generation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  let content = response.data.choices?.[0]?.message?.content || '';
  content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.warn("AI JSON parse failed, using fallback:", e);
    parsed = { executive_summary: "Analysis failed to parse." };
  }

  // Map AI response to DB schema
  const report = await prisma.analysisReport.upsert({
    where: {
      month_model: {
        month: effectiveMonth,
        model: AI_ANALYSIS_MODEL
      }
    },
    update: {
      summaryText: parsed.executive_summary || 'No summary provided.',
      recommendations: parsed.savings_opportunities || [], // Mapping new structure to existing schema field
      vehicleInsights: parsed.cash_flow_analysis || {}, // Storing cash flow in vehicle insights slot (or schema update needed)
      spendingBreakdown: parsed.spending_breakdown || [],
      rawResponse: parsed
    },
    create: {
      month: effectiveMonth,
      model: AI_ANALYSIS_MODEL,
      role: AI_ANALYSIS_ROLE,
      summaryText: parsed.executive_summary || 'No summary provided.',
      recommendations: parsed.savings_opportunities || [],
      vehicleInsights: parsed.cash_flow_analysis || {},
      spendingBreakdown: parsed.spending_breakdown || [],
      rawResponse: parsed
    }
  });

  return report;
}

export function getAnalysisReport(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  return prisma.analysisReport.findFirst({
    where: { month: effectiveMonth },
    orderBy: { createdAt: 'desc' }
  });
}
