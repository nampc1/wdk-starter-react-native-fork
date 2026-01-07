import { useBalancesForWallet, useWdkApp } from '@tetherto/wdk-react-native-core';
import tokenConfigs from '@/config/token';
import { useMemo } from 'react';

function findTokenInfo(network: string, tokenAddress: string | null) {
  const netConfig = tokenConfigs[network];
  if (!netConfig) return null;

  if (tokenAddress === null) return netConfig.native;

  return netConfig.tokens.find((t: any) => t.address?.toLowerCase() === tokenAddress.toLowerCase());
}

export interface AggregatedAsset {
  symbol: string;
  name: string;
  totalBalance: number;
  networkBalances: {
    network: string;
    balance: number;
    address: string | null;
  }[];
}

export function useAggregatedBalances() {
  const { activeWalletId } = useWdkApp();
  // const { wallets } = useWalletManager();

  // const activeWallet = wallets.find((w) => w.identifier === activeWalletId);
  // const accountIndex = activeWallet?. ?? 0;

  // Fetch raw data using the new Core hook
  const {
    data: rawBalances,
    isLoading,
    refetch,
  } = useBalancesForWallet(
    0, // todo
    tokenConfigs,
    {
      enabled: !!activeWalletId,
      walletId: activeWalletId || undefined,
      refetchInterval: 10000, // Auto-refresh every 10s
    }
  );

  const assets = useMemo(() => {
    if (!rawBalances) return [];

    const assetMap = new Map<string, AggregatedAsset>();

    rawBalances.forEach((item) => {
      if (!item.success || item.balance === null) return;

      const balanceNum = parseFloat(item.balance);

      const info = findTokenInfo(item.network, item.tokenAddress);
      if (!info) return;

      const key = info.symbol;
      const existing = assetMap.get(key) || {
        symbol: info.symbol,
        name: info.name,
        totalBalance: 0,
        networkBalances: [],
      };

      existing.totalBalance += balanceNum;
      existing.networkBalances.push({
        network: item.network,
        balance: balanceNum,
        address: item.tokenAddress,
      });

      assetMap.set(key, existing);
    });

    return Array.from(assetMap.values());
  }, [rawBalances]);

  // todo
  const totalBalanceUSD = 0;

  return { assets, totalBalanceUSD, isLoading, refetch };
}
