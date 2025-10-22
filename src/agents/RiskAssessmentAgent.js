/**
 * Risk Assessment Agent
 * Mengevaluasi risk profile dari setiap protokol staking
 */
export class RiskAssessmentAgent {
  constructor() {
    this.riskWeights = {
      tvl: 0.3,
      age: 0.2,
      audits: 0.25,
      apy: 0.15,
      volatility: 0.1,
    };
  }

  /**
   * Menghitung risk score untuk setiap pool
   * Score: 1-10 (1 = very low risk, 10 = very high risk)
   */
  assessRisk(pool, protocolMeta = {}) {
    console.log(`[RiskAgent] Assessing risk for ${pool.protocol}...`);

    const tvlScore = this.assessTVLRisk(pool.tvl);
    const apyScore = this.assessAPYRisk(pool.apy);
    const protocolScore = this.assessProtocolRisk(pool.protocol);
    const chainScore = this.assessChainRisk(pool.chain);

    const totalScore = (
      tvlScore * this.riskWeights.tvl +
      apyScore * this.riskWeights.apy +
      protocolScore * this.riskWeights.audits +
      chainScore * this.riskWeights.age
    );

    const riskLevel = this.getRiskLevel(totalScore);

    return {
      score: totalScore.toFixed(2),
      level: riskLevel,
      factors: {
        tvl: { score: tvlScore, description: this.getTVLDescription(pool.tvl) },
        apy: { score: apyScore, description: this.getAPYDescription(pool.apy) },
        protocol: { score: protocolScore, description: this.getProtocolDescription(pool.protocol) },
        chain: { score: chainScore, description: this.getChainDescription(pool.chain) },
      },
    };
  }

  /**
   * TVL Risk Assessment
   * Higher TVL = Lower Risk
   */
  assessTVLRisk(tvl) {
    if (tvl > 10000000000) return 1; // >$10B = very low risk
    if (tvl > 5000000000) return 2;  // >$5B
    if (tvl > 1000000000) return 3;  // >$1B
    if (tvl > 500000000) return 4;   // >$500M
    if (tvl > 100000000) return 5;   // >$100M
    if (tvl > 50000000) return 6;    // >$50M
    if (tvl > 10000000) return 7;    // >$10M
    return 9; // <$10M = high risk
  }

  getTVLDescription(tvl) {
    const tvlInB = (tvl / 1000000000).toFixed(2);
    const tvlInM = (tvl / 1000000).toFixed(2);

    if (tvl > 1000000000) {
      return `Very high TVL ($${tvlInB}B) - Strong liquidity`;
    }
    return `Medium TVL ($${tvlInM}M)`;
  }

  /**
   * APY Risk Assessment
   * Abnormally high APY = Higher Risk
   */
  assessAPYRisk(apy) {
    if (apy < 5) return 2;   // Normal staking APY
    if (apy < 10) return 3;  // Slightly elevated
    if (apy < 20) return 5;  // High APY - moderate risk
    if (apy < 50) return 7;  // Very high APY - higher risk
    return 9; // Abnormally high - very risky
  }

  getAPYDescription(apy) {
    if (apy < 5) return `Sustainable APY (${apy.toFixed(2)}%)`;
    if (apy < 10) return `Good APY (${apy.toFixed(2)}%)`;
    if (apy < 20) return `High APY (${apy.toFixed(2)}%) - verify sustainability`;
    return `Very high APY (${apy.toFixed(2)}%) - higher risk`;
  }

  /**
   * Protocol Risk Assessment
   * Well-known protocols = Lower Risk
   */
  assessProtocolRisk(protocol) {
    const protocolLower = protocol.toLowerCase();

    // Blue chip protocols
    const lowRiskProtocols = ['lido', 'rocket-pool', 'aave', 'compound', 'makerdao'];
    if (lowRiskProtocols.some(p => protocolLower.includes(p))) return 2;

    // Well-known protocols
    const mediumRiskProtocols = ['frax', 'curve', 'convex', 'yearn', 'stakewise'];
    if (mediumRiskProtocols.some(p => protocolLower.includes(p))) return 4;

    // Others
    return 6;
  }

  getProtocolDescription(protocol) {
    const protocolLower = protocol.toLowerCase();

    const lowRiskProtocols = ['lido', 'rocket-pool', 'aave', 'compound'];
    if (lowRiskProtocols.some(p => protocolLower.includes(p))) {
      return `Battle-tested protocol (${protocol})`;
    }

    return `Established protocol (${protocol})`;
  }

  /**
   * Chain Risk Assessment
   */
  assessChainRisk(chain) {
    const chainLower = chain.toLowerCase();

    if (chainLower.includes('ethereum')) return 1; // Most secure
    if (chainLower.includes('polygon') || chainLower.includes('arbitrum')) return 2;
    if (chainLower.includes('bsc') || chainLower.includes('avalanche')) return 3;

    return 5; // Other chains
  }

  getChainDescription(chain) {
    const chainLower = chain.toLowerCase();

    if (chainLower.includes('ethereum')) return `Ethereum - Most secure`;
    if (chainLower.includes('polygon')) return `Polygon - L2 solution`;

    return `${chain} network`;
  }

  /**
   * Convert numeric score to risk level
   */
  getRiskLevel(score) {
    if (score <= 2.5) return 'very-low';
    if (score <= 3.5) return 'low';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'high';
    return 'very-high';
  }

  /**
   * Filter pools berdasarkan risk tolerance user
   */
  filterByRiskTolerance(pools, riskTolerance) {
    console.log(`[RiskAgent] Filtering pools by risk tolerance: ${riskTolerance}`);

    const poolsWithRisk = pools.map(pool => ({
      ...pool,
      risk: this.assessRisk(pool),
    }));

    const riskThresholds = {
      low: 3.5,
      medium: 5,
      high: 10,
    };

    const threshold = riskThresholds[riskTolerance] || 3.5;

    return poolsWithRisk.filter(pool => parseFloat(pool.risk.score) <= threshold);
  }
}
