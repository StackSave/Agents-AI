# AI Staking Agents - Architecture Documentation

## Overview

AI Staking Agents adalah sistem multi-agent AI yang membantu user (khususnya beginner) untuk memilih protokol staking DeFi terbaik berdasarkan preferensi dan risk tolerance mereka.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Staking Orchestrator                      │
│                  (Koordinasi semua agents)                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Data      │────▶│     Risk     │────▶│   Analysis   │
│  Collection  │     │  Assessment  │     │    Agent     │
│    Agent     │     │    Agent     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
    Pool Data           Risk Scores          Recommendations
   (APY, TVL)       (Low/Medium/High)      (Best protocols)
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │  Execution   │
                                           │    Agent     │
                                           │  (Optional)  │
                                           └──────────────┘
                                                    │
                                                    ▼
                                           Transaction Sim
                                           & Instructions
```

## Agents

### 1. Data Collection Agent

**Purpose:** Mengumpulkan data real-time dari berbagai sumber DeFi

**Responsibilities:**
- Fetch staking pools dari DeFiLlama API
- Ambil harga token dari CoinGecko
- Collect TVL, APY, dan reward data
- Filter pools yang relevan (min TVL $1M)

**Data Sources:**
- DeFiLlama Pools API: `https://api.llama.fi/pools`
- CoinGecko Price API: `https://api.coingecko.com/api/v3/simple/price`

**Output:**
```javascript
{
  pools: [
    {
      protocol: "lido",
      chain: "Ethereum",
      symbol: "stETH",
      apy: 3.5,
      tvl: 14200000000,
      ...
    }
  ],
  prices: { ethereum: { usd: 2000 } },
  timestamp: "2025-01-15T10:30:00Z"
}
```

### 2. Risk Assessment Agent

**Purpose:** Mengevaluasi risk profile setiap protokol

**Responsibilities:**
- Calculate risk score (1-10) untuk setiap pool
- Assess berdasarkan TVL, APY, protocol reputation, chain
- Filter pools berdasarkan user risk tolerance
- Generate risk level: very-low, low, medium, high, very-high

**Risk Factors:**
- **TVL Risk:** Higher TVL = Lower Risk
- **APY Risk:** Abnormally high APY = Higher Risk
- **Protocol Risk:** Blue-chip protocols = Lower Risk
- **Chain Risk:** Ethereum = Lowest Risk

**Output:**
```javascript
{
  score: "2.5",
  level: "low",
  factors: {
    tvl: { score: 1, description: "Very high TVL ($14.2B)" },
    apy: { score: 2, description: "Sustainable APY (3.5%)" },
    protocol: { score: 2, description: "Battle-tested protocol (lido)" },
    chain: { score: 1, description: "Ethereum - Most secure" }
  }
}
```

### 3. Analysis Agent

**Purpose:** Menganalisis data dan memberikan rekomendasi

**Responsibilities:**
- Score setiap pool berdasarkan multiple factors
- Calculate projected returns
- Generate reasoning untuk rekomendasi
- Provide diversification strategy (optional)

**Scoring Algorithm:**
```javascript
score = (
  apyScore * 0.35 +        // Return potential
  riskScore * 0.30 +       // Risk-adjusted
  tvlScore * 0.20 +        // Liquidity
  chainScore * 0.15        // Security
)
```

**Output:**
```javascript
{
  recommended: {
    protocol: "lido",
    apy: "3.5%",
    tvl: "$14.2B",
    risk: "low",
    score: "8.5",
    projectedReturn: {
      amount: "28.77",
      percentage: "2.88",
      timeHorizon: "30days",
      total: "1028.77"
    },
    reason: "Best risk-adjusted return, Highest TVL with strong liquidity"
  },
  alternatives: [...],
  diversification: {...}
}
```

### 4. Execution Agent (Optional)

**Purpose:** Menangani eksekusi transaksi staking

**Responsibilities:**
- Simulate staking transactions
- Generate step-by-step instructions
- Estimate gas costs
- Provide official protocol links
- (Optional) Execute transactions if wallet connected

