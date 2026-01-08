import Header from '@/components/header';
import { chainUiConfigs } from '@/config/chain';
import tokenConfigs from '@/config/token';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

import { useWallet, useWdkApp } from '@tetherto/wdk-react-native-core';

interface NetworkOption {
  id: string;
  name: string;
  color: string;
  icon: any;
  address?: string;
  hasAddress: boolean;
  description?: string;
}

export default function ReceiveSelectNetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { activeWalletId } = useWdkApp();
  const { addresses } = useWallet({ walletId: activeWalletId || undefined });

  const { tokenId, tokenSymbol, tokenName } = params as {
    tokenId: string;
    tokenSymbol: string;
    tokenName: string;
  };

  const networks: NetworkOption[] = useMemo(() => {
    // Find all networks that support this token
    const supportedNetworks = Object.keys(tokenConfigs).filter((networkKey) => {
      const netConfig = tokenConfigs[networkKey];
      if (!netConfig) return false;

      // Check native token
      if (netConfig.native.symbol === tokenId) return true;

      // Check token list
      return netConfig.tokens.some((t) => t.symbol === tokenId);
    });

    return supportedNetworks.map((networkKey) => {
      // Cast to keyof typeof chainUiConfigs to avoid potential type issues if keys don't perfectly match
      const uiConfig = chainUiConfigs[networkKey as keyof typeof chainUiConfigs] || {
        name: networkKey,
        icon: null,
        color: colors.textSecondary,
        description: '',
      };

      // Get address for Account 0
      const accountAddresses = addresses[networkKey];
      const address = accountAddresses ? accountAddresses[0] : undefined;

      return {
        id: networkKey,
        name: uiConfig.name,
        color: uiConfig.color,
        icon: uiConfig.icon,
        address,
        hasAddress: Boolean(address),
        description: uiConfig.description || uiConfig.name,
      };
    });
  }, [tokenId, addresses]);

  const handleSelectNetwork = useCallback(
    (network: NetworkOption) => {
      if (!network.hasAddress || !network.address) return;

      router.push({
        pathname: '/receive/details',
        params: {
          tokenId,
          tokenSymbol,
          tokenName,
          networkId: network.id,
          networkName: network.name,
          address: network.address,
        },
      });
    },
    [router, tokenId, tokenSymbol, tokenName]
  );

  const renderNetwork = ({ item }: { item: NetworkOption }) => {
    const isDisabled = !item.hasAddress;

    return (
      <TouchableOpacity
        style={[styles.networkRow, isDisabled && styles.networkRowDisabled]}
        onPress={() => handleSelectNetwork(item)}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <View style={styles.networkInfo}>
          <View
            style={[
              styles.networkIcon,
              { backgroundColor: item.color },
              isDisabled && styles.networkIconDisabled,
            ]}
          >
            {typeof item.icon === 'string' || !item.icon ? (
              <Text style={[styles.networkIconText, isDisabled && styles.networkIconTextDisabled]}>
                {item.name[0]}
              </Text>
            ) : (
              <Image
                source={item.icon}
                style={[styles.networkIconImage, isDisabled && styles.networkIconImageDisabled]}
              />
            )}
          </View>
          <View style={styles.networkDetails}>
            <Text style={[styles.networkName, isDisabled && styles.networkNameDisabled]}>
              {item.name}
            </Text>
            {item.description && (
              <Text
                style={[styles.networkDescription, isDisabled && styles.networkDescriptionDisabled]}
              >
                {item.description}
              </Text>
            )}
            {isDisabled && <Text style={styles.noAddressLabel}>Address not available</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Select network" style={styles.header} />
      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          Select the network you will be using to receive {tokenName}
        </Text>
      </View>
      <FlatList
        data={networks}
        renderItem={renderNetwork}
        keyExtractor={(item) => item.id}
        style={styles.networksList}
        contentContainerStyle={styles.networksContent}
        showsVerticalScrollIndicator={false}
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
  description: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  networksList: {
    flex: 1,
  },
  networksContent: {
    paddingBottom: 20,
  },
  networkRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  networkRowDisabled: {
    opacity: 0.5,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  networkIconDisabled: {
    backgroundColor: colors.border,
  },
  networkIconText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  networkIconTextDisabled: {
    opacity: 0.6,
  },
  networkIconImage: {
    width: 24,
    height: 24,
  },
  networkIconImageDisabled: {
    opacity: 0.6,
  },
  networkDetails: {
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  networkNameDisabled: {
    color: colors.textTertiary,
  },
  networkDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  networkDescriptionDisabled: {
    color: colors.textDisabled,
  },
  noAddressLabel: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
});
