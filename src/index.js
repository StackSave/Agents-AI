import { StakingOrchestrator } from './orchestrator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main entry point
 */
async function main() {
  console.log('='.repeat(60));
  console.log('AI STAKING AGENTS - Automated DeFi Staking Recommendations');
  console.log('='.repeat(60));

  try {
    // Initialize orchestrator
    const orchestrator = new StakingOrchestrator({
      providerUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    });

    // Example: Get staking recommendation for beginner
    const recommendation = await orchestrator.getStakingRecommendation({
      amount: 1000, // $1000 USD
      riskTolerance: 'low', // Beginner = low risk
      timeHorizon: '30days',
      includeDiversification: true,
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATION RESULTS');
    console.log('='.repeat(60));

    console.log('\n🎯 TOP RECOMMENDATION:');
    console.log('-'.repeat(60));
    console.log(`Protocol: ${recommendation.recommended.protocol}`);
    console.log(`Chain: ${recommendation.recommended.chain}`);
    console.log(`Asset: ${recommendation.recommended.symbol}`);
    console.log(`APY: ${recommendation.recommended.apy}`);
    console.log(`TVL: ${recommendation.recommended.tvl}`);
    console.log(`Risk Level: ${recommendation.recommended.risk}`);
    console.log(`Score: ${recommendation.recommended.score}/10`);
    console.log(`\nReason: ${recommendation.recommended.reason}`);

    console.log('\n💰 PROJECTED RETURNS:');
    console.log('-'.repeat(60));
    const returns = recommendation.recommended.projectedReturn;
    console.log(`Investment: $${returns.principal}`);
    console.log(`Time Horizon: ${returns.timeHorizon}`);
    console.log(`Expected Return: $${returns.amount} (${returns.percentage}%)`);
    console.log(`Total Value: $${returns.total}`);

    console.log('\n📊 ALTERNATIVES:');
    console.log('-'.repeat(60));
    recommendation.alternatives.forEach((alt, idx) => {
      console.log(`\n${idx + 1}. ${alt.protocol} (${alt.chain})`);
      console.log(`   APY: ${alt.apy} | TVL: ${alt.tvl} | Risk: ${alt.risk}`);
      console.log(`   ${alt.reason}`);
    });

    if (recommendation.diversification?.recommended) {
      console.log('\n🎲 DIVERSIFICATION STRATEGY:');
      console.log('-'.repeat(60));
      recommendation.diversification.strategy.forEach(item => {
        console.log(`${item.protocol}: ${item.allocation} ($${item.amount}) - APY: ${item.apy}`);
      });
      console.log(`\nBlended APY: ${recommendation.diversification.expectedBlendedAPY}`);
    }

    if (recommendation.executionInstructions) {
      console.log('\n📋 HOW TO STAKE:');
      console.log('-'.repeat(60));
      recommendation.executionInstructions.steps.forEach(step => {
        console.log(step);
      });

      console.log('\n🔗 OFFICIAL LINKS:');
      const links = recommendation.executionInstructions.officialLinks;
      console.log(`Website: ${links.website}`);
      console.log(`App: ${links.app}`);
      console.log(`Docs: ${links.docs}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Analysis completed successfully!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
main();

export { StakingOrchestrator };
