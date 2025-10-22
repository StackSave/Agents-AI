import { StakingOrchestrator } from './orchestrator.js';

/**
 * Portfolio Rebalancing Examples
 * Demonstrasi penggunaan fitur rebalancing
 */

async function main() {
  // Initialize orchestrator dengan konfigurasi
  const orchestrator = new StakingOrchestrator({
    backend: {
      backendURL: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
      apiKey: process.env.BACKEND_API_KEY,
    },
    rebalancing: {
      apyChangePercent: 15, // Trigger jika APY berubah > 15%
      riskScoreChange: 1.5, // Trigger jika risk score berubah > 1.5
      timeIntervalDays: 30, // Check setiap 30 hari
      minRebalanceAmount: 100, // Min $100 untuk rebalance
    },
  });

  console.log('\n========================================');
  console.log('Portfolio Rebalancing Examples');
  console.log('========================================\n');

  // Example 1: Check portfolio for rebalancing
  await example1CheckRebalancing(orchestrator);

  // Example 2: Get rebalancing history
  await example2GetHistory(orchestrator);

  // Example 3: Simulate rebalancing before execution
  await example3SimulateRebalancing(orchestrator);
}

/**
 * Example 1: Check portfolio untuk rebalancing opportunities
 */
async function example1CheckRebalancing(orchestrator) {
  console.log('\n========================================');
  console.log('Example 1: Check Portfolio Rebalancing');
  console.log('========================================\n');

  try {
    // User's portfolio ID (dari backend)
    const portfolioId = 'user123_portfolio_1';

    // Optional: User preferences
    const userPreferences = {
      riskTolerance: 'medium',
    };

    const result = await orchestrator.checkRebalancing(portfolioId, userPreferences);

    console.log('\n--- Rebalancing Analysis Result ---\n');

    if (result.shouldRebalance) {
      console.log(`🔔 REBALANCING RECOMMENDED (Severity: ${result.severity.toUpperCase()})`);
      console.log('\nTriggered Factors:');
      result.triggers.forEach((trigger, idx) => {
        console.log(`\n${idx + 1}. ${trigger.type.toUpperCase()} (${trigger.severity})`);
        console.log('   Details:', JSON.stringify(trigger.details, null, 2));
      });

      console.log('\n--- Current Portfolio ---');
      console.log(`Total Value: ${result.currentPortfolio.totalValue}`);
      console.log(`Positions: ${result.currentPortfolio.positionCount}`);
      result.currentPortfolio.positions.forEach((pos, idx) => {
        console.log(`  ${idx + 1}. ${pos.protocol} (${pos.chain}): ${pos.amount} (${pos.allocation})`);
      });

      console.log('\n--- Rebalancing Suggestions ---');
      result.suggestions.forEach((suggestion, idx) => {
        console.log(`\n${idx + 1}. ${suggestion.action.toUpperCase()} [Priority: ${suggestion.priority}]`);

        if (suggestion.action === 'rebalance') {
          console.log(`   FROM: ${suggestion.from.protocol} @ ${suggestion.from.currentAPY} APY`);
          console.log(`   TO:   ${suggestion.to.protocol} @ ${suggestion.to.apy} APY`);
          console.log(`   Expected Improvement: ${suggestion.expectedImprovement.apyIncrease}`);
          console.log(`   Annual Gain: ${suggestion.expectedImprovement.annualizedGain}`);
          console.log(`   Reason: ${suggestion.reason}`);
        } else if (suggestion.action === 'diversify') {
          console.log(`   Details: ${JSON.stringify(suggestion.details, null, 2)}`);
        }
      });

      console.log('\n--- Estimated Impact ---');
      console.log(`Current Annual Return: ${result.estimatedImpact.currentAnnualReturn}`);
      console.log(`Projected Annual Return: ${result.estimatedImpact.projectedAnnualReturn}`);
      console.log(`Additional Return: ${result.estimatedImpact.additionalReturn} (+${result.estimatedImpact.improvementPercent})`);
    } else {
      console.log('✅ Portfolio is well-balanced. No rebalancing needed.');
      console.log(`Message: ${result.message}`);
      console.log(`Next check date: ${result.nextCheckDate}`);

      if (result.triggers && result.triggers.length > 0) {
        console.log('\nTriggered factors (below threshold):');
        result.triggers.forEach(trigger => {
          console.log(`  - ${trigger.type}: ${trigger.severity}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: This example requires backend API to be running.');
    console.log('Expected backend endpoints:');
    console.log('  GET  /api/portfolio/id/:portfolioId');
    console.log('  POST /api/portfolio/:portfolioId/rebalance-suggestion');
  }
}

/**
 * Example 2: Get rebalancing history
 */
async function example2GetHistory(orchestrator) {
  console.log('\n\n========================================');
  console.log('Example 2: Rebalancing History');
  console.log('========================================\n');

  try {
    const portfolioId = 'user123_portfolio_1';
    const result = await orchestrator.getRebalanceHistory(portfolioId, 5);

    console.log(`Portfolio: ${result.portfolioId}`);
    console.log(`History Records: ${result.historyCount}\n`);

    if (result.history && result.history.length > 0) {
      result.history.forEach((record, idx) => {
        console.log(`${idx + 1}. ${new Date(record.created_at || record.createdAt).toLocaleDateString()}`);
        console.log(`   Trigger: ${record.trigger_type || record.triggerType}`);
        console.log(`   Executed: ${record.executed ? 'Yes' : 'No'}`);
        if (record.trigger_details || record.triggerDetails) {
          console.log(`   Details: ${record.trigger_details || record.triggerDetails}`);
        }
      });
    } else {
      console.log('No rebalancing history found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: This example requires backend API to be running.');
    console.log('Expected backend endpoint:');
    console.log('  GET /api/portfolio/:portfolioId/rebalance-history');
  }
}

/**
 * Example 3: Simulate rebalancing before execution
 */
async function example3SimulateRebalancing(orchestrator) {
  console.log('\n\n========================================');
  console.log('Example 3: Simulate Rebalancing');
  console.log('========================================\n');

  try {
    const portfolioId = 'user123_portfolio_1';

    // Mock rebalance plan (normally this comes from checkRebalancing result)
    const rebalancePlan = {
      actions: [
        {
          action: 'rebalance',
          from: {
            protocol: 'Old Protocol',
            chain: 'Ethereum',
            currentAPY: '3.5',
            amountUSD: 5000,
          },
          to: {
            protocol: 'Lido',
            chain: 'Ethereum',
            symbol: 'stETH',
            apy: '4.2',
            riskScore: 2.5,
          },
        },
      ],
    };

    const simulation = await orchestrator.simulateRebalancing(portfolioId, rebalancePlan);

    console.log('--- Current Portfolio ---');
    console.log(`Total Value: ${simulation.current.totalValue}`);
    console.log(`Weighted APY: ${simulation.current.weightedAPY.toFixed(2)}%`);
    console.log(`Avg Risk Score: ${simulation.current.avgRiskScore.toFixed(2)}`);
    console.log(`Diversification Score: ${simulation.current.diversificationScore.toFixed(2)}/10`);

    console.log('\n--- Projected Portfolio (After Rebalance) ---');
    console.log(`Total Value: ${simulation.projected.totalValue}`);
    console.log(`Weighted APY: ${simulation.projected.weightedAPY.toFixed(2)}%`);
    console.log(`Avg Risk Score: ${simulation.projected.avgRiskScore.toFixed(2)}`);
    console.log(`Diversification Score: ${simulation.projected.diversificationScore.toFixed(2)}/10`);

    console.log('\n--- Changes ---');
    console.log(`APY Change: ${simulation.changes.apyChange}`);
    console.log(`Risk Change: ${simulation.changes.riskChange}`);
    console.log(`Diversification Change: ${simulation.changes.diversificationChange.toFixed(2)}`);

    console.log(`\n🎯 Recommendation: ${simulation.recommendation}`);
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: This example requires backend API to be running.');
    console.log('Expected backend endpoint:');
    console.log('  GET /api/portfolio/id/:portfolioId');
  }
}

// Run examples
main().catch(console.error);
