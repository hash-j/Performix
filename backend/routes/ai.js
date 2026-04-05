const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Simulated AI helper to act as the AI Brain (In production, replace with OpenAI API call)
const simulatedAiInsight = (kpis, entries) => {
    // A primitive rule engine to simulate an LLM analyzing the data
    const insights = [];
    
    kpis.forEach(kpi => {
        const kpiEntries = entries.filter(e => e.kpi_id === kpi.id).sort((a,b) => new Date(a.date) - new Date(b.date));
        if(kpiEntries.length >= 2) {
            const latest = Number(kpiEntries[kpiEntries.length - 1].value);
            const prev = Number(kpiEntries[kpiEntries.length - 2].value);
            
            if (latest > prev && latest >= Number(kpi.target_value)) {
                insights.push(`🚀 **${kpi.name}** is performing exceptionally well! You exceeded the target and grew from ${prev} to ${latest}.`);
            } else if (latest < prev) {
                const dropPercent = (((prev - latest) / prev) * 100).toFixed(1);
                insights.push(`⚠️ **Alert:** **${kpi.name}** dropped ${dropPercent}% compared to the previous period. Recommend investigating the cause.`);
            } else {
                insights.push(`💡 **${kpi.name}** is stable but currently below the target of ${kpi.target_value}.`);
            }
        } else if (kpiEntries.length === 1) {
            insights.push(`📊 **${kpi.name}** has its first data point. Keep logging more data to see trends and forecasts!`);
        }
    });

    if (insights.length === 0) {
        return ["👋 Welcome! I am your AI Assistant. Start adding KPIs and logging data, and I will automatically generate actionable insights here."];
    }
    return insights;
};

// 1. Smart Insights Engine
router.get('/insights', async (req, res) => {
    try {
        const { company_id } = req.user;

        // Fetch all definitions
        const kpisRes = await db.query('SELECT * FROM kpi_definitions WHERE company_id = $1', [company_id]);
        
        // Fetch all entries for this company
        const entriesRes = await db.query(`
            SELECT e.* FROM kpi_entries e
            JOIN kpi_definitions d ON e.kpi_id = d.id
            WHERE d.company_id = $1
        `, [company_id]);

        const insights = simulatedAiInsight(kpisRes.rows, entriesRes.rows);

        // Simulate network delay for AI processing
        setTimeout(() => {
            res.json({ insights });
        }, 1200);

    } catch (error) {
        console.error('AI Insights Error:', error);
        res.status(500).json({ error: 'Failed to generate AI insights' });
    }
});

// 2. AI KPI Suggestions
router.post('/suggest-kpis', async (req, res) => {
    try {
        const { industry } = req.body;
        
        // Simulate GPT-4 generating tailored KPIs
        let suggestions = [];
        
        if (industry?.toLowerCase().includes('tech') || industry?.toLowerCase().includes('software')) {
            suggestions = [
                { name: 'Monthly Recurring Revenue (MRR)', type: 'currency', target_value: 10000 },
                { name: 'Churn Rate', type: 'percentage', target_value: 2 },
                { name: 'Active Users', type: 'numeric', target_value: 5000 }
            ];
        } else if (industry?.toLowerCase().includes('retail') || industry?.toLowerCase().includes('ecommerce')) {
            suggestions = [
                { name: 'Average Order Value', type: 'currency', target_value: 85 },
                { name: 'Cart Abandonment Rate', type: 'percentage', target_value: 25 },
                { name: 'Total Daily Sales', type: 'currency', target_value: 5000 }
            ];
        } else {
            suggestions = [
                { name: 'Gross Revenue', type: 'currency', target_value: 25000 },
                { name: 'Client Acquisition Cost', type: 'currency', target_value: 150 },
                { name: 'Employee Productivity', type: 'percentage', target_value: 85 }
            ];
        }

        setTimeout(() => {
            res.json(suggestions);
        }, 1500);

    } catch (error) {
        console.error('AI Suggestion Error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

// 3. AI Chat Assistant
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Very basic mock conversational AI
        let reply = "I am processing your data. Can you provide more specifics about what metric you want to analyze?";
        
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('predict') || lowerMsg.includes('forecast')) {
            reply = "Based on my regression models of your logged data, I forecast a 12% growth over the next 30 days if current trajectory holds.";
        } else if (lowerMsg.includes('drop') || lowerMsg.includes('low')) {
            reply = "I've analyzed your historical entries. The recent drop correlates with the typical mid-month slump. I recommend pushing marketing spend by 15% to offset this.";
        } else if (lowerMsg.includes('best') || lowerMsg.includes('top')) {
            reply = "Your best performing metric historically is MRR. It usually sees the highest spikes on Mondays and Tuesdays.";
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            reply = "Hello there! I'm your SaaS AI executive assistant. How can we optimize your business today?";
        }

        setTimeout(() => {
            res.json({ reply });
        }, 1000);

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: 'Failed to chat with AI' });
    }
});

module.exports = router;
