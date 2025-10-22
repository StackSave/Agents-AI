/**
 * Rebalancing Agent
 * Menganalisis portfolio dan memberikan rekomendasi rebalancing
 * berdasarkan kombinasi trigger: APY changes, risk changes, time interval
 */
export class RebalancingAgent {
  constructor(config = {}) {
    // Rebalancing thresholds
    this.thresholds = {
      apyChangePercent: config.apyChangePercent || 15, // 15% APY change
      riskScoreChange: config.riskScoreChange || 1.5, // Risk score change > 1.5
      timeIntervalDays: config.timeIntervalDays || 30, // 30 days since last rebalance
      minRebalanceAmount: config.minRebalanceAmount || 100, // Min $100 to rebalance
      significantAllocationChange: config.significantAllocationChange || 10, // 10% allocation shift
    };

    // Rebalancing weights
    this.rebalanceWeights = {
      performance: 0.35, // Performance factor
      risk: 0.30, // Risk factor
      opportunity: 0.20, // Better opportunity factor
      diversification: 0.15, // Diversification factor
    };
  }

  /**
   * Main method: Analyze portfolio and check if rebalancing needed
   * @param {Object} portfolio - Current portfolio data from backend
   * @param {Array} currentMarketPools - Current market data from DataCollectionAgent
   * @param {Object} userPreferences - User preferences (risk tolerance, etc)
   * @returns {Promise<Object>} Rebalance analysis and suggestions
   */
  async analyzePortfolio(portfolio, currentMarketPools, userPreferences) {
    console.log('[RebalancingAgent] Analyzing portfolio for rebalancing opportunities...');

    const triggers = this.checkTriggers(portfolio, currentMarketPools);

    if (!triggers.shouldRebalance) {
      return {
        shouldRebalance: false,
        triggers: triggers.triggeredFactors,
        message: 'Portfolio is well-balanced. No rebalancing needed at this time.',
        nextCheckDate: this.calculateNextCheckDate(portfolio),
      };
    }

    // Generate rebalancing suggestions
    const suggestions = this.generateRebalanceSuggestions(
      portfolio,
      currentMarketPools,
      userPreferences,
      triggers
    );

    return {
      shouldRebalance: true,
      triggers: triggers.triggeredFactors,
      severity: triggers.severity, // 'low', 'medium', 'high'
      currentPortfolio: this.summarizePortfolio(portfolio),
      suggestions,
      estimatedImpact: this.estimateImpact(portfolio, suggestions),
      nextCheckDate: this.calculateNextCheckDate(portfolio),
    };
  }

  /**
   * Check all rebalancing triggers
   */
  checkTriggers(portfolio, currentMarketPools) {
    const triggeredFactors = [];
    let severityScore = 0;

    // 1. APY Change Trigger
    const apyChanges = this.checkAPYChanges(portfolio, currentMarketPools);
    if (apyChanges.triggered) {
      triggeredFactors.push({
        type: 'apy_change',
        details: apyChanges,
        severity: apyChanges.maxChange > 25 ? 'high' : 'medium',
      });
      severityScore += apyChanges.maxChange > 25 ? 3 : 2;
    }

    // 2. Risk Change Trigger
    const riskChanges = this.checkRiskChanges(portfolio, currentMarketPools);
    if (riskChanges.triggered) {
      triggeredFactors.push({
        type: 'risk_change',
        details: riskChanges,
        severity: riskChanges.maxChange > 2 ? 'high' : 'medium',
      });
      severityScore += riskChanges.maxChange > 2 ? 3 : 2;
    }

    // 3. Time Interval Trigger
    const timeCheck = this.checkTimeInterval(portfolio);
    if (timeCheck.triggered) {
      triggeredFactors.push({
        type: 'time_interval',
        details: timeCheck,
        severity: 'low',
      });
      severityScore += 1;
    }

    // 4. Better Opportunities Trigger
    const opportunities = this.checkBetterOpportunities(portfolio, currentMarketPools);
    if (opportunities.triggered) {
      triggeredFactors.push({
        type: 'better_opportunities',
        details: opportunities,
        severity: opportunities.score > 2 ? 'high' : 'medium',
      });
      severityScore += opportunities.score > 2 ? 3 : 2;
    }

    // Determine overall severity
    let severity = 'low';
    if (severityScore >= 6) severity = 'high';
    else if (severityScore >= 3) severity = 'medium';

    return {
      shouldRebalance: triggeredFactors.length > 0,
      triggeredFactors,
      severity,
      severityScore,
    };
  }

