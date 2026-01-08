import { CryptoAddressInput } from '@tetherto/wdk-uikit-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKeyboard } from '@/hooks/use-keyboard';
import { colors } from '@/constants/colors';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Header from '@/components/header';

import { useWdkApp, useRefreshBalance } from '@tetherto/wdk-react-native-core';

interface GasFeeEstimate {
  fee?: number;
  error?: string;
}

export default function SendDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();

  const { activeWalletId } = useWdkApp();
  const { mutate: refreshBalances } = useRefreshBalance();

  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const amountSectionYPosition = useRef<number>(0);
  const {
    tokenId,
    tokenSymbol,
    tokenName,
    tokenBalance,
    tokenBalanceUSD,
    networkName,
    networkId,
    scannedAddress,
  } = params as {
    tokenId: string;
    tokenSymbol: string;
    tokenName: string;
    tokenBalance: string;
    tokenBalanceUSD: string;
    networkName: string;
    networkId: string;
    scannedAddress?: string;
  };

  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [inputMode, setInputMode] = useState<'token' | 'fiat'>('token');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingGasEstimate, setIsLoadingGasEstimate] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasFeeEstimate>({
    fee: undefined,
    error: undefined,
  });
  const [amountError, setAmountError] = useState<string | null>(null);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [transactionResult, setTransactionResult] = useState<{
    txId?: { fee: string; hash: string };
    error?: string;
  } | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const keyboard = useKeyboard();

  useEffect(() => {
    if (scannedAddress) {
      setRecipientAddress(scannedAddress);
    }
  }, [scannedAddress]);

  useEffect(() => {
    if (keyboard.isVisible && isAmountInputFocused) {
      setTimeout(() => {
        const scrollTo = amountSectionYPosition.current - 40;
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollTo),
          animated: true,
        });
      }, 100);
    }
  }, [keyboard.isVisible, isAmountInputFocused]);

  useEffect(() => {
    // MOCK: Just set a hardcoded price for demo
    const calculateTokenPrice = async () => {
      // Could use a map here if we want realistic mocks
      const mockPrices: Record<string, number> = {
        BTC: 95000,
        USDT: 1,
        XAUT: 2450,
      };

      setTokenPrice(mockPrices[tokenSymbol] || 0);
    };
    calculateTokenPrice();
  }, [tokenSymbol]); // Use symbol instead of ID

  // Pre-calculate fee (MOCK)
  const handleCalculateGasFee = useCallback(async (showLoading = true, amountValue?: string) => {
    if (showLoading) {
      setIsLoadingGasEstimate(true);
      setGasEstimate((prev) => ({ ...prev, error: undefined }));
    }

    // MOCK DELAY & FEE
    setTimeout(() => {
      setGasEstimate({ fee: 0.0002 }); // Hardcoded mock fee
      setIsLoadingGasEstimate(false);
    }, 1000);
  }, []);

  useEffect(() => {
    handleCalculateGasFee();
  }, [handleCalculateGasFee]);

  const handleQRScan = useCallback(() => {
    router.push({
      pathname: '/scan-qr',
      params: {
        returnRoute: '/send/details',
        tokenId,
        tokenSymbol,
        tokenBalance,
        tokenBalanceUSD,
        networkName,
        networkId,
        scannedAddress,
      },
    });
  }, [
    router,
    tokenId,
    tokenSymbol,
    tokenBalance,
    tokenBalanceUSD,
    networkName,
    networkId,
    scannedAddress,
  ]);

  const handlePasteAddress = useCallback(() => {
    Clipboard.getStringAsync().then(setRecipientAddress);
  }, []);

  const handleUseMax = useCallback(() => {
    const numericBalance = parseFloat(tokenBalance.replace(/,/g, ''));

    if (inputMode === 'token') {
      let maxAmount = numericBalance;
      if (gasEstimate.fee !== undefined) {
        maxAmount = Math.max(0, numericBalance - gasEstimate.fee);
      }
      setAmount(maxAmount.toString());
    } else {
      // Simplistic USD max logic for demo
      const maxAmountUSD = numericBalance * tokenPrice;
      setAmount(maxAmountUSD.toFixed(2));
    }
    setAmountError(null);
  }, [inputMode, tokenBalance, gasEstimate.fee, tokenPrice]);

  const toggleInputMode = useCallback(() => {
    setInputMode((prev) => (prev === 'token' ? 'fiat' : 'token'));
    setAmount('');
    setAmountError(null);
  }, []);

  const validateAmount = useCallback(
    (value: string) => {
      if (!value || parseFloat(value) <= 0) {
        setAmountError(null);
        return;
      }
      const numericBalance = parseFloat(tokenBalance.replace(/,/g, ''));
      const numericAmount = parseFloat(value.replace(/,/g, ''));

      if (inputMode === 'token') {
        if (numericAmount > numericBalance) {
          setAmountError(`Maximum: ${numericBalance} ${tokenSymbol}`);
        } else {
          setAmountError(null);
        }
      }
    },
    [inputMode, tokenBalance, tokenSymbol]
  );

  const handleAmountChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9.,]/g, '');
      const normalized = sanitized.replace(',', '.');
      const parts = normalized.split('.');
      const formatted = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
      setAmount(formatted);
      validateAmount(formatted);
    },
    [validateAmount]
  );

  const handleAmountInputFocus = useCallback(() => setIsAmountInputFocused(true), []);
  const handleAmountInputBlur = useCallback(() => setIsAmountInputFocused(false), []);
  const handleAmountSectionLayout = useCallback((event: any) => {
    amountSectionYPosition.current = event.nativeEvent.layout.y;
  }, []);

  const handleSend = useCallback(async () => {
    if (!recipientAddress || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setSendingTransaction(true);
    setTransactionResult(null);

    // MOCK SEND TRANSACTION
    setTimeout(() => {
      setSendingTransaction(false);
      setTransactionResult({ txId: { hash: '0x123...mock', fee: '0.0002' } });
      setShowConfirmation(true);

      // Refresh balances
      refreshBalances({
        accountIndex: 0,
        type: 'all',
        walletId: activeWalletId || undefined,
      });
    }, 2000);
  }, [amount, recipientAddress, activeWalletId, refreshBalances]);

  const handleConfirmSend = useCallback(async () => {
    setShowConfirmation(false);
    router.replace('/wallet'); // Go back to dashboard
  }, [router]);

  const balanceDisplay = useMemo(() => {
    if (inputMode === 'token') {
      return `Balance: ${tokenBalance} ${tokenSymbol}`;
    }
    return `Balance: ${tokenBalanceUSD}`;
  }, [inputMode, tokenBalance, tokenBalanceUSD, tokenSymbol]);

  const isUseMaxDisabled = gasEstimate.fee === undefined;

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Header title={`Send ${tokenSymbol}`} style={styles.header} />

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.transactionRecap}>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Token:</Text>
                  <Text style={styles.recapValue}>
                    {tokenName}
                    <Text style={styles.recapValueSecondary}>({tokenSymbol})</Text>
                  </Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Network:</Text>
                  <Text style={styles.recapValue}>{networkName}</Text>
                </View>
              </View>

              <CryptoAddressInput
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                onPaste={handlePasteAddress}
                onQRScan={handleQRScan}
              />

              <View style={styles.section} onLayout={handleAmountSectionLayout}>
                <Text style={styles.sectionTitle}>Enter Amount</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder={inputMode === 'token' ? `0.00` : '$ 0.00'}
                    placeholderTextColor={colors.textTertiary}
                    value={amount}
                    onChangeText={handleAmountChange}
                    onFocus={handleAmountInputFocus}
                    onBlur={handleAmountInputBlur}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity style={styles.currencyToggle} onPress={toggleInputMode}>
                    <Text style={styles.currencyToggleText}>
                      {inputMode === 'token' ? tokenSymbol : 'USD'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceRow}>
                  <TouchableOpacity disabled={isUseMaxDisabled} onPress={handleUseMax}>
                    <Text
                      style={[
                        styles.useMaxText,
                        { color: isUseMaxDisabled ? colors.textTertiary : colors.primary },
                      ]}
                    >
                      Use Max
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.balanceText}>{balanceDisplay}</Text>
                </View>
                {amountError && <Text style={styles.amountError}>{amountError}</Text>}
              </View>

              <View style={styles.gasSection}>
                <View style={styles.gasTitleRow}>
                  <Text style={styles.gasTitle}>Estimated Fee:</Text>
                  <TouchableOpacity
                    onPress={() => handleCalculateGasFee()}
                    style={styles.refreshButton}
                  >
                    <RefreshCw size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {isLoadingGasEstimate ? (
                  <Text style={styles.gasAmount}>Calculating...</Text>
                ) : (
                  <Text style={styles.gasAmount}>
                    {gasEstimate.fee ? `${gasEstimate.fee} ${tokenSymbol}` : '0.00'}
                  </Text>
                )}
              </View>
            </ScrollView>

            <View
              style={[
                styles.bottomContainer,
                { paddingBottom: (keyboard.isVisible ? 0 : insets.bottom) + 16 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (amountError || !amount || !recipientAddress || sendingTransaction) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!!(amountError || !amount || !recipientAddress || sendingTransaction)}
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    (amountError || !amount || !recipientAddress || sendingTransaction) &&
                      styles.sendButtonTextDisabled,
                  ]}
                >
                  {sendingTransaction ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Submitted</Text>
            <Text style={styles.modalDescription}>
              Your transaction has been submitted and is now processing.
            </Text>

            <View style={styles.transactionSummary}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              {/*<Text style={styles.summaryValue}>{getTransactionAmout()}</Text>*/}
            </View>

            <View style={styles.transactionSummary}>
              <Text style={styles.summaryLabel}>To:</Text>
              <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="middle">
                {recipientAddress}
              </Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleConfirmSend}>
              <Text style={styles.modalButtonText}>Close & Return to Main Screen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 108 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '600', color: colors.text },
  currencyToggle: {
    backgroundColor: colors.cardDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currencyToggleText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  useMaxText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  balanceText: { color: colors.textSecondary, fontSize: 14 },
  gasSection: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginTop: 24 },
  gasTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gasTitle: { fontSize: 14, color: colors.textSecondary },
  refreshButton: { padding: 4 },
  refreshIconLoading: { opacity: 0.5 },
  gasAmount: { fontSize: 18, fontWeight: '600', color: colors.text },
  gasUsd: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  gasError: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  amountError: { fontSize: 12, color: colors.error, marginTop: 4 },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardDark,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  sendButtonDisabled: { backgroundColor: colors.border, opacity: 0.5 },
  sendButtonTextDisabled: { color: colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    marginTop: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  modalButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  transactionDetails: {
    backgroundColor: colors.cardDark,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  transactionLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  transactionId: { fontSize: 14, color: colors.primary, fontFamily: 'monospace' },
  transactionSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  transactionRecap: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardDark,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recapLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  recapValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  recapValueSecondary: { fontSize: 12, color: colors.textTertiary, fontWeight: '400' },
  recapDivider: { height: 1, backgroundColor: colors.cardDark, marginVertical: 4 },
});
