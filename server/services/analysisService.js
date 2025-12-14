/**
 * Analysis Service - Professional Monthly Financial Analysis
 * 
 * Uses OpenRouter reasoningChat for deep financial analysis
 * with reasoning.effort: high for complex thinking
 */

import { prisma } from './prisma.js';
import { getMetrics, computeMonthlyMetrics } from './metricsService.js';
import { monthKeyFromDate } from './receiptService.js';
import { reasoningChat } from '../lib/openrouter-client.js';

const AI_ANALYSIS_ROLE = process.env.AI_ANALYSIS_ROLE || 'CFP® Certified Financial Planner & CPA';

/**
 * Build comprehensive financial analysis prompt
 */
function buildPrompt(monthKey, metrics, context = {}) {
  const lines = metrics.map((metric) => {
    if (metric.valueNumeric !== null && metric.valueNumeric !== undefined) {
      return `• ${metric.metricKey}: ${metric.valueNumeric} (${metric.unit || 'raw'})`;
    }
    if (metric.valueJson) {
      return `• ${metric.metricKey}: ${JSON.stringify(metric.valueJson)}`;
    }
    return `• ${metric.metricKey}: n/a`;
  });

  // Calculate month name for better context
  const [year, month] = monthKey.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[parseInt(month) - 1] || month;

  return `You are a ${AI_ANALYSIS_ROLE} with 20+ years of experience in personal wealth management, tax optimization, and behavioral finance.

═══════════════════════════════════════════════════════════════
📊 MONTHLY FINANCIAL ANALYSIS REQUEST
═══════════════════════════════════════════════════════════════
Period: ${monthName} ${year}

─────────────────────────────────────────────────────────────────
📈 RAW FINANCIAL DATA
─────────────────────────────────────────────────────────────────
${JSON.stringify(context, null, 2)}

─────────────────────────────────────────────────────────────────
📊 COMPUTED METRICS
─────────────────────────────────────────────────────────────────
${lines.join('\n')}

═══════════════════════════════════════════════════════════════
🎯 YOUR MISSION AS A FIDUCIARY ADVISOR
═══════════════════════════════════════════════════════════════

Perform a COMPREHENSIVE financial analysis covering:

1. **FINANCIAL HEALTH SCORE** (0-100)
   - Liquidity, debt management, savings rate, spending discipline

2. **CASH FLOW FORENSICS**
   - Identify "money leaks" (recurring small charges that add up)
   - Detect "convenience tax" (premium paid for convenience vs value)
   - Flag "subscription creep" (unused or forgotten subscriptions)
   - Calculate true discretionary vs essential spending ratio

3. **TAX OPTIMIZATION OPPORTUNITIES**
   - Identify potential deductible expenses
   - Suggest timing strategies for deductions
   - Flag business expense candidates

4. **BEHAVIORAL INSIGHTS**
   - Spending pattern anomalies
   - Emotional spending triggers (weekends, late night, etc.)
   - Category concentration risks

5. **ACTIONABLE RECOMMENDATIONS**
   - Prioritized by potential savings impact
   - Specific, measurable action items
   - Timeline for implementation

═══════════════════════════════════════════════════════════════

Respond ONLY with valid JSON matching this EXACT structure:
{
  "financial_health_score": {
    "overall": number (0-100),
    "components": {
      "savings_discipline": number (0-100),
      "spending_efficiency": number (0-100),
      "category_balance": number (0-100),
      "tax_optimization": number (0-100)
    },
    "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D/F",
    "trend": "improving/stable/declining"
  },
  "executive_summary": {
    "headline": "One-line financial status (max 15 words)",
    "key_insight": "The most important finding (2-3 sentences)",
    "mood": "excellent/good/cautious/concerning/critical"
  },
  "cash_flow_analysis": {
    "total_income": "string with currency",
    "total_expenses": "string with currency",
    "net_cash_flow": "string with currency (+ or -)",
    "burn_rate_status": "Healthy/Moderate/Elevated/Critical",
    "savings_rate_percent": number,
    "days_of_runway": number or null,
    "insight": "2-3 sentences on cash flow health"
  },
  "money_leaks": [
    {
      "category": "string",
      "leak_type": "subscription_creep/convenience_tax/impulse/recurring_waste",
      "description": "string",
      "monthly_cost": "string with currency",
      "annual_impact": "string with currency",
      "severity": "high/medium/low",
      "fix_difficulty": "easy/medium/hard"
    }
  ],
  "spending_breakdown": [
    {
      "category": "string",
      "amount": "string with currency",
      "percentage": number,
      "trend": "up/down/flat",
      "vs_benchmark": "above/at/below average",
      "flag": "normal/watch/warning/alert" 
    }
  ],
  "tax_optimization": {
    "potential_deductions": [
      {
        "item": "string",
        "category": "string",
        "amount": "string with currency",
        "deduction_type": "business/medical/charitable/home_office/other",
        "confidence": "high/medium/low",
        "action_required": "string"
      }
    ],
    "estimated_tax_savings": "string with currency",
    "recommendations": ["string"]
  },
  "behavioral_insights": {
    "spending_patterns": [
      {
        "pattern": "string (e.g., 'Weekend Splurge')",
        "description": "string",
        "impact": "positive/neutral/negative"
      }
    ],
    "risk_factors": ["string"],
    "positive_habits": ["string"]
  },
  "action_plan": {
    "immediate": [
      {
        "priority": 1,
        "action": "string",
        "potential_savings": "string with currency",
        "effort": "5min/1hour/1day/1week",
        "category": "cancel/negotiate/switch/optimize"
      }
    ],
    "short_term": [
      {
        "priority": number,
        "action": "string",
        "timeline": "string",
        "expected_outcome": "string"
      }
    ],
    "long_term": [
      {
        "goal": "string",
        "strategy": "string",
        "projected_annual_benefit": "string with currency"
      }
    ]
  },
  "monthly_comparison": {
    "vs_last_month": "better/same/worse",
    "notable_changes": ["string"]
  }
}`;
}

