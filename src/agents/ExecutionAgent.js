import { ethers } from 'ethers';

/**
 * Execution Agent
 * Menangani eksekusi transaksi staking (optional - requires wallet connection)
 */
export class ExecutionAgent {
  constructor(providerUrl, privateKey = null) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.wallet = privateKey ? new ethers.Wallet(privateKey, this.provider) : null;

    // Common staking contract ABIs (simplified)
    this.stakingABI = [
      'function stake() external payable',
      'function submit(address _referral) external payable returns (uint256)',
      'function balanceOf(address account) external view returns (uint256)',
      'function approve(address spender, uint256 amount) external returns (bool)',
    ];
  }

  /**
   * Simulate staking transaction (without actually executing)
   */
  async simulateStaking(recommendation, amount) {
    console.log('[ExecutionAgent] Simulating staking transaction...');

    const { protocol, chain, symbol } = recommendation;

    // Get contract address based on protocol
    const contractAddress = this.getContractAddress(protocol, chain);

    if (!contractAddress) {
      return {
        success: false,
        error: 'Contract address not found for this protocol',
      };
    }

    // Estimate gas
    const gasEstimate = await this.estimateGas(protocol, amount);

    return {
      success: true,
      simulation: {
        protocol,
        chain,
        symbol,
        amount,
        contractAddress,
        estimatedGas: gasEstimate,
        estimatedCost: `${gasEstimate.totalCostETH} ETH ($${gasEstimate.totalCostUSD})`,
        steps: this.getStakingSteps(protocol),
      },
    };
  }

  /**
   * Execute actual staking (requires wallet)
   */
  async executeStaking(recommendation, amount) {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Cannot execute transactions.');
    }

    console.log('[ExecutionAgent] Executing staking transaction...');

    const { protocol, chain } = recommendation;
    const contractAddress = this.getContractAddress(protocol, chain);

    if (!contractAddress) {
      throw new Error('Contract address not found for this protocol');
    }

    try {
      const contract = new ethers.Contract(contractAddress, this.stakingABI, this.wallet);

      // Execute staking based on protocol
      let tx;
      if (protocol.toLowerCase().includes('lido')) {
        // Lido: submit() function
        tx = await contract.submit(ethers.ZeroAddress, {
          value: ethers.parseEther(amount.toString()),
        });
      } else {
        // Generic stake() function
        tx = await contract.stake({
          value: ethers.parseEther(amount.toString()),
        });
      }

      console.log(`[ExecutionAgent] Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: this.getExplorerUrl(chain, receipt.hash),
      };
    } catch (error) {
      console.error('[ExecutionAgent] Transaction failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get contract address for protocol
   */
  getContractAddress(protocol, chain) {
    const protocolLower = protocol.toLowerCase();
    const chainLower = chain.toLowerCase();

    const contracts = {
      'lido-ethereum': '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Lido stETH
      'lido-polygon': '0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599', // Lido stMATIC
      'rocket-pool-ethereum': '0xae78736Cd615f374D3085123A210448E74Fc6393', // Rocket Pool
      'frax-ethereum': '0xac3E018457B222d93114458476f3E3416Abbe38F', // Frax frxETH
    };

    const key = `${protocolLower}-${chainLower}`;
    return contracts[key] || null;
  }

  /**
   * Estimate gas costs
   */
  async estimateGas(protocol, amount) {
    try {
      const gasPrice = await this.provider.getFeeData();
      const estimatedGas = 100000; // Average gas for staking tx

      const totalCostWei = gasPrice.gasPrice * BigInt(estimatedGas);
      const totalCostETH = ethers.formatEther(totalCostWei);

      // Assume ETH price (in production, fetch from oracle)
      const ethPriceUSD = 2000;
      const totalCostUSD = (parseFloat(totalCostETH) * ethPriceUSD).toFixed(2);

      return {
        gasLimit: estimatedGas,
        gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
        totalCostETH: parseFloat(totalCostETH).toFixed(6),
        totalCostUSD,
      };
    } catch (error) {
      console.error('[ExecutionAgent] Error estimating gas:', error);
      return {
        gasLimit: 100000,
        gasPrice: '30',
        totalCostETH: '0.003',
        totalCostUSD: '6.00',
      };
    }
  }

  /**
   * Get staking steps for user
   */
  getStakingSteps(protocol) {
    const protocolLower = protocol.toLowerCase();

    const commonSteps = [
      '1. Connect wallet to dApp',
      '2. Approve transaction in wallet',
      '3. Wait for transaction confirmation',
      '4. Receive staked tokens',
    ];

    if (protocolLower.includes('lido')) {
      return [
        '1. Go to https://stake.lido.fi',
        '2. Connect your wallet',
        '3. Enter amount to stake',
        '4. Confirm transaction',
        '5. Receive stETH (1:1 with ETH)',
        '6. stETH automatically accrues rewards',
      ];
    }

    if (protocolLower.includes('rocket')) {
      return [
        '1. Go to https://stake.rocketpool.net',
        '2. Connect your wallet',
        '3. Enter amount to stake (min 0.01 ETH)',
        '4. Confirm transaction',
        '5. Receive rETH',
      ];
    }

    return commonSteps;
  }

  /**
   * Get block explorer URL
   */
  getExplorerUrl(chain, txHash) {
    const chainLower = chain.toLowerCase();

    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
    };

    return explorers[chainLower] || `https://etherscan.io/tx/${txHash}`;
  }

  /**
   * Generate transaction instructions for manual execution
   */
  generateInstructions(recommendation, amount) {
    const { protocol, chain, symbol, apy } = recommendation;

    return {
      protocol,
      chain,
      symbol,
      amount,
      expectedAPY: apy,
      steps: this.getStakingSteps(protocol),
      contractAddress: this.getContractAddress(protocol, chain),
      importantNotes: [
        'Always verify the contract address on official documentation',
        'Start with a small amount to test',
        'Keep some ETH for gas fees',
        'Staked tokens may have unbonding period',
        'You will receive liquid staking tokens (LST) that can be traded',
      ],
      officialLinks: this.getOfficialLinks(protocol),
    };
  }

  /**
   * Get official protocol links
   */
  getOfficialLinks(protocol) {
    const protocolLower = protocol.toLowerCase();

    const links = {
      lido: {
        website: 'https://lido.fi',
        docs: 'https://docs.lido.fi',
        app: 'https://stake.lido.fi',
      },
      'rocket-pool': {
        website: 'https://rocketpool.net',
        docs: 'https://docs.rocketpool.net',
        app: 'https://stake.rocketpool.net',
      },
      frax: {
        website: 'https://frax.finance',
        docs: 'https://docs.frax.finance',
        app: 'https://app.frax.finance',
      },
    };

    return links[protocolLower] || { website: 'N/A', docs: 'N/A', app: 'N/A' };
  }
}