**Output:**
```javascript
{
  executionInstructions: {
    steps: [
      "1. Go to https://stake.lido.fi",
      "2. Connect your wallet",
      "3. Enter amount to stake",
      "4. Confirm transaction",
      ...
    ],
    contractAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    officialLinks: {
      website: "https://lido.fi",
      app: "https://stake.lido.fi",
      docs: "https://docs.lido.fi"
    }
  },
  transactionSimulation: {
    estimatedGas: {...},
    estimatedCost: "0.003 ETH ($6.00)"
  }
}
```

## Data Flow

1. **User Input** → Orchestrator
   ```javascript
   {
     amount: 1000,
     riskTolerance: 'low',
     timeHorizon: '30days',
     includeDiversification: true
   }
   ```

2. **Data Collection** → Raw pool data from APIs

3. **Risk Assessment** → Filtered pools based on risk tolerance

4. **Analysis** → Scored and ranked recommendations

5. **Execution** → Instructions for user to execute

## API Dependencies

### Required APIs:

1. **DeFiLlama API** (No key required)
   - Pools: `https://api.llama.fi/pools`
   - Protocol: `https://api.llama.fi/protocol/{name}`

2. **CoinGecko API** (Optional key for higher limits)
   - Prices: `https://api.coingecko.com/api/v3/simple/price`

3. **RPC Provider** (For on-chain data & execution)
   - Ethereum: Infura, Alchemy, or public RPC
   - Polygon: Similar providers

### Fallback Mechanism:

Jika API error, system menggunakan fallback data dengan major protocols:
- Lido (stETH, stMATIC)
- Rocket Pool (rETH)
- Frax (frxETH)

## Usage Examples

### Basic Usage:
```javascript
import { StakingOrchestrator } from './orchestrator.js';

const orchestrator = new StakingOrchestrator();

const recommendation = await orchestrator.getStakingRecommendation({
  amount: 1000,
  riskTolerance: 'low',
  timeHorizon: '30days',
  includeDiversification: true
});
```

### Quick Recommendation:
```javascript
const quickRec = await orchestrator.getQuickRecommendation(500, 'medium');
```

### Protocol Comparison:
```javascript
const comparison = await orchestrator.compareProtocols(
  ['lido', 'rocket-pool'],
  { amount: 2000, riskTolerance: 'low', timeHorizon: '1year' }
);
```

### Market Overview:
```javascript
const overview = await orchestrator.getMarketOverview();
```

## Extension Points

### Adding New Agents:

1. Create new agent class in `src/agents/`
2. Import in `orchestrator.js`
3. Add to orchestration flow

Example:
```javascript
// src/agents/GasOptimizationAgent.js
export class GasOptimizationAgent {
  async findOptimalTime() {
    // Find best time to stake based on gas prices
  }
}
```

### Adding New Data Sources:

1. Extend `DataCollectionAgent`
2. Add new API integration
3. Merge data in `collectAllData()`

### Custom Risk Models:

1. Extend `RiskAssessmentAgent`
2. Override `assessRisk()` method
3. Add custom risk factors

## Performance Considerations

- **Caching:** Consider caching pool data (5-15 minutes TTL)
- **Rate Limiting:** Respect API rate limits (DeFiLlama, CoinGecko)
- **Parallel Requests:** Data collection uses Promise.all for speed
- **Fallback Data:** Ensures system works even if APIs are down

## Security Considerations

- **API Keys:** Store in .env, never commit
- **Private Keys:** Only required if executing transactions
- **Contract Addresses:** Always verify on official docs
- **Wallet Connection:** Use read-only mode by default
- **Transaction Simulation:** Always simulate before execution

## Future Enhancements

1. **Machine Learning:** Train model on historical APY/risk data
2. **On-chain Analysis:** Analyze smart contract code for risks
3. **Social Sentiment:** Incorporate Twitter/Discord sentiment
4. **Auto-rebalancing:** Suggest when to move between protocols
5. **Yield Farming:** Extend to include LP and farming strategies
6. **Multi-chain:** Support more L1s and L2s
7. **Push Notifications:** Alert when APY changes significantly

## License

MIT
