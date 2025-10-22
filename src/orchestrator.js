import { DataCollectionAgent } from './agents/DataCollectionAgent.js';
import { RiskAssessmentAgent } from './agents/RiskAssessmentAgent.js';
import { AnalysisAgent } from './agents/AnalysisAgent.js';
import { ExecutionAgent } from './agents/ExecutionAgent.js';
import { RebalancingAgent } from './agents/RebalancingAgent.js';
import { PortfolioService } from './services/PortfolioService.js';

/**
 * Staking Orchestrator
 * Koordinasi semua AI agents untuk memberikan rekomendasi staking
 */
export class StakingOrchestrator {
  constructor(config = {}) {
    this.dataAgent = new DataCollectionAgent();
    this.riskAgent = new RiskAssessmentAgent();
    this.analysisAgent = new AnalysisAgent();
    this.executionAgent = config.providerUrl
      ? new ExecutionAgent(config.providerUrl, config.privateKey)
      : null;
    this.rebalancingAgent = new RebalancingAgent(config.rebalancing || {});
    this.portfolioService = new PortfolioService(config.backend || {});

    console.log('[Orchestrator] AI Staking Agents initialized');
  }

  /**
   * Main method: Get staking recommendation
   *
   * @param {Object} userInput - User preferences
   * @param {number} userInput.amount - Amount to stake in USD
   * @param {string} userInput.riskTolerance - 'low', 'medium', or 'high'
   * @param {string} userInput.timeHorizon - '7days', '30days', '90days', '1year'
   * @param {boolean} userInput.includeDiversification - Include diversification strategy
   */
  async getStakingRecommendation(userInput) {
    console.log('\n=== AI Staking Agents Started ===\n');
    console.log('User Input:', userInput);

    try {
      // Validate input
      this.validateInput(userInput);

      // Step 1: Data Collection Agent - Gather data
      console.log('\n--- Step 1: Data Collection ---');
      const data = await this.dataAgent.collectAllData();
      console.log(`Collected ${data.pools.length} staking pools`);

      // Step 2: Risk Assessment Agent - Evaluate risks
      console.log('\n--- Step 2: Risk Assessment ---');
      const filteredPools = this.riskAgent.filterByRiskTolerance(
        data.pools,
        userInput.riskTolerance
      );
      console.log(`Filtered to ${filteredPools.length} pools matching risk tolerance`);

      if (filteredPools.length === 0) {
        throw new Error('No suitable pools found for your risk tolerance. Try adjusting your preferences.');
      }

      // Step 3: Analysis Agent - Generate recommendations
      console.log('\n--- Step 3: Analysis & Recommendation ---');
      const recommendation = this.analysisAgent.analyzeAndRecommend(
        filteredPools,
        userInput
      );

      // Step 4: Diversification (if requested)
      if (userInput.includeDiversification) {
        console.log('\n--- Step 4: Diversification Strategy ---');
        const diversification = this.analysisAgent.recommendDiversification(
          userInput.amount,
          filteredPools
        );
        recommendation.diversification = diversification;
      }

      // Step 5: Execution Instructions (if execution agent available)
      if (this.executionAgent) {
        console.log('\n--- Step 5: Execution Instructions ---');
        const instructions = this.executionAgent.generateInstructions(
          recommendation.recommended,
          userInput.amount
        );
        recommendation.executionInstructions = instructions;

        // Simulate transaction
        const simulation = await this.executionAgent.simulateStaking(
          recommendation.recommended,
          userInput.amount
        );
        recommendation.transactionSimulation = simulation;
      }

      console.log('\n=== AI Staking Agents Completed ===\n');

      return recommendation;
    } catch (error) {
      console.error('\n[Orchestrator] Error:', error.message);
      throw error;
    }
  }

  /**
   * Validate user input
   */
  validateInput(input) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const validRiskLevels = ['low', 'medium', 'high'];
    if (!validRiskLevels.includes(input.riskTolerance)) {
      throw new Error(`Risk tolerance must be one of: ${validRiskLevels.join(', ')}`);
    }

