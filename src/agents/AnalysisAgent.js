/**
 * Analysis Agent
 * Menganalisis data dan memberikan rekomendasi staking terbaik
 */
export class AnalysisAgent {
  constructor() {
    this.scoringWeights = {
      apy: 0.35,
      risk: 0.30,
      tvl: 0.20,
      chain: 0.15,
    };
  }

  /**
   * Menganalisis dan memberikan rekomendasi staking terbaik
   */
  analyzeAndRecommend(poolsWithRisk, userPreferences) {
    console.log('[AnalysisAgent] Analyzing pools and generating recommendations...');

    const { amount, timeHorizon } = userPreferences;

    // Score setiap pool
    const scoredPools = poolsWithRisk.map(pool => ({
      ...pool,
      score: this.calculateScore(pool, userPreferences),
    }));

    // Sort by score (highest first)
    scoredPools.sort((a, b) => b.score - a.score);

    // Top recommendation
    const recommended = scoredPools[0];
    const alternatives = scoredPools.slice(1, 4);

    // Calculate expected returns
    const projectedReturn = this.calculateProjectedReturn(
      amount,
      recommended.apy,
      timeHorizon
    );

    return {
      recommended: {
        protocol: recommended.protocol,
        chain: recommended.chain,
        symbol: recommended.symbol,
        apy: `${recommended.apy.toFixed(2)}%`,
        tvl: this.formatTVL(recommended.tvl),
        risk: recommended.risk.level,
        score: recommended.score.toFixed(2),
        projectedReturn,
        reason: this.generateReason(recommended, poolsWithRisk),
        details: {
          apyBreakdown: {
            base: `${recommended.apyBase.toFixed(2)}%`,
            reward: `${recommended.apyReward.toFixed(2)}%`,
          },
          riskFactors: recommended.risk.factors,
        },
      },
      alternatives: alternatives.map(pool => ({
        protocol: pool.protocol,
        chain: pool.chain,
        symbol: pool.symbol,
        apy: `${pool.apy.toFixed(2)}%`,
        tvl: this.formatTVL(pool.tvl),
        risk: pool.risk.level,
        score: pool.score.toFixed(2),
        reason: this.generateAlternativeReason(pool),
      })),
      analysis: {
        totalPoolsAnalyzed: poolsWithRisk.length,
        averageAPY: this.calculateAverageAPY(poolsWithRisk),
        userPreferences,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Calculate overall score untuk setiap pool
   */
  calculateScore(pool, userPreferences) {
    const { riskTolerance } = userPreferences;

    // APY Score (0-10): Higher is better
    const apyScore = Math.min(pool.apy / 2, 10); // Cap at 20% APY = score 10

    // Risk Score (0-10): Lower risk is better, invert the score
    const riskScore = 10 - parseFloat(pool.risk.score);

    // TVL Score (0-10): Higher TVL is better
    const tvlScore = Math.min(Math.log10(pool.tvl / 1000000), 10);

    // Chain Score (0-10): Based on chain preference
    const chainScore = this.getChainPreferenceScore(pool.chain);

    // Risk tolerance adjustment
    let riskWeight = this.scoringWeights.risk;
    if (riskTolerance === 'low') {
      riskWeight = 0.40; // Increase risk weight for conservative users
    } else if (riskTolerance === 'high') {
      riskWeight = 0.20; // Decrease risk weight for aggressive users
    }

    const apyWeight = this.scoringWeights.apy + (this.scoringWeights.risk - riskWeight);

    const totalScore =
      apyScore * apyWeight +
      riskScore * riskWeight +
      tvlScore * this.scoringWeights.tvl +
      chainScore * this.scoringWeights.chain;

    return totalScore;
  }

  /**
   * Chain preference scoring
   */
  getChainPreferenceScore(chain) {
    const chainLower = chain.toLowerCase();

    if (chainLower.includes('ethereum')) return 10;
    if (chainLower.includes('polygon') || chainLower.includes('arbitrum')) return 8;
    if (chainLower.includes('bsc') || chainLower.includes('avalanche')) return 6;

    return 5;
  }

  /**
   * Calculate projected return berdasarkan amount dan timeframe
   */
  calculateProjectedReturn(amount, apy, timeHorizon) {
    const timeframes = {
      '7days': 7 / 365,
      '30days': 30 / 365,
      '90days': 90 / 365,
      '1year': 1,
    };

    const years = timeframes[timeHorizon] || timeframes['30days'];
    const returnAmount = amount * (apy / 100) * years;

    return {
      amount: returnAmount.toFixed(2),
      percentage: (apy * years).toFixed(2),
      timeHorizon,
      principal: amount,
      total: (amount + returnAmount).toFixed(2),
    };
  }

  /**
   * Generate reasoning untuk rekomendasi
   */
  generateReason(pool, allPools) {
    const reasons = [];

    // Risk-adjusted return
    const riskAdjustedReturn = pool.apy / parseFloat(pool.risk.score);
    const avgRiskAdjustedReturn =
      allPools.reduce((sum, p) => sum + p.apy / parseFloat(p.risk.score), 0) / allPools.length;

    if (riskAdjustedReturn > avgRiskAdjustedReturn * 1.2) {
      reasons.push('Best risk-adjusted return');
    }

    // TVL comparison
    const highestTVL = Math.max(...allPools.map(p => p.tvl));
    if (pool.tvl === highestTVL) {
      reasons.push('Highest TVL with strong liquidity');
    } else if (pool.tvl > 1000000000) {
      reasons.push('High TVL ensuring security');
    }

    // Risk level
    if (pool.risk.level === 'low' || pool.risk.level === 'very-low') {
      reasons.push('Low risk profile');
    }

    // APY
    const avgAPY = allPools.reduce((sum, p) => sum + p.apy, 0) / allPools.length;
    if (pool.apy > avgAPY * 1.1) {
      reasons.push('Above average APY');
    }

    // Protocol reputation
    const blueChipProtocols = ['lido', 'rocket-pool', 'aave'];
    if (blueChipProtocols.some(p => pool.protocol.toLowerCase().includes(p))) {
      reasons.push('Battle-tested protocol');
    }

    return reasons.join(', ') || 'Balanced risk-reward profile';
  }

  /**
   * Generate reason untuk alternatif
   */
  generateAlternativeReason(pool) {
    if (pool.apy > 5) {
      return 'Higher APY option with moderate risk';
    }
    if (pool.risk.level === 'very-low' || pool.risk.level === 'low') {
      return 'Lower risk alternative';
    }
    return 'Good balanced option';
  }

  /**
   * Format TVL untuk display
   */
  formatTVL(tvl) {
    if (tvl > 1000000000) {
      return `$${(tvl / 1000000000).toFixed(2)}B`;
    }
    return `$${(tvl / 1000000).toFixed(2)}M`;
  }

  /**
   * Calculate average APY
   */
  calculateAverageAPY(pools) {
    const sum = pools.reduce((total, pool) => total + pool.apy, 0);
    return `${(sum / pools.length).toFixed(2)}%`;
  }

  /**
   * Diversification recommendation
   */
  recommendDiversification(amount, topPools) {
    if (amount < 1000) {
      return {
        recommended: false,
        reason: 'Amount too small for diversification',
      };
    }

    if (topPools.length < 3) {
      return {
        recommended: false,
        reason: 'Not enough suitable pools',
      };
    }

    // Suggest 3-pool diversification
    const allocation = [0.5, 0.3, 0.2]; // 50%, 30%, 20%

    return {
      recommended: true,
      strategy: topPools.slice(0, 3).map((pool, idx) => ({
        protocol: pool.protocol,
        allocation: `${(allocation[idx] * 100).toFixed(0)}%`,
        amount: (amount * allocation[idx]).toFixed(2),
        apy: `${pool.apy.toFixed(2)}%`,
      })),
      expectedBlendedAPY: this.calculateBlendedAPY(topPools.slice(0, 3), allocation),
    };
  }

  calculateBlendedAPY(pools, allocation) {
    const blended = pools.reduce((sum, pool, idx) => {
      return sum + pool.apy * allocation[idx];
    }, 0);

    return `${blended.toFixed(2)}%`;
  }
}
