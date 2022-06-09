import { constants } from 'ethers';
import { task } from 'hardhat/config';

task('exchange-pr:swaps-in', 'Exchange Proxy swaps in').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, artifacts } = hre;
  const { deployer } = await getNamedAccounts();
  const { user1 } = await getNamedAccounts()
  const { toWei } = web3.utils;
  
  const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272'; 
  const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38'; 
  const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0'; 
  const ExchangeProxy = await deployments.get('ExchangeProxy');
  const proxy = new web3.eth.Contract(
    ExchangeProxy.abi,
    ExchangeProxy.address
  );
  console.log(`Using Proxy @ ${proxy.options.address}`);

  const MAX = constants.MaxUint256.toString();

  const pool1 = '0xeee249083674a1a8227a0b79bfe52c7eb940aed1';
  const pool2 = '0xe00e768dddc63ffdf8f6be32e33d14021492ba9f';
  const pool3 = '0xeac8a87f3d6a516810818edaeb9c663dd38bf40a';

  const swap1Params = {
    pool: pool1,
    tokenIn: WETH,
    tokenOut: DAI,
    swapAmount: toWei('2').toString(), // tokenInAmount / tokenOutAmount
    limitReturnAmount: toWei('0').toString(), // minAmountOut / maxAmountIn
    maxPrice: MAX
  };
  
  const swap2Params = {
    pool: pool2,
    tokenIn: DAI,
    tokenOut: WETH,
    swapAmount: toWei('1').toString(), // tokenInAmount / tokenOutAmount
    limitReturnAmount: toWei('0').toString(), // minAmountOut / maxAmountIn
    maxPrice: MAX
  };
  const swap3Params = {
    pool: pool3,
    tokenIn: DAI,
    tokenOut: USDT,
    swapAmount: toWei('1.5').toString(), // tokenInAmount / tokenOutAmount
    limitReturnAmount: toWei('0').toString(), // minAmountOut / maxAmountIn
    maxPrice: MAX
  };

  const txBatch = await proxy.methods
    .batchSwapExactIn(
        [swap1Params, swap2Params, swap3Params],
        WETH,
        DAI,
        toWei('5').toString(),
        toWei('0').toString()
    )
    .send({ from: user1 });
  console.log(`Swapped, tx: ${txBatch.transactionHash}`);

  const txMulti = await proxy.methods
    .multihopBatchSwapExactIn(
        [[swap1Params, swap2Params], [swap3Params]],
        WETH,
        DAI,
        toWei('6').toString(),
        toWei('0').toString()
    )
    .send({ from: user1 });
  console.log(`Swapped, tx: ${txMulti.transactionHash}`);
});

task('exchange-pr:swaps-out', 'Exchange Proxy swaps in').setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts()
    const { toWei } = web3.utils;
    
    const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272'; 
    const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38'; 
    const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0'; 
    const ExchangeProxy = await deployments.get('ExchangeProxy');
    const proxy = new web3.eth.Contract(
      ExchangeProxy.abi,
      ExchangeProxy.address
    );
    console.log(`Using Proxy @ ${proxy.options.address}`);
  
    const MAX = constants.MaxUint256.toString();
  
    const pool1 = '0xeee249083674a1a8227a0b79bfe52c7eb940aed1';
    const pool2 = '0xe00e768dddc63ffdf8f6be32e33d14021492ba9f';
    const pool3 = '0xeac8a87f3d6a516810818edaeb9c663dd38bf40a';
  
    const swap1Params = {
      pool: pool1,
      tokenIn: WETH,
      tokenOut: DAI,
      swapAmount: toWei('1').toString(), // tokenInAmount / tokenOutAmount
      limitReturnAmount: MAX, // minAmountOut / maxAmountIn
      maxPrice: MAX
    };
    
    const swap2Params = {
      pool: pool2,
      tokenIn: USDT,
      tokenOut: WETH,
      swapAmount: toWei('1').toString(), // tokenInAmount / tokenOutAmount
      limitReturnAmount: MAX, // minAmountOut / maxAmountIn
      maxPrice: MAX
    };
    const swap3Params = {
      pool: pool3,
      tokenIn: DAI,
      tokenOut: USDT,
      swapAmount: toWei('0.5').toString(), // tokenInAmount / tokenOutAmount
      limitReturnAmount: MAX, // minAmountOut / maxAmountIn
      maxPrice: MAX
    };
  
    const txBatch = await proxy.methods
      .batchSwapExactOut(
          [swap1Params, swap2Params, swap3Params],
          WETH,
          DAI,
          toWei('10').toString()
      )
      .send({ from: user1 });
    console.log(`Swapped, tx: ${txBatch.transactionHash}`);
  });