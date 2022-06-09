import { constants } from 'ethers';
import { task } from 'hardhat/config';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'bignumber.js';
import { PoolDataService, SOR, SorConfig, SubgraphPoolBase, TokenPriceService } from '@balancer-labs/sor';

class DataService implements PoolDataService {
    async getPools(): Promise<SubgraphPoolBase[]> {
        return [
            {
              "address": "0x01abc00e86c7e258823b9a055fd62ca6cf61a163",
              "id": "0x01abc00e86c7e258823b9a055fd62ca6cf61a16300010000000000000000003b",
              "poolType": "Weighted",
              "swapEnabled": true,
              "swapFee": "0.0015",
              "tokens": [
                {
                  "address": "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
                  "balance": "4.89855256447296506",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "balance": "10462.277975400780411468",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
                  "balance": "25750.48659246954927623",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
                  "balance": "707.628876298866395197",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
                  "balance": "54.957669972194626187",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0xba100000625a3754423978a60c9317c58a424e3d",
                  "balance": "8399.749919228918900354",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0xc00e94cb662c3520282e6f5717214004a7f26888",
                  "balance": "852.109419145871556657",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                },
                {
                  "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                  "balance": "39.91071589807788474",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.125"
                }
              ],
              "tokensList": [
                "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
                "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
                "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
                "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
                "0xba100000625a3754423978a60c9317c58a424e3d",
                "0xc00e94cb662c3520282e6f5717214004a7f26888",
                "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
              ],
              "totalShares": "4689.81029994480039808"
            },
            {
              "address": "0x021c343c6180f03ce9e48fae3ff432309b9af199",
              "id": "0x021c343c6180f03ce9e48fae3ff432309b9af19900020000000000000000000b",
              "poolType": "Weighted",
              "swapEnabled": true,
              "swapFee": "0.005",
              "tokens": [
                {
                  "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                  "balance": "0.000000000000002521",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.2"
                },
                {
                  "address": "0xd291e7a03283640fdc51b121ac401383a46cc623",
                  "balance": "0.000000000001876469",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.8"
                }
              ],
              "tokensList": [
                "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "0xd291e7a03283640fdc51b121ac401383a46cc623"
              ],
              "totalShares": "0.000000000001"
            },
            {
              "address": "0x0297e37f1873d2dab4487aa67cd56b58e2f27875",
              "id": "0x0297e37f1873d2dab4487aa67cd56b58e2f27875000200000000000000000003",
              "poolType": "Weighted",
              "swapEnabled": true,
              "swapFee": "0.0004",
              "tokens": [
                {
                  "address": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
                  "balance": "0.07980193",
                  "decimals": 8,
                  "priceRate": "1",
                  "weight": "0.5"
                },
                {
                  "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                  "balance": "1.113929082960844228",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.5"
                }
              ],
              "tokensList": [
                "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
                "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
              ],
              "totalShares": "0.595047885260633831"
            },
            {
              "address": "0x03cd191f589d12b0582a99808cf19851e468e6b5",
              "id": "0x03cd191f589d12b0582a99808cf19851e468e6b500020000000000000000002b",
              "poolType": "Weighted",
              "swapEnabled": true,
              "swapFee": "0.005",
              "tokens": [
                {
                  "address": "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
                  "balance": "0.004759778872322919",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.5"
                },
                {
                  "address": "0xba100000625a3754423978a60c9317c58a424e3d",
                  "balance": "0.646553624519376179",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.5"
                }
              ],
              "tokensList": [
                "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
                "0xba100000625a3754423978a60c9317c58a424e3d"
              ],
              "totalShares": "0.110767585394389049"
            },
            {
              "address": "0x04953368a77af5b65512ee3536efe152b96aa453",
              "id": "0x04953368a77af5b65512ee3536efe152b96aa453000200000000000000000100",
              "poolType": "LiquidityBootstrapping",
              "swapEnabled": true,
              "swapFee": "0.02",
              "tokens": [
                {
                  "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  "balance": "0.000001",
                  "decimals": 6,
                  "priceRate": "1",
                  "weight": "0.094426699369053376"
                },
                {
                  "address": "0xfc248cef4c8763838743d3bd599a27e1bd6397f4",
                  "balance": "0.000000000014626197",
                  "decimals": 18,
                  "priceRate": "1",
                  "weight": "0.905588559730802464"
                }
              ],
              "tokensList": [
                "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                "0xfc248cef4c8763838743d3bd599a27e1bd6397f4"
              ],
              "totalShares": "0.000000000001"
            }
          ];
    }
}

class PriceService implements TokenPriceService {

}


task('sor:swaps', 'bfactory info').setAction(async (taskArgs, hre) => {
    const tokenIn = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI
const tokenOut = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
    const provider = new JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.ININFURA_KEYFURA}`
    );

    const poolsUrl = `https://ipfs.fleek.co/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools`;

    const gasPrice = new BigNumber('30000000000');

    const maxNoPools = 4;

    const chainId = 1;

    const dataService = new DataService();

    const 

    const config: SorConfig = {
        chainId: 1
    };

    const sor = new SOR(provider, config, dataService, chainId);

    // isFetched will be true on success
    let isFetched = await sor.fetchPools();

    await sor.setCostOutputToken(tokenOut);

    const swapType = 'swapExactIn';

    const amountIn = new BigNumber('1000000000000000000');

    let [swaps, amountOut] = await sor.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        amountIn
    );
    console.log(`Total Return: ${amountOut.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);
});
