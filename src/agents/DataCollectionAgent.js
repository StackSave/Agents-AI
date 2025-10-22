import axios from 'axios';

/**
 * Data Collection Agent
 * Mengumpulkan data real-time dari berbagai sumber DeFi
 */
export class DataCollectionAgent {
  constructor() {
    this.defiLlamaBaseUrl = 'https://api.llama.fi';
    this.yieldsApiUrl = 'https://yields.llama.fi';
    this.coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  }

  /**
   * Mengumpulkan data APY dari berbagai protokol staking
   */
  async collectStakingPools() {
    try {
      console.log('[DataAgent] Collecting staking pool data...');

      // Get pools from DeFiLlama Yields API
      const response = await axios.get(`${this.yieldsApiUrl}/pools`);
      const pools = response.data.data;

      // Filter hanya staking pools (exclude lending, LP, dll)
      const stakingPools = pools
        .filter(pool => {
          const symbol = pool.symbol?.toLowerCase() || '';
          const project = pool.project?.toLowerCase() || '';

          // Filter staking pools utama
          return (
            pool.apy > 0 &&
            pool.tvlUsd > 1000000 && // Min TVL $1M
            (
              symbol.includes('eth') ||
              symbol.includes('steth') ||
              symbol.includes('matic') ||
              symbol.includes('sol') ||
              project.includes('lido') ||
              project.includes('rocket') ||
              project.includes('frax')
            )
          );
        })
        .slice(0, 50); // Limit to top 50

      console.log(`[DataAgent] Found ${stakingPools.length} staking pools`);

      return stakingPools.map(pool => ({
        protocol: pool.project,
        chain: pool.chain,
        symbol: pool.symbol,
        apy: pool.apy,
        apyBase: pool.apyBase || 0,
        apyReward: pool.apyReward || 0,
        tvl: pool.tvlUsd,
        poolId: pool.pool,
      }));
    } catch (error) {
      console.error('[DataAgent] Error collecting pools:', error.message);
      return this.getFallbackData();
    }
  }

  /**
   * Mengambil data harga token dari CoinGecko
   */
  async getTokenPrices(symbols = ['ethereum', 'matic-network', 'solana']) {
    try {
      console.log('[DataAgent] Fetching token prices...');

      const response = await axios.get(`${this.coinGeckoBaseUrl}/simple/price`, {
        params: {
          ids: symbols.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
        },
      });

      return response.data;
    } catch (error) {
      console.error('[DataAgent] Error fetching prices:', error.message);
      return {};
    }
  }

  /**
   * Mengambil data historis protokol untuk analisis trend
   */
  async getProtocolHistory(protocol) {
    try {
      const response = await axios.get(`${this.defiLlamaBaseUrl}/protocol/${protocol}`);
      return {
        tvlHistory: response.data.tvl || [],
        chainTvls: response.data.chainTvls || {},
      };
    } catch (error) {
      console.error(`[DataAgent] Error fetching protocol ${protocol} history:`, error.message);
      return null;
    }
  }

  /**
   * Fallback data jika API error
   */
  getFallbackData() {
    console.log('[DataAgent] Using fallback data...');

    return [
      {
        protocol: 'lido',
        chain: 'Ethereum',
        symbol: 'stETH',
        apy: 3.5,
        apyBase: 3.5,
        apyReward: 0,
        tvl: 14200000000,
        poolId: 'lido-steth',
      },
      {
        protocol: 'rocket-pool',
        chain: 'Ethereum',
        symbol: 'rETH',
        apy: 3.8,
        apyBase: 3.8,
        apyReward: 0,
        tvl: 1800000000,
        poolId: 'rocket-pool-reth',
      },
      {
        protocol: 'frax',
        chain: 'Ethereum',
        symbol: 'frxETH',
        apy: 4.2,
        apyBase: 4.2,
        apyReward: 0,
        tvl: 450000000,
        poolId: 'frax-frxeth',
      },
      {
        protocol: 'lido',
        chain: 'Polygon',
        symbol: 'stMATIC',
        apy: 4.8,
        apyBase: 4.8,
        apyReward: 0,
        tvl: 120000000,
        poolId: 'lido-stmatic',
      },
    ];
  }

  /**
   * Agregasi semua data yang dibutuhkan
   */
  async collectAllData() {
    console.log('[DataAgent] Starting data collection...');

    const [pools, prices] = await Promise.all([
      this.collectStakingPools(),
      this.getTokenPrices(),
    ]);

    return {
      pools,
      prices,
      timestamp: new Date().toISOString(),
    };
  }
}
