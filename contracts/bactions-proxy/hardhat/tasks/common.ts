export const ADDRESSES_FOR_NETWORK: {
  [key: string]: {
    tokens: string[];
    proxy: String;
    factory: String;
    crpFactory: string;
    crp?: string;
    proxyRegistry?: string;
    pool?: string;
    sharePool?: string;
  };
} = {
  '15': {
    tokens: [
      '0x1cD44deA31f43aC8b448bd6C860f3434eC9c2f37', // dai
      '0xD509468B7c7Ca682640AE712EC82Bda7bD0B7091', // usdt
    ],
    proxy: '0x1964275E3dDcd4e9304a6e5a15680380e90C0895',
    factory: '0x30d3E5b5D1A3F287dbD1ee0185535c71cA20E03A',
    crpFactory: '0x48b227FD09b6c99Bf83F451b25118027D1101f6D',
    crp: '0x31298f6fd03d9d2779a486bf1b931ad84560a089',
    sharePool: '0x9c3cdcb670d8aea1397f5ac43e03cc6e528226a3',
  },
  '4': {
    tokens: [
      '0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa',
      '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735',
    ],
    proxy: '0xb788c56adf92e4b33a70110e2a39d4cc6a5fd82b',
    factory: '0xFD12d8d82fcDAf270079ACAc123890B16A05e5b7',
    crpFactory: '0x720E14762747a66D14Fb3aA3578C0EA72c3d2190',
    crp: '0xab5cb3ecc5b71d12b46c188047bbf9dbb7ec09de',
  },
  '42': {
    tokens: [
      '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa', // DAI
      '0x07de306ff27a2b630b1141956844eb1552b956b5', // USDT
    ],
    proxy: '0x2d1de5df8c2f6c60f9a8173c805f1587d9d61b0e',
    factory: '0x8f7f78080219d4066a8036ccd30d588b416a40db',
    crpFactory: '0x53265f0e014995363ae54dad7059c018badbcd74',
    proxyRegistry: '0x130767e0cf05469cf11fa3fcf270dfc1f52b9072',
  },
  '97': {
    tokens: [
      '0x1900D4e4418E98F307b51E8f2C4749a13a93F272', // WETH
      '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38', // DAI
      '0x84544B0815279361676Fd147dAd60a912D8CaAc0'  // USDT
    ],
    proxy: '0xa182d6F99A8d876F5A0570dC2e7E6d8E817D8d5C',
    factory: '0x12Dd3A6C957A0929608eE76f9B1f205c26cf4fB0',
    crpFactory: '0x90060814BFd6ffB71a9e524879A01eDab1Dcf2c8',
    proxyRegistry: '0xC44a566Ab070b4464CECB31B9c1CaC5bD715e70C'
  },
};