  /**
   * Check APY changes for all positions
   */
  checkAPYChanges(portfolio, currentMarketPools) {
    const changes = [];
    let maxChange = 0;

    for (const position of portfolio.positions) {
      // Find current pool data
      const currentPool = currentMarketPools.find(
        p =>
          p.protocol.toLowerCase() === position.protocol.toLowerCase() &&
          p.chain.toLowerCase() === position.chain.toLowerCase()
      );

      if (currentPool) {
        const initialAPY = position.initial_apy || position.initialAPY;
        const currentAPY = currentPool.apy;
        const changePercent = Math.abs(((currentAPY - initialAPY) / initialAPY) * 100);

        if (changePercent > this.thresholds.apyChangePercent) {
          changes.push({
            protocol: position.protocol,
            chain: position.chain,
            initialAPY: `${initialAPY.toFixed(2)}%`,
            currentAPY: `${currentAPY.toFixed(2)}%`,
            changePercent: `${changePercent.toFixed(2)}%`,
            direction: currentAPY > initialAPY ? 'increased' : 'decreased',
          });
          maxChange = Math.max(maxChange, changePercent);
        }
      }
    }

    return {
      triggered: changes.length > 0,
      changes,
      maxChange,
      threshold: `${this.thresholds.apyChangePercent}%`,
    };
  }

  /**
   * Check risk score changes for all positions
   */
  checkRiskChanges(portfolio, currentMarketPools) {
    const changes = [];
    let maxChange = 0;

    for (const position of portfolio.positions) {
      const currentPool = currentMarketPools.find(
        p =>
          p.protocol.toLowerCase() === position.protocol.toLowerCase() &&
          p.chain.toLowerCase() === position.chain.toLowerCase()
      );

      if (currentPool && currentPool.risk) {
        const initialRisk = position.initial_risk_score || position.initialRiskScore || 5;
        const currentRisk = parseFloat(currentPool.risk.score);
        const changeAmount = Math.abs(currentRisk - initialRisk);

        if (changeAmount > this.thresholds.riskScoreChange) {
          changes.push({
            protocol: position.protocol,
            chain: position.chain,
            initialRisk: initialRisk.toFixed(2),
            currentRisk: currentRisk.toFixed(2),
            changeAmount: changeAmount.toFixed(2),
            direction: currentRisk > initialRisk ? 'increased' : 'decreased',
          });
          maxChange = Math.max(maxChange, changeAmount);
        }
      }
    }

    return {
      triggered: changes.length > 0,
      changes,
      maxChange,
      threshold: this.thresholds.riskScoreChange,
    };
  }

  /**
   * Check time since last rebalance or position entry
   */
  checkTimeInterval(portfolio) {
    const now = new Date();
    const lastRebalance = portfolio.last_rebalance_date || portfolio.lastRebalanceDate;

    let daysSinceLastAction;
    let lastActionDate;

    if (lastRebalance) {
      lastActionDate = new Date(lastRebalance);
      daysSinceLastAction = Math.floor((now - lastActionDate) / (1000 * 60 * 60 * 24));
    } else {
      // Use oldest position entry date
      const oldestPosition = portfolio.positions.reduce((oldest, pos) => {
        const posDate = new Date(pos.entry_date || pos.entryDate);
        return posDate < oldest ? posDate : oldest;
      }, now);
      lastActionDate = oldestPosition;
      daysSinceLastAction = Math.floor((now - lastActionDate) / (1000 * 60 * 60 * 24));
    }

    return {
      triggered: daysSinceLastAction >= this.thresholds.timeIntervalDays,
      daysSinceLastAction,
      lastActionDate: lastActionDate.toISOString(),
      threshold: `${this.thresholds.timeIntervalDays} days`,
    };
  }

