import { NetworkConfigs } from '@tetherto/wdk-react-native-core';

export enum Network {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  TON = 'ton',
  TRON = 'tron',
  SOLANA = 'solana',
  LIGHTNING = 'lightning',
}

export type ChainUiConfig = {
  name: string;
  color: string;
  icon: any;
  description?: string;
};

export const chainUiConfigs: Record<string, ChainUiConfig> = {
  [Network.ETHEREUM]: {
    name: 'Ethereum',
    color: '#627EEA',
    icon: require('../../assets/images/chains/ethereum-eth-logo.png'),
    description: 'Ethereum network',
  },
  [Network.BITCOIN]: {
    name: 'Bitcoin',
    color: '#F7931A',
    icon: require('../../assets/images/chains/bitcoin-btc-logo.png'),
    description: 'Bitcoin Network',
  },
  [Network.POLYGON]: {
    name: 'Polygon',
    color: '#8247E5',
    icon: require('../../assets/images/chains/polygon-matic-logo.png'),
    description: 'Polygon Network',
  },
  [Network.ARBITRUM]: {
    name: 'Arbitrum',
    color: '#28A0F0',
    icon: require('../../assets/images/chains/arbitrum-arb-logo.png'),
    description: 'Arbitrum One',
  },
  [Network.TON]: {
    name: 'TON',
    color: '#0098EA',
    icon: require('../../assets/images/chains/ton-logo.png'),
    description: 'TON Network',
  },
  [Network.TRON]: {
    name: 'Tron',
    color: '#FF0013',
    icon: require('../../assets/images/chains/tron-trx-logo.png'),
    description: 'Tron Network',
  },
  [Network.SOLANA]: {
    name: 'Solana',
    color: '#9945FF',
    icon: require('../../assets/images/chains/solana-sol-logo.png'),
    description: 'Solana Network',
  },
  [Network.LIGHTNING]: {
    name: 'Lightning',
    color: '#7B1AF8',
    icon: require('../../assets/images/chains/lightning-logo.png'),
    description: 'Lightning Network',
  },
};

const chainConfigs: NetworkConfigs = {
  [Network.ETHEREUM]: {
    chainId: 1, // Sepolia
    blockchain: 'Ethereum',
    provider: 'https://eth.llamarpc.com',
  },
  // [Network.BITCOIN]: {
  //   host: 'electrum.blockstream.info',
  //   port: 50001,
  // },
  // [Network.POLYGON]: {
  //   chainId: 137,
  //   blockchain: 'polygon',
  //   provider: 'https://api.zan.top/polygon-mainnet'
  // },
  // [Network.ARBITRUM]: {
  //   chainId: 42161,
  //   blockchain: 'arbitrum',
  //   provider: 'https://api.zan.top/arb-one'
  // },
  // [Network.TON]: {
  //   tonApiClient: {
  //     url: 'https://tonapi.io',
  //   },
  //   tonClient: {
  //     url: 'https://toncenter.com/api/v2/jsonRPC',
  //   },
  // },
  // [Network.TRON]: {
  //   chainId: 3448148188,
  //   provider: 'https://trongrid.io',
  // },
};

export default chainConfigs;
