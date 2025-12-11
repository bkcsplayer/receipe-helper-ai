import axios from 'axios';
import { prisma } from './prisma.js';
import { getMetrics } from './metricsService.js';
import { monthKeyFromDate } from './receiptService.js';

const AI_ANALYSIS_MODEL = process.env.AI_ANALYSIS_MODEL || 'xai/grok-2-latest';
const AI_ANALYSIS_ROLE = process.env.AI_ANALYSIS_ROLE || 'Certified Personal Finance Expert';

function buildPrompt(monthKey, metrics) {
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
Metrics Summary:
${lines.join('\n')}

Respond ONLY with JSON matching:
{
  "executive_summary": "string",
  "risk_alerts": ["string"],
  "optimization_opportunities": [
    {"title": "string", "detail": "string", "recommended_action": "string"}
  ],
  "vehicle_insights": {
    "fuel_cost_per_100km": "string",
    "maintenance_cost_per_100km": "string",
    "suggestions": ["string"]
  },
  "spending_breakdown": [
    {"category": "string", "insight": "string"}
  ]
}`;
}

export async function generateMonthlyAnalysis(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  const metrics = await getMetrics(effectiveMonth);

  if (!metrics.length) {
    throw new Error(`No metrics found for ${effectiveMonth}. Run computeMonthlyMetrics first.`);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY missing');
  }

  const prompt = buildPrompt(effectiveMonth, metrics);

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: AI_ANALYSIS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an elite financial coach specializing in personal finance optimization.'
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
  const parsed = JSON.parse(content);

  const report = await prisma.analysisReport.upsert({
    where: {
      month_model: {
        month: effectiveMonth,
        model: AI_ANALYSIS_MODEL
      }
    },
    update: {
      summaryText: parsed.executive_summary || 'No summary provided.',
      recommendations: parsed.optimization_opportunities || [],
      vehicleInsights: parsed.vehicle_insights || {},
      spendingBreakdown: parsed.spending_breakdown || [],
      rawResponse: parsed
    },
    create: {
      month: effectiveMonth,
      model: AI_ANALYSIS_MODEL,
      role: AI_ANALYSIS_ROLE,
      summaryText: parsed.executive_summary || 'No summary provided.',
      recommendations: parsed.optimization_opportunities || [],
      vehicleInsights: parsed.vehicle_insights || {},
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

