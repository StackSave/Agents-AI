# AI Staking Agents

AI-powered agents for automated DeFi staking recommendations. Membantu user pemula dalam memilih protokol staking terbaik berdasarkan real-time data.

## Features

- **Data Collection Agent**: Mengumpulkan data dari berbagai protokol DeFi (APY, TVL, rewards)
- **Risk Assessment Agent**: Mengevaluasi risk profile setiap protokol
- **Analysis Agent**: Memberikan rekomendasi staking terbaik
- **Execution Agent**: (Optional) Menjalankan transaksi staking
- **Rebalancing Agent**: Menganalisis portfolio dan memberikan rekomendasi rebalancing berdasarkan perubahan APY, risk, dan waktu
- **Portfolio Service**: Integrasi dengan backend API untuk portfolio management

## Architecture

```
User Input → Data Collection → Risk Assessment → Analysis → Recommendation → Execution
```

## Data Sources

- DeFiLlama API (APY & TVL data)
- CoinGecko API (Price data)
- On-chain data via RPC providers

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in your API keys

## Usage

### Staking Recommendations

```javascript
import { StakingOrchestrator } from './src/orchestrator.js';

const orchestrator = new StakingOrchestrator();

const recommendation = await orchestrator.getStakingRecommendation({
  amount: 1000, // USDT
  riskTolerance: 'low', // low, medium, high
  timeHorizon: '30days' // 7days, 30days, 90days, 1year
});

console.log(recommendation);
```

### Portfolio Rebalancing

```javascript
import { StakingOrchestrator } from './src/orchestrator.js';

// Initialize with backend configuration
const orchestrator = new StakingOrchestrator({
  backend: {
    backendURL: 'http://localhost:3000/api',
    apiKey: 'your-api-key',
  },
  rebalancing: {
    apyChangePercent: 15, // Trigger if APY changes > 15%
    riskScoreChange: 1.5, // Trigger if risk score changes > 1.5
    timeIntervalDays: 30, // Check every 30 days
  },
});

// Check portfolio for rebalancing opportunities
const analysis = await orchestrator.checkRebalancing('portfolio_id', {
  riskTolerance: 'medium',
});

if (analysis.shouldRebalance) {
  console.log('Rebalancing suggested!');
  console.log('Triggers:', analysis.triggers);
  console.log('Suggestions:', analysis.suggestions);
  console.log('Estimated Impact:', analysis.estimatedImpact);
}

// Get rebalancing history
const history = await orchestrator.getRebalanceHistory('portfolio_id');

// Simulate rebalancing before execution
const simulation = await orchestrator.simulateRebalancing('portfolio_id', rebalancePlan);
```

See `src/rebalancing-examples.js` for complete examples.

## Example Output

```json
{
  "recommended": {
    "protocol": "Lido",
    "asset": "ETH",
    "apy": "3.8%",
    "tvl": "$14.2B",
    "risk": "low",
    "reason": "Highest TVL with stable returns and low risk"
  },
  "alternatives": [...]
}
```

## License

MIT