export async function generateMonthlyAnalysis(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  
  // Fetch Metrics - auto-compute if missing
  let metrics = await getMetrics(effectiveMonth);
  if (!metrics.length) {
    console.log(`📊 Auto-computing metrics for ${effectiveMonth}...`);
    await computeMonthlyMetrics(effectiveMonth);
    metrics = await getMetrics(effectiveMonth);
  }
  
  if (!metrics.length) {
    throw new Error(`No data found for ${effectiveMonth}. Please upload receipts first.`);
  }

  const endDate = new Date(`${effectiveMonth}-01`);
  endDate.setMonth(endDate.getMonth() + 1);

  // Fetch Raw Data for Deep Dive - include more context
  const receipts = await prisma.receipt.findMany({
    where: { 
      transactionDate: {
        gte: new Date(`${effectiveMonth}-01`),
        lt: endDate
      }
    },
    include: { items: true },
    orderBy: { totalAmount: 'desc' },
    take: 100 // More context for better analysis
  });

  // Build rich context for AI
  const categoryTotals = {};
  const paymentMethodTotals = {};
  const merchantFrequency = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  receipts.forEach(r => {
    const amount = parseFloat(r.totalAmount) || 0;
    const cat = r.category || 'Uncategorized';
    const merchant = r.storeName || 'Unknown';
    const payment = r.paymentMethod || 'Unknown';

    if (r.type === 'INCOME') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    }

    paymentMethodTotals[payment] = (paymentMethodTotals[payment] || 0) + amount;
    merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
  });

  // Top merchants by frequency
  const topMerchants = Object.entries(merchantFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, visits: count }));

  // Recent transactions for pattern analysis
  const recentTransactions = receipts.slice(0, 30).map(r => ({
    merchant: r.storeName,
    amount: parseFloat(r.totalAmount),
    category: r.category,
    subcategory: r.subcategory,
    date: r.transactionDate,
    dayOfWeek: new Date(r.transactionDate).toLocaleDateString('en-US', { weekday: 'long' }),
    isRecurring: r.isRecurring,
    paymentMethod: r.paymentMethod
  }));

  const rawContext = {
    summary: {
      total_transactions: receipts.length,
      total_income: `$${totalIncome.toFixed(2)}`,
      total_expenses: `$${totalExpenses.toFixed(2)}`,
      net_cash_flow: `$${(totalIncome - totalExpenses).toFixed(2)}`
    },
    spending_by_category: Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ category: cat, amount: `$${amt.toFixed(2)}` })),
    payment_methods: Object.entries(paymentMethodTotals)
      .map(([method, amt]) => ({ method, amount: `$${amt.toFixed(2)}` })),
    top_merchants: topMerchants,
    recent_transactions: recentTransactions
  };

  const prompt = buildPrompt(effectiveMonth, metrics, rawContext);

  // Use reasoning chat for deep financial analysis
  console.log(`🧠 Generating comprehensive financial analysis for ${effectiveMonth}...`);
  
  const messages = [
    {
      role: 'system',
      content: `You are an elite wealth advisor combining the expertise of a CFP®, CPA, and behavioral economist. 
Your analysis is thorough, actionable, and personalized. You identify patterns others miss.
Always think like a fiduciary - the client's financial wellbeing is paramount.
Be specific with numbers and recommendations. Avoid generic advice.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const result = await reasoningChat(messages, { temperature: 0.15, maxTokens: 6000 });
    
    console.log(`🧠 Reasoning model: ${result.model}`);
    console.log(`📊 Tokens used: ${result.usage.totalTokens}`);

    let content = result.content;
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.warn("AI JSON parse failed, attempting repair...", e.message);
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = { executive_summary: { headline: "Analysis parsing error", key_insight: content.slice(0, 500), mood: "cautious" }};
        }
      } else {
        parsed = { executive_summary: { headline: "Analysis failed", key_insight: "Could not parse AI response", mood: "concerning" }};
      }
    }

    // Map AI response to DB schema with enhanced data
    const report = await prisma.analysisReport.upsert({
      where: {
        month_model: {
          month: effectiveMonth,
          model: result.model
        }
      },
      update: {
        summaryText: parsed.executive_summary?.headline || parsed.executive_summary || 'No summary',
        recommendations: parsed.action_plan?.immediate || [],
        vehicleInsights: parsed.cash_flow_analysis || {},
        spendingBreakdown: parsed.spending_breakdown || [],
        rawResponse: parsed,
        tokensUsed: result.usage.totalTokens
      },
      create: {
        month: effectiveMonth,
        model: result.model,
        role: AI_ANALYSIS_ROLE,
        summaryText: parsed.executive_summary?.headline || parsed.executive_summary || 'No summary',
        recommendations: parsed.action_plan?.immediate || [],
        vehicleInsights: parsed.cash_flow_analysis || {},
        spendingBreakdown: parsed.spending_breakdown || [],
        rawResponse: parsed,
        tokensUsed: result.usage.totalTokens
      }
    });

    return report;
  } catch (error) {
    console.error('❌ Analysis generation failed:', error.message);
    throw error;
  }
}

export function getAnalysisReport(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  return prisma.analysisReport.findFirst({
    where: { month: effectiveMonth },
    orderBy: { createdAt: 'desc' }
  });
}