  /**
   * Check for significantly better opportunities in the market
   */
  checkBetterOpportunities(portfolio, currentMarketPools) {
    const opportunities = [];
    let totalOpportunityScore = 0;

    // Calculate average portfolio metrics
    const avgPortfolioAPY =
      portfolio.positions.reduce((sum, pos) => {
        const pool = currentMarketPools.find(
          p =>
            p.protocol.toLowerCase() === pos.protocol.toLowerCase() &&
            p.chain.toLowerCase() === pos.chain.toLowerCase()
        );
        return sum + (pool ? pool.apy : pos.initial_apy || pos.initialAPY || 0);
      }, 0) / portfolio.positions.length;

    // Find pools significantly better than current portfolio
    for (const pool of currentMarketPools) {
      // Skip if already in portfolio
      const inPortfolio = portfolio.positions.some(
        p =>
          p.protocol.toLowerCase() === pool.protocol.toLowerCase() &&
          p.chain.toLowerCase() === pool.chain.toLowerCase()
      );

      if (!inPortfolio && pool.risk) {
        const riskAdjustedReturn = pool.apy / parseFloat(pool.risk.score);
        const portfolioRiskAdjustedReturn = avgPortfolioAPY / 5; // Assume avg risk of 5

        // If new pool has >30% better risk-adjusted return
        const improvementPercent =
          ((riskAdjustedReturn - portfolioRiskAdjustedReturn) / portfolioRiskAdjustedReturn) * 100;

        if (improvementPercent > 30) {
          opportunities.push({
            protocol: pool.protocol,
            chain: pool.chain,
            apy: `${pool.apy.toFixed(2)}%`,
            risk: pool.risk.level,
            riskScore: pool.risk.score,
            improvementPercent: `${improvementPercent.toFixed(2)}%`,
            reason: `${improvementPercent.toFixed(0)}% better risk-adjusted return`,
          });
          totalOpportunityScore += improvementPercent / 30; // Normalize
        }
      }
    }

    return {
      triggered: opportunities.length > 0,
      opportunities: opportunities.slice(0, 3), // Top 3
      score: totalOpportunityScore,
    };
  }

  /**
   * Generate rebalancing suggestions
   */
  generateRebalanceSuggestions(portfolio, currentMarketPools, userPreferences, triggers) {
    const suggestions = [];

    // 1. Identify underperforming positions
    const underperformers = this.identifyUnderperformers(portfolio, currentMarketPools);

    // 2. Find better alternatives
    const alternatives = this.findBetterAlternatives(
      portfolio,
      currentMarketPools,
      userPreferences
    );

    // 3. Generate specific rebalancing actions
    for (const underperformer of underperformers) {
      const betterOption = alternatives.find(alt => {
        // Match similar risk profile
        const currentRisk = underperformer.currentPool?.risk?.level || 'medium';
        return alt.risk.level === currentRisk;
      });

      if (betterOption) {
        suggestions.push({
          action: 'rebalance',
          from: {
            protocol: underperformer.position.protocol,
            chain: underperformer.position.chain,
            currentAPY: `${underperformer.currentAPY.toFixed(2)}%`,
            risk: underperformer.currentPool?.risk?.level || 'unknown',
            amountUSD: underperformer.position.amount_usd || underperformer.position.amountUSD,
          },
          to: {
            protocol: betterOption.protocol,
            chain: betterOption.chain,
            apy: `${betterOption.apy.toFixed(2)}%`,
            risk: betterOption.risk.level,
            tvl: this.formatTVL(betterOption.tvl),
          },
          expectedImprovement: {
            apyIncrease: `${(betterOption.apy - underperformer.currentAPY).toFixed(2)}%`,
            annualizedGain: this.calculateAnnualizedGain(
              underperformer.position.amount_usd || underperformer.position.amountUSD,
              underperformer.currentAPY,
              betterOption.apy
            ),
          },
          reason: underperformer.reason,
          priority: this.calculatePriority(underperformer, betterOption),
        });
      }
    }

    // 4. Diversification suggestions if portfolio too concentrated
    const diversificationSuggestion = this.checkDiversification(portfolio, currentMarketPools);
    if (diversificationSuggestion.needed) {
      suggestions.push({
        action: 'diversify',
        details: diversificationSuggestion,
        priority: 'medium',
      });
    }

    // Sort by priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return suggestions;
  }

