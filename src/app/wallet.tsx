import { BalanceLoader } from '@/components/BalanceLoader';
import { useAggregatedBalances } from '@/hooks/use-aggregated-balances';
import { useWallet, useWdkApp } from '@tetherto/wdk-react-native-core';
import { Balance } from '@tetherto/wdk-uikit-react-native';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Palette,
  QrCode,
  Settings,
  Shield,
  Star,
  Wallet,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenUiConfigs } from '@/config/token';
import formatAmount from '@/utils/format-amount';
import formatTokenAmount from '@/utils/format-token-amount';
import { colors } from '@/constants/colors';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();

  const { activeWalletId } = useWdkApp();
  const { assets, totalBalanceUSD, isLoading, refetch } = useAggregatedBalances();

  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const aggregatedBalances = useMemo(() => {
    return assets.map((asset) => {
      const config = tokenUiConfigs[asset.symbol] || {
        color: colors.primary,
        icon: null,
      };

      return {
        denomination: asset.symbol,
        balance: asset.totalBalance,
        usdValue: 0, // Placeholder until pricing is hooked up
        config: {
          name: asset.name,
          ...config,
        },
      };
    });
  }, [assets]);

  const borderOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const suggestions = [
    {
      id: 1,
      icon: Star,
      title: 'Star repo on GitHub',
      color: colors.primary,
      url: 'https://github.com/tetherto/wdk-starter-react-native',
    },
    {
      id: 2,
      icon: Shield,
      title: 'Explore the WDK docs',
      color: colors.primary,
      url: 'https://docs.wallet.tether.io/',
    },
    {
      id: 3,
      icon: Palette,
      title: 'Explore the WDK UI Kit',
      color: colors.primary,
      url: 'https://github.com/tetherto/wdk-uikit-react-native',
    },
  ];

  // Handlers
  const handleSendPress = () => router.push('/send/select-token');
  const handleReceivePress = () => router.push('/receive/select-token');
  const handleQRPress = () => router.push('/scan-qr');
  const handleSeeAllTokens = () => router.push('/assets');
  const handleSeeAllActivity = () => router.push('/activity');
  const handleSettingsPress = () => router.push('/settings');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            borderBottomColor: borderOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(30, 30, 30, 0)', 'rgba(30, 30, 30, 1)'],
            }),
          },
        ]}
      >
        <View style={styles.walletInfo}>
          <View style={styles.walletIcon}>
            <Wallet size={16} color={colors.background} />
          </View>
          <Text style={styles.walletName}>{activeWalletId || 'My Wallet'}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Settings size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        refreshControl={
          mounted ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              title="Pull to refresh"
              titleColor={colors.textSecondary}
              progressViewOffset={insets.top}
            />
          ) : undefined
        }
      >
        <View
          style={{
            margin: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Balance
            value={totalBalanceUSD}
            currency="USD"
            isLoading={isLoading}
            Loader={BalanceLoader}
          />
          {isLoading ? (
            <View style={{ top: 16, marginRight: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
        </View>

        <View style={styles.portfolioSection}>
          {aggregatedBalances.length > 0 ? (
            aggregatedBalances.map((asset) => (
              <TouchableOpacity
                key={asset.denomination}
                style={styles.assetRow}
                onPress={() => {
                  router.push({
                    pathname: '/token-details',
                    params: { token: asset.denomination },
                  });
                }}
              >
                <View style={styles.assetInfo}>
                  <View style={[styles.assetIcon, { backgroundColor: asset.config?.color }]}>
                    {asset.config?.icon ? (
                      <Image source={asset.config.icon} style={styles.assetIconImage} />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>
                        {asset.denomination[0]}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.assetName}>{asset.config?.name || asset.denomination}</Text>
                  </View>
                </View>
                <View style={styles.assetBalance}>
                  <Text style={styles.assetAmount}>
                    {formatTokenAmount(asset.balance, asset.denomination as any)}
                  </Text>
                  <Text style={styles.assetValue}>{formatAmount(asset.usdValue)} USD</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noAssetsContainer}>
              <Text style={styles.noAssetsText}>No assets found</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleSeeAllTokens}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
          </View>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                onPress={() => Linking.openURL(suggestion.url)}
                key={suggestion.id}
                style={styles.suggestionCard}
              >
                <suggestion.icon size={24} color={suggestion.color} />
                <Text style={styles.suggestionText}>{suggestion.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.activitySection}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={styles.sectionTitle}>Activity</Text>
          </View>
          {/* todo */}
          {/*transactions.map(tx => (
            <View key={tx.id} style={styles.transactionRow}>
              <View style={styles.transactionIcon}>
                <tx.icon size={16} color={tx.iconColor} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>{tx.asset}</Text>
                <Text style={styles.transactionSubtitle}>
                  {tx.type === 'sent' ? 'Sent' : 'Received'} • {tx.blockchain}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.transactionAssetAmount}>{tx.amount}</Text>
                <Text style={styles.transactionUsdAmount}>{formatUSDValue(tx.fiatAmount)}</Text>
              </View>
            </View>
          ))*/}
          <View style={styles.noAssetsContainer}>
            <Text style={styles.noAssetsText}>No transactions yet</Text>
          </View>
          <TouchableOpacity onPress={handleSeeAllActivity}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { marginBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
          <ArrowUpRight size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qrButton} onPress={handleQRPress}>
          <QrCode size={24} color={colors.black} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleReceivePress}>
          <ArrowDownLeft size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120, flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  walletInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  walletIconText: { fontSize: 12 },
  walletName: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  settingsButton: { padding: 8 },
  portfolioSection: { paddingHorizontal: 20, marginBottom: 32 },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
    marginBottom: 16,
  },
  assetInfo: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetIconImage: { width: 24, height: 24 },
  assetName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  assetBalance: { alignItems: 'flex-end' },
  noAssetsContainer: { alignItems: 'center', paddingVertical: 40 },
  noAssetsText: { fontSize: 16, color: colors.textSecondary },
  assetAmount: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  assetValue: { fontSize: 14, color: colors.textSecondary },
  seeAllText: { fontSize: 16, color: colors.primary, textAlign: 'center' },
  suggestionsSection: { paddingHorizontal: 20, marginBottom: 32 },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  suggestionsGrid: { flexDirection: 'row', marginHorizontal: -6 },
  suggestionCard: {
    flex: 1,
    backgroundColor: colors.card,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  activitySection: { paddingHorizontal: 20, marginBottom: 32 },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: { flex: 1 },
  transactionType: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 2 },
  transactionSubtitle: { fontSize: 14, color: colors.textSecondary },
  transactionAmount: { alignItems: 'flex-end' },
  transactionAssetAmount: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  transactionUsdAmount: { fontSize: 14, color: colors.textSecondary },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 72,
    right: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 48,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    height: 80,
  },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  actionButtonText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});
