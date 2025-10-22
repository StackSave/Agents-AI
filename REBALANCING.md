# AI Staking Agents - Rebalancing Feature

## Overview

Fitur rebalancing memungkinkan AI agents untuk secara otomatis menganalisis portfolio staking yang sudah ada dan memberikan rekomendasi rebalancing berdasarkan perubahan kondisi market.

## Architecture

### Components

1. **PortfolioService** (`src/services/PortfolioService.js`)
   - Handle komunikasi dengan backend API
   - CRUD operations untuk portfolio data
   - Menyimpan rebalancing suggestions dan history

2. **RebalancingAgent** (`src/agents/RebalancingAgent.js`)
   - Analyze portfolio untuk rebalancing opportunities
   - Multi-factor trigger system
   - Generate rebalancing suggestions

3. **Orchestrator Integration** (`src/orchestrator.js`)
   - `checkRebalancing()` - Main rebalancing method
   - `getRebalanceHistory()` - Fetch rebalancing history
   - `simulateRebalancing()` - Simulate impact sebelum execution

## Rebalancing Triggers

Sistem menggunakan **kombinasi triggers** untuk determine kapan rebalancing diperlukan:

### 1. APY Change Trigger
- **Threshold**: Default 15% perubahan dari initial APY
- **Logic**: Jika APY berubah signifikan (naik atau turun), suggest rebalancing
- **Example**: Position dengan initial APY 5% sekarang hanya 3.5% → Trigger rebalancing

### 2. Risk Score Change Trigger
- **Threshold**: Default 1.5 points change
- **Logic**: Jika risk score protokol berubah signifikan
- **Example**: Risk score naik dari 3.0 ke 5.0 → Trigger rebalancing untuk reduce risk

### 3. Time Interval Trigger
- **Threshold**: Default 30 hari
- **Logic**: Periodic check untuk ensure portfolio tetap optimal
- **Example**: Sudah 30 hari sejak last rebalance → Check market conditions

### 4. Better Opportunities Trigger
- **Logic**: Detect protokol baru dengan risk-adjusted return >30% lebih baik
- **Example**: Market muncul protokol baru dengan APY 8% risk-adjusted vs portfolio avg 5%

## Rebalancing Suggestions

Agent menganalisis dan generate specific actionable suggestions:

### Types of Suggestions

1. **Rebalance (Move funds)**
   ```javascript
   {
     action: 'rebalance',
     from: {
       protocol: 'OldProtocol',
       currentAPY: '3.2%',
       amountUSD: 5000
     },
     to: {
       protocol: 'Lido',
       apy: '4.5%',
       risk: 'low'
     },
     expectedImprovement: {
       apyIncrease: '+1.3%',
       annualizedGain: '$65.00'
     },
     priority: 'high'
   }
   ```

2. **Diversify (Split concentration)**
   ```javascript
   {
     action: 'diversify',
     details: {
       reason: 'Portfolio too concentrated: 70% in single position',
       recommendation: 'Split into 2-3 positions',
       suggestedAllocation: '40-30-30'
     }
   }
   ```

## Configuration

### Initialization

```javascript
const orchestrator = new StakingOrchestrator({
  backend: {
    backendURL: 'http://localhost:3000/api',
    apiKey: 'your-api-key'
  },
  rebalancing: {
    apyChangePercent: 15,        // APY change threshold (%)
    riskScoreChange: 1.5,         // Risk score change threshold
    timeIntervalDays: 30,         // Time interval for periodic check (days)
    minRebalanceAmount: 100,      // Minimum amount to suggest rebalance ($)
    significantAllocationChange: 10  // Allocation change threshold (%)
  }
});
```

### Backend API Requirements

Expected endpoints:

```
GET  /api/portfolio/id/:portfolioId
     Response: {
       id, user_id, name, total_value_usd,
       target_risk_tolerance,
       positions: [{
         protocol, chain, symbol,
         amount_usd, initial_apy, current_apy,
         entry_date, ...
       }],
       last_rebalance_date
     }

GET  /api/portfolio/:portfolioId/positions
     Response: Array of positions

POST /api/portfolio/:portfolioId/rebalance-suggestion
     Body: { portfolioId, suggestion, timestamp }
     Response: Saved suggestion object

GET  /api/portfolio/:portfolioId/rebalance-history?limit=10
     Response: Array of rebalance history records

PATCH /api/position/:positionId
      Body: { updates }
      Response: Updated position
```