    const validTimeframes = ['7days', '30days', '90days', '1year'];
    if (!validTimeframes.includes(input.timeHorizon)) {
      throw new Error(`Time horizon must be one of: ${validTimeframes.join(', ')}`);
    }
  }

  /**
   * Quick recommendation (simplified flow)
   */
  async getQuickRecommendation(amount, riskTolerance = 'low') {
    return this.getStakingRecommendation({
      amount,
      riskTolerance,
      timeHorizon: '30days',
      includeDiversification: false,
    });
  }

  /**
   * Compare multiple protocols
   */
  async compareProtocols(protocols, userPreferences) {
    console.log('\n=== Protocol Comparison Mode ===\n');

    const data = await this.dataAgent.collectAllData();

    const targetPools = data.pools.filter(pool =>
      protocols.some(p => pool.protocol.toLowerCase().includes(p.toLowerCase()))
    );

    if (targetPools.length === 0) {
      throw new Error('None of the specified protocols found');
    }

    const poolsWithRisk = targetPools.map(pool => ({
      ...pool,
      risk: this.riskAgent.assessRisk(pool),
    }));

    return {
      comparison: poolsWithRisk.map(pool => ({
        protocol: pool.protocol,
        chain: pool.chain,
        symbol: pool.symbol,
        apy: `${pool.apy.toFixed(2)}%`,
        tvl: this.analysisAgent.formatTVL(pool.tvl),
        risk: pool.risk.level,
        riskScore: pool.risk.score,
        pros: this.generatePros(pool),
        cons: this.generateCons(pool),
      })),
      recommendation: this.analysisAgent.analyzeAndRecommend(poolsWithRisk, userPreferences),
    };
  }

  /**
   * Generate pros for a pool
   */
  generatePros(pool) {
    const pros = [];

    if (pool.tvl > 5000000000) pros.push('Very high TVL');
    if (pool.apy > 4) pros.push('Good APY');
    if (pool.risk.level === 'low' || pool.risk.level === 'very-low') pros.push('Low risk');
    if (pool.chain.toLowerCase().includes('ethereum')) pros.push('Ethereum mainnet');

    return pros;
  }

  /**
   * Generate cons for a pool
   */
  generateCons(pool) {
    const cons = [];

    if (pool.tvl < 100000000) cons.push('Lower TVL');
    if (pool.apy < 3) cons.push('Lower APY');
    if (pool.risk.level === 'high' || pool.risk.level === 'very-high') cons.push('Higher risk');

    return cons;
  }

  /**
   * Get market overview
   */
  async getMarketOverview() {
    console.log('\n=== Market Overview ===\n');

    const data = await this.dataAgent.collectAllData();

    const apys = data.pools.map(p => p.apy);
    const tvls = data.pools.map(p => p.tvl);

    return {
      totalPools: data.pools.length,
      averageAPY: `${(apys.reduce((a, b) => a + b, 0) / apys.length).toFixed(2)}%`,
      highestAPY: `${Math.max(...apys).toFixed(2)}%`,
      lowestAPY: `${Math.min(...apys).toFixed(2)}%`,
      totalTVL: this.analysisAgent.formatTVL(tvls.reduce((a, b) => a + b, 0)),
      topProtocols: data.pools
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 5)
        .map(p => ({
          protocol: p.protocol,
          tvl: this.analysisAgent.formatTVL(p.tvl),
          apy: `${p.apy.toFixed(2)}%`,
        })),
      timestamp: data.timestamp,
    };
  }

  /**
   * Check portfolio for rebalancing opportunities
   * @param {string} portfolioId - Portfolio identifier from backend
   * @param {Object} userPreferences - User preferences (optional)
   * @returns {Promise<Object>} Rebalancing analysis and suggestions
   */
  async checkRebalancing(portfolioId, userPreferences = {}) {
    console.log('\n=== Portfolio Rebalancing Analysis ===\n');
    console.log(`Analyzing portfolio: ${portfolioId}`);

    try {
      // Step 1: Fetch portfolio data from backend
      console.log('\n--- Step 1: Fetching Portfolio Data ---');
      const portfolio = await this.portfolioService.getPortfolioById(portfolioId);
      console.log(`Portfolio loaded: ${portfolio.positions?.length || 0} positions`);

      // Step 2: Get current market data
      console.log('\n--- Step 2: Collecting Market Data ---');
      const marketData = await this.dataAgent.collectAllData();

      // Step 3: Assess risks for current market pools
      console.log('\n--- Step 3: Assessing Market Risks ---');
      const poolsWithRisk = marketData.pools.map(pool => ({
        ...pool,
        risk: this.riskAgent.assessRisk(pool),
      }));

      // Step 4: Analyze portfolio for rebalancing
      console.log('\n--- Step 4: Rebalancing Analysis ---');
      const rebalanceAnalysis = await this.rebalancingAgent.analyzePortfolio(
        portfolio,
        poolsWithRisk,
        userPreferences
      );

      // Step 5: Save suggestion to backend if rebalancing recommended
      if (rebalanceAnalysis.shouldRebalance) {
        console.log('\n--- Step 5: Saving Rebalance Suggestion ---');
        await this.portfolioService.saveRebalanceSuggestion(portfolioId, rebalanceAnalysis);
        console.log('Rebalance suggestion saved to backend');
      }

      console.log('\n=== Rebalancing Analysis Complete ===\n');

      return rebalanceAnalysis;
    } catch (error) {
      console.error('\n[Orchestrator] Rebalancing Error:', error.message);
      throw error;
    }
  }

  /**
   * Get rebalancing history for a portfolio
   * @param {string} portfolioId - Portfolio identifier
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Rebalancing history
   */
  async getRebalanceHistory(portfolioId, limit = 10) {
    console.log('\n=== Fetching Rebalance History ===\n');

    try {
      const history = await this.portfolioService.getRebalanceHistory(portfolioId, limit);
      return {
        portfolioId,
        historyCount: history.length,
        history,
      };
    } catch (error) {
      console.error('[Orchestrator] Error fetching history:', error.message);
      throw error;
    }
  }

  /**
   * Simulate rebalancing impact before execution
   * @param {string} portfolioId - Portfolio identifier
   * @param {Object} rebalancePlan - Specific rebalancing plan to simulate
   * @returns {Promise<Object>} Simulation results
   */
  async simulateRebalancing(portfolioId, rebalancePlan) {
    console.log('\n=== Simulating Rebalancing Impact ===\n');

    try {
      const portfolio = await this.portfolioService.getPortfolioById(portfolioId);

      // Calculate current portfolio metrics
      const currentMetrics = this.calculatePortfolioMetrics(portfolio);

      // Simulate new portfolio after rebalancing
      const simulatedPortfolio = this.applyRebalancePlan(portfolio, rebalancePlan);
      const projectedMetrics = this.calculatePortfolioMetrics(simulatedPortfolio);

      return {
        current: currentMetrics,
        projected: projectedMetrics,
        changes: {
          apyChange: `${(projectedMetrics.weightedAPY - currentMetrics.weightedAPY).toFixed(2)}%`,
          riskChange: (projectedMetrics.avgRiskScore - currentMetrics.avgRiskScore).toFixed(2),
          diversificationChange: projectedMetrics.diversificationScore - currentMetrics.diversificationScore,
        },
        recommendation: projectedMetrics.weightedAPY > currentMetrics.weightedAPY ? 'Proceed' : 'Review carefully',
      };
    } catch (error) {
      console.error('[Orchestrator] Simulation Error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics(portfolio) {
    const totalValue = portfolio.positions.reduce(
      (sum, pos) => sum + (pos.amount_usd || pos.amountUSD || 0),
      0
    );

    const weightedAPY = portfolio.positions.reduce((sum, pos) => {
      const weight = (pos.amount_usd || pos.amountUSD || 0) / totalValue;
      const apy = pos.current_apy || pos.currentAPY || pos.initial_apy || pos.initialAPY || 0;
      return sum + apy * weight;
    }, 0);

    const avgRiskScore = portfolio.positions.reduce((sum, pos) => {
      return sum + (pos.current_risk_score || pos.currentRiskScore || pos.initial_risk_score || pos.initialRiskScore || 5);
    }, 0) / portfolio.positions.length;

    // Diversification score (Herfindahl index)
    const herfindahl = portfolio.positions.reduce((sum, pos) => {
      const weight = (pos.amount_usd || pos.amountUSD || 0) / totalValue;
      return sum + weight * weight;
    }, 0);
    const diversificationScore = (1 - herfindahl) * 10; // Scale to 0-10

    return {
      totalValue: `$${totalValue.toFixed(2)}`,
      weightedAPY: weightedAPY,
      avgRiskScore: avgRiskScore,
      diversificationScore: diversificationScore,
      positionCount: portfolio.positions.length,
    };
  }

  /**
   * Apply rebalance plan to portfolio (for simulation)
   */
  applyRebalancePlan(portfolio, rebalancePlan) {
    const newPortfolio = JSON.parse(JSON.stringify(portfolio)); // Deep copy

    for (const action of rebalancePlan.actions || []) {
      if (action.action === 'rebalance') {
        // Remove old position
        const oldPosIndex = newPortfolio.positions.findIndex(
          p => p.protocol === action.from.protocol && p.chain === action.from.chain
        );

        if (oldPosIndex !== -1) {
          const amount = newPortfolio.positions[oldPosIndex].amount_usd || newPortfolio.positions[oldPosIndex].amountUSD;

          // Add new position
          newPortfolio.positions[oldPosIndex] = {
            protocol: action.to.protocol,
            chain: action.to.chain,
            symbol: action.to.symbol || action.from.symbol,
            amount_usd: amount,
            amountUSD: amount,
            current_apy: parseFloat(action.to.apy),
            currentAPY: parseFloat(action.to.apy),
            current_risk_score: action.to.riskScore || 5,
            currentRiskScore: action.to.riskScore || 5,
          };
        }
      }
    }

    return newPortfolio;
  }
}