  /**
   * Identify underperforming positions
   */
  identifyUnderperformers(portfolio, currentMarketPools) {
    const underperformers = [];

    for (const position of portfolio.positions) {
      const currentPool = currentMarketPools.find(
        p =>
          p.protocol.toLowerCase() === position.protocol.toLowerCase() &&
          p.chain.toLowerCase() === position.chain.toLowerCase()
      );

      if (currentPool) {
        const avgMarketAPY =
          currentMarketPools.reduce((sum, p) => sum + p.apy, 0) / currentMarketPools.length;

        // Underperforming if APY is significantly below market average
        if (currentPool.apy < avgMarketAPY * 0.7) {
          underperformers.push({
            position,
            currentPool,
            currentAPY: currentPool.apy,
            marketAvgAPY: avgMarketAPY,
            reason: `APY ${currentPool.apy.toFixed(2)}% is ${((1 - currentPool.apy / avgMarketAPY) * 100).toFixed(0)}% below market average`,
          });
        }
      }
    }

    return underperformers;
  }

  /**
   * Find better alternatives
   */
  findBetterAlternatives(portfolio, currentMarketPools, userPreferences) {
    const riskTolerance = userPreferences?.riskTolerance || portfolio.target_risk_tolerance || 'medium';

    // Filter pools by risk tolerance
    const suitablePools = currentMarketPools.filter(pool => {
      if (!pool.risk) return false;

      if (riskTolerance === 'low') {
        return pool.risk.level === 'low' || pool.risk.level === 'very-low';
      } else if (riskTolerance === 'medium') {
        return pool.risk.level === 'low' || pool.risk.level === 'medium';
      } else {
        return true; // High tolerance accepts all
      }
    });

    // Sort by risk-adjusted return
    return suitablePools
      .map(pool => ({
        ...pool,
        riskAdjustedReturn: pool.apy / parseFloat(pool.risk.score),
      }))
      .sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn)
      .slice(0, 5); // Top 5 alternatives
  }

  /**
   * Check portfolio diversification
   */
  checkDiversification(portfolio, currentMarketPools) {
    const totalValue = portfolio.positions.reduce(
      (sum, pos) => sum + (pos.amount_usd || pos.amountUSD || 0),
      0
    );

    // Check concentration (single position > 60%)
    const maxPosition = Math.max(...portfolio.positions.map(p => p.amount_usd || p.amountUSD || 0));
    const concentration = (maxPosition / totalValue) * 100;

    if (concentration > 60) {
      return {
        needed: true,
        reason: `Portfolio too concentrated: ${concentration.toFixed(0)}% in single position`,
        recommendation: 'Consider splitting into 2-3 positions for better risk management',
        suggestedAllocation: '40-30-30 split',
      };
    }

    // Check protocol diversity (all positions in same protocol)
    const uniqueProtocols = new Set(portfolio.positions.map(p => p.protocol.toLowerCase()));
    if (uniqueProtocols.size === 1 && portfolio.positions.length > 1) {
      return {
        needed: true,
        reason: 'All positions in same protocol',
        recommendation: 'Diversify across multiple protocols to reduce protocol risk',
      };
    }

    return { needed: false };
  }

  /**
   * Calculate priority for rebalancing suggestion
   */
  calculatePriority(underperformer, betterOption) {
    const apyImprovement = betterOption.apy - underperformer.currentAPY;
    const amount = underperformer.position.amount_usd || underperformer.position.amountUSD || 0;

    // High priority if: large amount + significant improvement
    if (amount > 5000 && apyImprovement > 2) return 'high';
    if (amount > 2000 && apyImprovement > 1.5) return 'high';
    if (apyImprovement > 3) return 'high';

    // Medium priority
    if (amount > 1000 && apyImprovement > 1) return 'medium';
    if (apyImprovement > 1.5) return 'medium';

    return 'low';
  }

  /**
   * Calculate annualized gain from rebalancing
   */
  calculateAnnualizedGain(amount, currentAPY, newAPY) {
    const gain = (amount * (newAPY - currentAPY)) / 100;
    return `$${gain.toFixed(2)}`;
  }

  /**
   * Estimate overall impact of rebalancing
   */
  estimateImpact(portfolio, suggestions) {
    const rebalanceSuggestions = suggestions.filter(s => s.action === 'rebalance');

    const totalCurrentAPY = portfolio.positions.reduce((sum, pos) => {
      return sum + (pos.amount_usd || pos.amountUSD || 0) * (pos.initial_apy || pos.initialAPY || 0) / 100;
    }, 0);

    let totalNewAPY = totalCurrentAPY;
    for (const suggestion of rebalanceSuggestions) {
      const currentGain = suggestion.from.amountUSD * parseFloat(suggestion.from.currentAPY) / 100;
      const newGain = suggestion.from.amountUSD * parseFloat(suggestion.to.apy) / 100;
      totalNewAPY += (newGain - currentGain);
    }

    const totalValue = portfolio.positions.reduce(
      (sum, pos) => sum + (pos.amount_usd || pos.amountUSD || 0),
      0
    );

    return {
      currentAnnualReturn: `$${totalCurrentAPY.toFixed(2)}`,
      projectedAnnualReturn: `$${totalNewAPY.toFixed(2)}`,
      additionalReturn: `$${(totalNewAPY - totalCurrentAPY).toFixed(2)}`,
      improvementPercent: `${(((totalNewAPY - totalCurrentAPY) / totalCurrentAPY) * 100).toFixed(2)}%`,
      portfolioValue: `$${totalValue.toFixed(2)}`,
    };
  }

  /**
   * Summarize current portfolio
   */
  summarizePortfolio(portfolio) {
    const totalValue = portfolio.positions.reduce(
      (sum, pos) => sum + (pos.amount_usd || pos.amountUSD || 0),
      0
    );

    return {
      totalValue: `$${totalValue.toFixed(2)}`,
      positionCount: portfolio.positions.length,
      positions: portfolio.positions.map(pos => ({
        protocol: pos.protocol,
        chain: pos.chain,
        amount: `$${(pos.amount_usd || pos.amountUSD || 0).toFixed(2)}`,
        allocation: `${(((pos.amount_usd || pos.amountUSD || 0) / totalValue) * 100).toFixed(1)}%`,
      })),
    };
  }

  /**
   * Calculate next check date
   */
  calculateNextCheckDate(portfolio) {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + this.thresholds.timeIntervalDays * 24 * 60 * 60 * 1000);
    return nextCheck.toISOString();
  }

  /**
   * Format TVL for display
   */
  formatTVL(tvl) {
    if (tvl > 1000000000) {
      return `$${(tvl / 1000000000).toFixed(2)}B`;
    }
    return `$${(tvl / 1000000).toFixed(2)}M`;
  }
}
