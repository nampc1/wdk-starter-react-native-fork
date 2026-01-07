import { assetConfig } from '@/config/assets';
import formatAmount from '@/utils/format-amount';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TokenDetails } from '../components/TokenDetails';
import { networkConfigs } from '@/config/networks';
import Header from '@/components/header';
import { colors } from '@/constants/colors';
import { useAggregatedBalances } from '@/hooks/use-aggregated-balances';
import { useWdkApp } from '@tetherto/wdk-react-native-core';

export default function TokenDetailsScreen() {
  const router = useDebouncedNavigation();
  const insets = useSafeAreaInsets();
  const { activeWalletId } = useWdkApp();
  const { assets, isLoading } = useAggregatedBalances();

  const params = useLocalSearchParams<{ walletId?: string; token?: string }>();
  const tokenSymbol = params.token;

  const assetData = assets.find((a) => a.symbol === tokenSymbol);

  const tokenData = assetData
    ? {
        symbol: assetData.symbol,
        name: assetData.name,
        icon: assetConfig[assetData.symbol]?.icon || null, // Look up config
        color: assetConfig[assetData.symbol]?.color || colors.primary,
        totalBalance: assetData.totalBalance,
        totalUSDValue: 0, // Placeholder
        networkBalances: assetData.networkBalances.map((nb) => ({
          network: nb.network,
          balance: nb.balance,
          usdValue: 0, // Placeholder
          address: nb.address,
        })),
        priceUSD: 0, // Placeholder
      }
    : null;

  const handleSendToken = (network?: string) => {
    if (!tokenData || !network) return;

    const networkBalance = tokenData.networkBalances.find((nb) => nb.network === network);
    if (!networkBalance) return;

    const networkName = networkConfigs[network]?.name || network;

    router.push({
      pathname: '/send/details',
      params: {
        network: networkName,
        networkId: network,
        tokenBalance: networkBalance.balance.toString(),
        tokenBalanceUSD: `${formatAmount(networkBalance.usdValue)} USD`,
        tokenId: tokenSymbol,
        tokenName: tokenData.symbol,
        tokenSymbol: tokenData.symbol,
      },
    });
  };

  if (!activeWalletId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header isLoading={isLoading} title="Token Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Wallet not found</Text>
        </View>
      </View>
    );
  }

  if (!tokenData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header isLoading={isLoading} title="Token Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{isLoading ? 'Loading...' : 'Token not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title={`${tokenData.name} Details`} />
      <TokenDetails tokenData={tokenData} onSendPress={handleSendToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
  },
});