## Usage Examples

### 1. Check Portfolio for Rebalancing

```javascript
const analysis = await orchestrator.checkRebalancing('portfolio_123', {
  riskTolerance: 'medium'
});

if (analysis.shouldRebalance) {
  console.log(`Severity: ${analysis.severity}`); // 'low', 'medium', 'high'
  console.log('Triggered factors:', analysis.triggers);
  console.log('Suggestions:', analysis.suggestions);
  console.log('Estimated impact:', analysis.estimatedImpact);
}
```

### 2. Get Rebalancing History

```javascript
const history = await orchestrator.getRebalanceHistory('portfolio_123', 10);
console.log(`Found ${history.historyCount} records`);
```

### 3. Simulate Rebalancing

```javascript
const rebalancePlan = {
  actions: [
    {
      action: 'rebalance',
      from: { protocol: 'OldProtocol', amountUSD: 5000, ... },
      to: { protocol: 'Lido', apy: '4.5', ... }
    }
  ]
};

const simulation = await orchestrator.simulateRebalancing('portfolio_123', rebalancePlan);

console.log('Current APY:', simulation.current.weightedAPY);
console.log('Projected APY:', simulation.projected.weightedAPY);
console.log('APY Change:', simulation.changes.apyChange);
console.log('Recommendation:', simulation.recommendation); // 'Proceed' or 'Review carefully'
```

## Trigger Severity Calculation

Severity ditentukan berdasarkan severity score:

```javascript
// Each triggered factor contributes to severity score:
- APY change > 25%: +3 points (high)
- APY change > 15%: +2 points (medium)
- Risk change > 2.0: +3 points (high)
- Risk change > 1.5: +2 points (medium)
- Time interval met: +1 point (low)
- Better opportunities (score > 2): +3 points (high)
- Better opportunities (score > 0): +2 points (medium)

// Final severity:
- score >= 6: HIGH
- score >= 3: MEDIUM
- score < 3: LOW
```

## Priority Calculation

Rebalancing suggestions diprioritaskan berdasarkan:

```javascript
HIGH priority if:
- Amount > $5000 AND APY improvement > 2%
- Amount > $2000 AND APY improvement > 1.5%
- APY improvement > 3%

MEDIUM priority if:
- Amount > $1000 AND APY improvement > 1%
- APY improvement > 1.5%

LOW priority:
- Everything else
```

## Impact Estimation

Agent menghitung estimated impact dari rebalancing:

```javascript
{
  currentAnnualReturn: "$450.00",      // Current yearly earnings
  projectedAnnualReturn: "$585.00",    // Projected earnings after rebalance
  additionalReturn: "$135.00",         // Additional earnings
  improvementPercent: "30%",           // Percentage improvement
  portfolioValue: "$15,000.00"
}
```

## Best Practices

1. **Periodic Checks**: Run rebalancing checks setiap 30 hari atau sesuai threshold
2. **Review Suggestions**: Always review suggestions sebelum execute
3. **Simulation First**: Use `simulateRebalancing()` untuk preview impact
4. **Track History**: Monitor rebalancing history untuk optimize strategy
5. **Consider Gas Costs**: Factor in transaction costs dalam decision
6. **Risk Management**: Maintain target risk tolerance saat rebalancing

## Error Handling

```javascript
try {
  const analysis = await orchestrator.checkRebalancing(portfolioId);
} catch (error) {
  if (error.message.includes('Failed to fetch portfolio')) {
    // Backend connection issue
  } else if (error.message.includes('No suitable pools')) {
    // No matching pools for risk tolerance
  }
}
```

## Future Enhancements

- [ ] Automated execution dengan user approval
- [ ] Multi-chain rebalancing optimization
- [ ] Tax-loss harvesting integration
- [ ] Gas cost optimization
- [ ] Machine learning untuk predict optimal rebalancing timing
- [ ] Webhook notifications untuk rebalancing alerts
