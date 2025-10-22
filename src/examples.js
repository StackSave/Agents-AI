import { StakingOrchestrator } from './orchestrator.js';

/**
 * Example usage scenarios
 */

async function example1_BeginnerStaking() {
  console.log('\n📘 EXAMPLE 1: Beginner with $1000, Low Risk\n');

  const orchestrator = new StakingOrchestrator({
    providerUrl: 'https://eth.llamarpc.com',
  });

  const recommendation = await orchestrator.getStakingRecommendation({
    amount: 1000,
    riskTolerance: 'low',
    timeHorizon: '30days',
    includeDiversification: false,
  });

  console.log('Recommendation:', JSON.stringify(recommendation.recommended, null, 2));
}

async function example2_AggressiveStaking() {
  console.log('\n📗 EXAMPLE 2: Aggressive investor with $5000, High Risk\n');

  const orchestrator = new StakingOrchestrator({
    providerUrl: 'https://eth.llamarpc.com',
  });

  const recommendation = await orchestrator.getStakingRecommendation({
    amount: 5000,
    riskTolerance: 'high',
    timeHorizon: '90days',
    includeDiversification: true,
  });

  console.log('Top Recommendation:', recommendation.recommended.protocol);
  console.log('Expected APY:', recommendation.recommended.apy);
  console.log('Projected Return:', recommendation.recommended.projectedReturn);

  if (recommendation.diversification?.recommended) {
    console.log('\nDiversification Strategy:');
    console.log(JSON.stringify(recommendation.diversification.strategy, null, 2));
  }
}

async function example3_ProtocolComparison() {
  console.log('\n📙 EXAMPLE 3: Compare Lido vs Rocket Pool\n');

  const orchestrator = new StakingOrchestrator();

  const comparison = await orchestrator.compareProtocols(
    ['lido', 'rocket-pool'],
    {
      amount: 2000,
      riskTolerance: 'low',
      timeHorizon: '1year',
    }
  );

  console.log('Comparison Results:');
  comparison.comparison.forEach(protocol => {
    console.log(`\n${protocol.protocol}:`);
    console.log(`  APY: ${protocol.apy}`);
    console.log(`  TVL: ${protocol.tvl}`);
    console.log(`  Risk: ${protocol.risk}`);
    console.log(`  Pros: ${protocol.pros.join(', ')}`);
    console.log(`  Cons: ${protocol.cons.join(', ')}`);
  });

  console.log('\nRecommended:', comparison.recommendation.recommended.protocol);
}

async function example4_MarketOverview() {
  console.log('\n📕 EXAMPLE 4: Market Overview\n');

  const orchestrator = new StakingOrchestrator();

  const overview = await orchestrator.getMarketOverview();

  console.log('Market Overview:');
  console.log(`Total Pools: ${overview.totalPools}`);
  console.log(`Average APY: ${overview.averageAPY}`);
  console.log(`Highest APY: ${overview.highestAPY}`);
  console.log(`Total TVL: ${overview.totalTVL}`);

  console.log('\nTop 5 Protocols by TVL:');
  overview.topProtocols.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.protocol} - TVL: ${p.tvl}, APY: ${p.apy}`);
  });
}

async function example5_QuickRecommendation() {
  console.log('\n📓 EXAMPLE 5: Quick Recommendation (Simplified)\n');

  const orchestrator = new StakingOrchestrator();

  const recommendation = await orchestrator.getQuickRecommendation(500, 'medium');

  console.log('Quick Recommendation for $500 (Medium Risk):');
  console.log(`Protocol: ${recommendation.recommended.protocol}`);
  console.log(`APY: ${recommendation.recommended.apy}`);
  console.log(`Risk: ${recommendation.recommended.risk}`);
  console.log(`Reason: ${recommendation.recommended.reason}`);
}

// Run all examples
async function runAllExamples() {
  try {
    await example1_BeginnerStaking();
    console.log('\n' + '='.repeat(80) + '\n');

    await example2_AggressiveStaking();
    console.log('\n' + '='.repeat(80) + '\n');

    await example3_ProtocolComparison();
    console.log('\n' + '='.repeat(80) + '\n');

    await example4_MarketOverview();
    console.log('\n' + '='.repeat(80) + '\n');

    await example5_QuickRecommendation();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_BeginnerStaking,
  example2_AggressiveStaking,
  example3_ProtocolComparison,
  example4_MarketOverview,
  example5_QuickRecommendation,
};
