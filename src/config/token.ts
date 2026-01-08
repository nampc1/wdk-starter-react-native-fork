import { NetworkTokens } from '@tetherto/wdk-react-native-core';

export type TokenUiConfig = {
  icon: any;
  color: string;
};

export const tokenUiConfigs: Record<string, TokenUiConfig> = {
  ETH: {
    icon: require('../../assets/images/chains/ethereum-eth-logo.png'),
    color: '#627EEA',
  },
  USDT: {
    icon: require('../../assets/images/tokens/tether-usdt-logo.png'),
    color: '#26A17B',
  },
  XAUT: {
    icon: require('../../assets/images/tokens/tether-xaut-logo.png'),
    color: '#D6AD3F',
  },
  BTC: {
    icon: require('../../assets/images/tokens/bitcoin-btc-logo.png'),
    color: '#F7931A',
  },
  USAT: {
    icon: null,
    color: '#009393',
  },
};

const tokenConfigs: Record<string, NetworkTokens> = {
  ethereum: {
    native: {
      address: null,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    tokens: [
      {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
      },
      {
        address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
        symbol: 'XAUT',
        name: 'Tether Gold',
        decimals: 6,
      },
      {
        address: '0x07041776f5007aca2a54844f50503a18a72a8b68',
        symbol: 'USAT',
        name: 'Tether USAT',
        decimals: 6,
      },
    ],
  },
};

export default tokenConfigs;
