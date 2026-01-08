import { Network, NetworkSelector } from '@/components/NetworkSelector';
import { chainUiConfigs } from '@/config/chain';
import formatAmount from '@/utils/format-amount';
import { useAggregatedBalances } from '@/hooks/use-aggregated-balances';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';
import { colors } from '@/constants/colors';

export default function SelectNetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { assets } = useAggregatedBalances();

  const { tokenId, tokenSymbol, tokenName, scannedAddress } = params as {
    tokenId: string;
    tokenSymbol: string;
    tokenName: string;
    scannedAddress?: string;
  };

  const [networks, setNetworks] = useState<Network[]>([]);

  useEffect(() => {
    const calculateNetworks = async () => {
      const assetData = assets.find((a) => a.symbol === tokenId);

      if (!assetData) {
        setNetworks([]);
        return;
      }

      const networksWithBalances = assetData.networkBalances.map((nb) => {
        const networkKey = nb.network;
        // Use loose typing or cast if chainUiConfigs is strictly typed to Network enum
        const uiConfig = chainUiConfigs[networkKey] || {
          name: networkKey,
          icon: null,
          color: colors.textSecondary,
        };

        return {
          id: networkKey,
          name: uiConfig.name,
          gasLevel: 'Normal', // Placeholder
          gasColor: colors.success, // Placeholder
          icon: uiConfig.icon,
          color: uiConfig.color,
          balance: formatTokenAmount(nb.balance, assetData.symbol),
          balanceFiat: formatAmount(0), // Placeholder
          fiatCurrency: 'USD',
          token: assetData.symbol,
        } as Network;
      });

      setNetworks(networksWithBalances);
    };

    calculateNetworks();
  }, [tokenId, assets]);

  const handleSelectNetwork = useCallback(
    (network: Network) => {
      router.push({
        pathname: '/send/details',
        params: {
          tokenId,
          tokenSymbol,
          tokenName,
          tokenBalance: network.balance,
          tokenBalanceUSD: network.balanceFiat,
          networkName: network.name,
          networkId: network.id,
          ...(scannedAddress && { scannedAddress }),
        },
      });
    },
    [router, tokenId, tokenSymbol, tokenName, scannedAddress]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Select network" style={styles.header} />

      <Text style={styles.description}>
        Select the network you will be using to send {tokenSymbol || tokenName}
      </Text>

      <NetworkSelector networks={networks} onSelectNetwork={handleSelectNetwork} />
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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});
