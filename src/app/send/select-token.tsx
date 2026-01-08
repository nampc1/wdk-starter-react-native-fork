import { tokenUiConfigs } from '@/config/token';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

import { AssetSelector, type Token } from '@tetherto/wdk-uikit-react-native';

import { useAggregatedBalances } from '@/hooks/use-aggregated-balances';

import { getRecentTokens, addToRecentTokens } from '@/utils/recent-tokens';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';

export default function SelectTokenScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const params = useLocalSearchParams();
  const { scannedAddress } = params as { scannedAddress?: string };

  // Use aggregated hook
  const { assets } = useAggregatedBalances();

  const [recentTokens, setRecentTokens] = useState<string[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const loadRecentTokens = async () => {
      const recent = await getRecentTokens('send');
      setRecentTokens(recent);
    };
    loadRecentTokens();
  }, []);

  // Transform data
  useEffect(() => {
    if (!assets) {
      setTokens([]);
      return;
    }

    const transformedTokens: Token[] = assets.map((asset) => {
      const config = tokenUiConfigs[asset.symbol] || {
        color: colors.primary,
        icon: null,
      };

      // todo: handle pricing

      return {
        id: asset.symbol,
        symbol: asset.symbol,
        name: asset.name,
        balance: formatTokenAmount(asset.totalBalance, asset.symbol),
        balanceUSD: '$0.00 USD', // Placeholder string
        icon: config.icon,
        color: config.color,
        hasBalance: asset.totalBalance > 0,
      };
    });

    // Simple sort by balance availability then alpha
    const sortedTokens = transformedTokens.sort((a, b) => {
      if (a.hasBalance === b.hasBalance) return a.name.localeCompare(b.name);
      return a.hasBalance ? -1 : 1;
    });

    setTokens(sortedTokens);
  }, [assets]);

  const handleSelectToken = useCallback(
    async (token: Token) => {
      if (!token.hasBalance) return;

      await addToRecentTokens(token.name, 'send');
      const recent = await getRecentTokens('send');
      setRecentTokens(recent);

      router.push({
        pathname: '/send/select-network',
        params: {
          tokenId: token.id,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenBalance: token.balance,
          tokenBalanceUSD: token.balanceUSD,
          ...(scannedAddress && { scannedAddress }),
        },
      });
    },
    [router, scannedAddress]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Send funds" style={styles.header} />
      <AssetSelector
        tokens={tokens}
        recentTokens={recentTokens}
        onSelectToken={handleSelectToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 16,
  },
});
