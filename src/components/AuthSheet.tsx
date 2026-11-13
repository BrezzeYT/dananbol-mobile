import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/useAuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthTab = 'login' | 'register';

export const AuthSheet: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isAuthOpen, closeAuth, login, register, authError } = useAuthContext();

  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const closeAuthRef = useRef(closeAuth);
  useEffect(() => { closeAuthRef.current = closeAuth; }, [closeAuth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          closeAuthRef.current();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
      },
    })
  ).current;

  const error = localError ?? authError;

  useEffect(() => {
    if (isAuthOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          stiffness: 350,
          damping: 30,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        dragY.setValue(0);
        setVisible(false);
        setTab('login');
        setPassword('');
        setConfirmPassword('');
        setLocalError(null);
        setIsSubmitting(false);
      });
    }
  }, [isAuthOpen, overlayOpacity, sheetTranslateY]);

  const handleTab = (next: AuthTab) => {
    setTab(next);
    setPassword('');
    setConfirmPassword('');
    setLocalError(null);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Заполните email и пароль');
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        closeAuth();
      }
    } catch {
      setLocalError('Ошибка сети. Попробуйте снова');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setLocalError('Заполните все поля');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const ok = await register({
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      if (ok) {
        closeAuth();
      }
    } catch {
      setLocalError('Ошибка сети. Попробуйте снова');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeAuth}
    >
      <View style={styles.modalRoot}>

        <TouchableWithoutFeedback onPress={closeAuth}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetAnimated,
            {
              transform: [
                { translateY: sheetTranslateY },
                { translateY: dragY },
              ],
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <View style={styles.handleWrap} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === 'login' && styles.tabActive]}
                onPress={() => handleTab('login')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                  Вход
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, tab === 'register' && styles.tabActive]}
                onPress={() => handleTab('register')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                  Регистрация
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите E-mail"
                  placeholderTextColor="#b0bec5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Пароль"
                  placeholderTextColor="#b0bec5"
                  secureTextEntry
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  textContentType={tab === 'login' ? 'password' : 'newPassword'}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isSubmitting}
                />
              </View>

              {tab === 'register' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Подтвердите пароль</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Повторите пароль"
                    placeholderTextColor="#b0bec5"
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isSubmitting}
                  />
                </View>
              )}

              <View style={styles.submitWrap}>
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  disabled={isSubmitting}
                  onPress={tab === 'login' ? handleLogin : handleRegister}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footerWrap}>
                {tab === 'login' ? (
                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Нет аккаунта? </Text>
                    <TouchableOpacity onPress={() => handleTab('register')} activeOpacity={0.7}>
                      <Text style={styles.footerLink}>Зарегистрироваться</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Уже есть аккаунт? </Text>
                    <TouchableOpacity onPress={() => handleTab('login')} activeOpacity={0.7}>
                      <Text style={styles.footerLink}>Войти</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  sheetAnimated: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  keyboardWrap: {
    width: '100%',
  },
  handleWrap: {
    paddingVertical: 10,
    paddingHorizontal: 60,
    alignItems: 'center',
    marginBottom: 4,
    marginTop: -4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#dde4ef',
    alignSelf: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: -0.1,
  },
  tabTextActive: {
    color: '#0f172a',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#b91c1c',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#4a6080',
    paddingLeft: 6,
    marginBottom: 7,
  },
  input: {
    height: 52,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  submitWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  submitBtn: {
    width: '75%',
    height: 52,
    borderRadius: 999,
    backgroundColor: '#8ec0ed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8ec0ed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 2,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 4,
    paddingBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#64748b',
  },
  footerLink: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#2d6fa8',
    textDecorationLine: 'underline',
  },
});
