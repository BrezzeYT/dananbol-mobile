import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WalletIcon, ExternalLinkIcon } from './icons';
import { useAuthContext } from '../context/useAuthContext';

interface TopupModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];

export const TopupModal: React.FC<TopupModalProps> = ({ visible, onClose }) => {
  const { customer } = useAuthContext();
  const [customAmount, setCustomAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          stiffness: 320,
          damping: 24,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.92,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 15,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        setCustomAmount('');
      });
    }
  }, [visible, overlayOpacity, cardScale, cardTranslateY]);

  if (!modalVisible) return null;

  const activeAmount = parseInt(customAmount.replace(/\D/g, ''), 10) || 0;

  const getLinkForAmount = (amountVal: number) => {
    const email = customer?.email || '';
    const msg = email
      ? `Здравствуйте, хочу пополнить баланс:\n${email}\n${amountVal}`
      : `Здравствуйте, хочу пополнить баланс:\n${amountVal}`;
    return `https://telegram.me/danabol_pay?text=${encodeURIComponent(msg)}`;
  };

  const currentLink =
    activeAmount > 0
      ? getLinkForAmount(activeAmount)
      : customer?.email
        ? `https://telegram.me/danabol_pay?text=${encodeURIComponent(
          `Здравствуйте, хочу пополнить баланс:\n${customer.email}`
        )}`
        : 'https://telegram.me/danabol_pay';

  const handleTopupPress = () => {
    Linking.openURL(currentLink).catch(() => { });
    onClose();
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    transform: [
                      { scale: cardScale },
                      { translateY: cardTranslateY },
                    ],
                  },
                ]}
              >

                <View style={styles.iconCircle}>
                  <WalletIcon size={32} color="#8ec0ed" strokeWidth={2} />
                </View>

                <Text style={styles.title}>Пополнение баланса</Text>
                <Text style={styles.desc}>
                  Укажите сумму для автогенерации сообщения боту оплаты Telegram.
                </Text>

                <View style={styles.quickGrid}>
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = customAmount === amt.toString();
                    return (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.quickBtn,
                          isSelected && styles.quickBtnActive,
                        ]}
                        onPress={() => setCustomAmount(amt.toString())}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quickBtnText,
                            isSelected && styles.quickBtnTextActive,
                          ]}
                        >
                          {amt.toLocaleString('ru-RU')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Своя сумма (руб.)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    value={
                      customAmount
                        ? Number(customAmount).toLocaleString('ru-RU')
                        : ''
                    }
                    onChangeText={(text) => {
                      const clean = text.replace(/\D/g, '');
                      setCustomAmount(clean);
                    }}
                  />
                  {activeAmount > 0 && (
                    <Text style={styles.currencySuffix}>₽</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeBtnText}>Закрыть</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.topupBtn}
                    onPress={handleTopupPress}
                    activeOpacity={0.8}
                  >
                    <ExternalLinkIcon size={16} color="#ffffff" strokeWidth={2.2} />
                    <Text style={styles.topupBtnText}>Пополнить</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(142, 192, 237, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    minWidth: '22%',
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnActive: {
    backgroundColor: '#e9f3fc',
    borderColor: '#8ec0ed',
  },
  quickBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  quickBtnTextActive: {
    color: '#6a96c3',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingRight: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#1e293b',
  },
  currencySuffix: {
    position: 'absolute',
    right: 14,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#8ec0ed',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  closeBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#64748b',
  },
  topupBtn: {
    flex: 1.2,
    height: 46,
    backgroundColor: '#8ec0ed',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  topupBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
});

