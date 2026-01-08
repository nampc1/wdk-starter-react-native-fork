import { Transaction, TransactionList } from '@tetherto/wdk-uikit-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { default as tokenConfigs } from '@/config/token';
import formatTokenAmount from '@/utils/format-token-amount';
import formatUSDValue from '@/utils/format-usd-value';
import Header from '@/components/header';
import { colors } from '@/constants/colors';
import { useWallet, useWdkApp } from '@tetherto/wdk-react-native-core';

// Helper to find token name from tokenConfigs
function getTokenName(symbol: string): string {
  for (const network of Object.values(tokenConfigs)) {
    if (network.native.symbol === symbol) return network.native.name;
    const token = network.tokens.find((t) => t.symbol === symbol);
    if (token) return token.name;
  }
  return symbol;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { activeWalletId } = useWdkApp();
  const { addresses } = useWallet({ walletId: activeWalletId || undefined });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Mock loading state

  useEffect(() => {
    const calculateTransactions = async () => {
      setIsLoading(true);
      // Mock Pricing
      const prices: Record<string, number> = {
        BTC: 95000,
        USDT: 1,
        XAUT: 2450,
        ETH: 3500,
        USAT: 1,
      };

      // Mock Raw Transactions
      // In a real app, you'd fetch this from an API or the SDK
      const mockRawTransactions = [
        {
          transactionHash: '0x3a1b...2c4d',
          timestamp: Date.now() / 1000 - 300, // 5 mins ago
          from: addresses?.ethereum?.[0] || '0xSelf',
          to: '0xRecipientAddress',
          amount: '50',
          token: 'USDT',
          blockchain: 'Ethereum',
        },
        {
          transactionHash: '0x9e8f...7a6b',
          timestamp: Date.now() / 1000 - 86400, // 1 day ago
          from: '0xSenderAddress',
          to: addresses?.ethereum?.[0] || '0xSelf',
          amount: '0.005',
          token: 'BTC',
          blockchain: 'Bitcoin',
        },
        {
          transactionHash: '0x5d4c...3b2a',
          timestamp: Date.now() / 1000 - 172800, // 2 days ago
          from: addresses?.ethereum?.[0] || '0xSelf',
          to: '0xAnotherRecipient',
          amount: '1.5',
          token: 'XAUT',
          blockchain: 'Ethereum',
        },
      ];

      // Flatten wallet addresses for comparison
      const walletAddresses = addresses
        ? Object.values(addresses)
            .flatMap((accountMap) => Object.values(accountMap))
            .map((addr) => addr.toLowerCase())
        : [];

      const mapped = mockRawTransactions.map((tx, index) => {
        const fromAddress = tx.from?.toLowerCase();
        // Determine if sent based on if "from" address belongs to wallet
        // Fallback check for mock '0xSelf'
        const isSent = walletAddresses.includes(fromAddress) || tx.from === '0xSelf';

        const amount = parseFloat(tx.amount);
        const price = prices[tx.token] || 0;
        const fiatValue = amount * price;

        const name = getTokenName(tx.token);

        return {
          id: `${tx.transactionHash}-${index}`,
          type: isSent ? ('sent' as const) : ('received' as const),
          token: name,
          amount: formatTokenAmount(amount, tx.token as any),
          fiatAmount: formatUSDValue(fiatValue, false),
          fiatCurrency: 'USD',
          network: tx.blockchain,
          timestamp: tx.timestamp,
          status: 'confirmed',
        } as Transaction;
      });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setTransactions(mapped);
      setIsLoading(false);
    };

    calculateTransactions();
  }, [addresses]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Activity" />
      <TransactionList transactions={transactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
