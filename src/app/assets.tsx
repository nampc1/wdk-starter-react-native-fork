import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenUiConfigs } from '@/config/token';
import formatAmount from '@/utils/format-amount';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';
import { colors } from '@/constants/colors';
import { useAggregatedBalances } from '@/hooks/use-aggregated-balances';
import { useWdkApp } from '@tetherto/wdk-react-native-core';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  fiatValue: number;
  fiatCurrency: string;
  icon: any;
  color: string;
}

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { activeWalletId } = useWdkApp();
  const { assets: aggregatedAssets, isLoading } = useAggregatedBalances();
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const calculateAssets = async () => {
      // Mock pricing
      const prices: Record<string, number> = {
        BTC: 95000,
        USDT: 1,
        XAUT: 2450,
        ETH: 3500,
        USAT: 1,
      };

      const mappedAssets: Asset[] = aggregatedAssets.map((aggAsset) => {
        const uiConfig = tokenUiConfigs[aggAsset.symbol] || {
          icon: null,
          color: colors.primary,
        };

        const price = prices[aggAsset.symbol] || 0;
        const fiatValue = aggAsset.totalBalance * price;

        return {
          id: aggAsset.symbol,
          name: aggAsset.name,
          symbol: aggAsset.symbol,
          amount: formatTokenAmount(aggAsset.totalBalance, aggAsset.symbol),
          fiatValue: fiatValue,
          fiatCurrency: 'USD',
          icon: uiConfig.icon,
          color: uiConfig.color,
        };
      });

      // Sort by USD value descending
      const sortedAssets = mappedAssets.sort((a, b) => b.fiatValue - a.fiatValue);
      setAssets(sortedAssets);
    };

    calculateAssets();
  }, [aggregatedAssets]);

  const handleAssetPress = (asset: Asset) => {
    if (!activeWalletId) return;

    router.push({
      pathname: '/token-details',
      params: {
        walletId: activeWalletId,
        token: asset.id,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Your Assets" />

      {/* Assets List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {assets.length > 0 ? (
          assets.map((asset) => (
            <TouchableOpacity
              key={asset.id}
              style={styles.assetRow}
              onPress={() => handleAssetPress(asset)}
            >
              <View style={styles.assetInfo}>
                <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                  {typeof asset.icon === 'string' || !asset.icon ? (
                    <Text style={styles.assetIconText}>{asset.symbol[0]}</Text>
                  ) : (
                    <Image source={asset.icon} style={styles.assetIconImage} />
                  )}
                </View>
                <View style={styles.assetDetails}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                </View>
              </View>
              <View style={styles.assetBalance}>
                <Text style={styles.assetAmount}>{asset.amount}</Text>
                <Text style={styles.assetValue}>
                  {formatAmount(asset.fiatValue)} {asset.fiatCurrency}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAssetsContainer}>
            <Text style={styles.noAssetsText}>No assets found</Text>
            <Text style={styles.noAssetsSubtext}>
              Your wallet assets will appear here once you have a balance
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  assetIconText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
  },
  assetIconImage: {
    width: 32,
    height: 32,
  },
  assetDetails: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  assetChange: {
    fontSize: 14,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noAssetsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAssetsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  noAssetsSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
