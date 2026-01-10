import { useWdkApp } from '@tetherto/wdk-react-native-core';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';

export default function Index() {
  const { workletState, walletState, activeWalletId, walletExists, isReady } = useWdkApp();

  const isLoading =
    workletState.isLoading || walletState.status === 'checking' || walletState.status === 'loading';

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (activeWalletId) {
    return <Redirect href="/wallet" />;
  }

  if (walletExists) {
    return <Redirect href="/authorize" />;
  }

  return <Redirect href="/onboarding" />;
}
