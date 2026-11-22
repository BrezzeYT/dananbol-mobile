import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/useAuthContext';
import { fetchChatByUid, fetchUserChat, sendChatMessage, type SupportMessage } from '../api/support';
import { AlertCircleIcon, CheckIcon, MessageSquareIcon } from './icons';
import { supportStyles as s } from '../styles/SupportView.styles';

const SendIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2 11 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="m22 2-7 20-4-9-9-4 20-7Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function isSupportOnline(): boolean {
  const moscowHour = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCHours();
  return moscowHour >= 10 && moscowHour < 23;
}

function formatMessageDate(value?: string): string {
  if (!value) return '';
  const date = new Date(String(value).trim().replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} | ${hours}:${minutes}`;
}

function appendNewMessages(current: SupportMessage[], incoming: SupportMessage[]): SupportMessage[] {
  const knownIds = new Set(current.map((message) => message.id));
  const additions = incoming.filter((message) => {
    if (knownIds.has(message.id)) return false;
    knownIds.add(message.id);
    return true;
  });
  return additions.length ? [...current, ...additions] : current;
}

function isTruthy(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

interface SupportViewProps {
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  initialMessage = '',
  onInitialMessageConsumed,
}) => {
  const { customer, openAuth, isAuthLoading } = useAuthContext();
  const insets = useSafeAreaInsets();
  const customerId = customer?.customer_id ?? 0;
  const encryptToken = customer?.encrypt_customer_token || '';
  const encryptTokenRef = useRef(encryptToken);
  encryptTokenRef.current = encryptToken;
  const supportUserId = encryptToken || String(customerId);
  const [chatUid, setChatUid] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState(initialMessage);
  const [inputHeight, setInputHeight] = useState(36);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardSpacer = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<ScrollView>(null);
  const shouldScrollToBottomRef = useRef(true);
  const pendingScrollToBottomRef = useRef(false);
  const hasScrolledInitiallyRef = useRef(false);
  const scrollRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnline = isSupportOnline();
  const bottomNavClearance = Math.max(insets.bottom, 10) + 64;

  useEffect(() => () => {
    if (scrollRetryTimerRef.current) clearTimeout(scrollRetryTimerRef.current);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(keyboardSpacer, {
      toValue: keyboardVisible ? 16 : 0,
      duration: 220,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [keyboardVisible, keyboardSpacer]);

  useEffect(() => {
    if (!initialMessage) return;
    setInputText(initialMessage);
    onInitialMessageConsumed?.();
  }, [initialMessage, onInitialMessageConsumed]);

  useEffect(() => {
    if (scrollRetryTimerRef.current) {
      clearTimeout(scrollRetryTimerRef.current);
      scrollRetryTimerRef.current = null;
    }
    if (!customerId) {
      setMessages([]);
      setChatUid('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);
    setChatUid('');
    shouldScrollToBottomRef.current = true;
    pendingScrollToBottomRef.current = false;
    hasScrolledInitiallyRef.current = false;

    fetchUserChat(customerId, encryptTokenRef.current)
      .then((response) => {
        if (cancelled) return;
        if (response.ok && response.data) {
          setChatUid(response.data.chat_uid || '');
          pendingScrollToBottomRef.current = response.data.messages.length > 0;
          setMessages(response.data.messages || []);
        } else {
          setError(response.message || 'Не удалось загрузить чат поддержки');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Ошибка подключения к серверу поддержки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (!chatUid || !customerId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetchChatByUid(chatUid, true);
        if (cancelled || !response.ok || !response.data) return;
        const nextMessages = response.data.messages || [];
        setMessages((current) => {
          const mergedMessages = appendNewMessages(current, nextMessages);
          if (mergedMessages === current) return current;
          pendingScrollToBottomRef.current = shouldScrollToBottomRef.current;
          return mergedMessages;
        });
      } catch {}
    };

    const timer = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chatUid, customerId]);

  const handleContentSizeChange = useCallback(() => {
    if (!pendingScrollToBottomRef.current || !shouldScrollToBottomRef.current || !messages.length) return;
    if (!hasScrolledInitiallyRef.current) {
      if (scrollRetryTimerRef.current) clearTimeout(scrollRetryTimerRef.current);
      scrollRetryTimerRef.current = setTimeout(() => {
        if (pendingScrollToBottomRef.current && shouldScrollToBottomRef.current) {
          listRef.current?.scrollToEnd({ animated: true });
          hasScrolledInitiallyRef.current = true;
          pendingScrollToBottomRef.current = false;
        }
        scrollRetryTimerRef.current = null;
      }, 160);
      return;
    }
    requestAnimationFrame(() => {
      if (!pendingScrollToBottomRef.current || !shouldScrollToBottomRef.current) return;
      listRef.current?.scrollToEnd({ animated: hasScrolledInitiallyRef.current });
      hasScrolledInitiallyRef.current = true;
      pendingScrollToBottomRef.current = false;
    });
  }, [messages.length]);

  const handleSend = async () => {
    const message = inputText.trim();
    if (!message || !customerId || sending) return;

    setSending(true);
    setError(null);
    shouldScrollToBottomRef.current = true;
    pendingScrollToBottomRef.current = false;

    try {
      const currentChatUid = chatUid;
      const response = await sendChatMessage(currentChatUid, supportUserId, message);
      if (response.ok) {
        setInputText('');
        setInputHeight(36);
        if (response.data?.chat_uid) setChatUid(response.data.chat_uid);
        if (response.data?.messages) {
          setMessages((current) => {
            const mergedMessages = appendNewMessages(current, response.data?.messages || []);
            if (mergedMessages === current) return current;
            pendingScrollToBottomRef.current = true;
            return mergedMessages;
          });
        } else if (currentChatUid) {
          const refreshed = await fetchChatByUid(currentChatUid, true);
          if (refreshed.ok && refreshed.data) {
            setMessages((current) => {
              const mergedMessages = appendNewMessages(current, refreshed.data?.messages || []);
              if (mergedMessages === current) return current;
              pendingScrollToBottomRef.current = true;
              return mergedMessages;
            });
          }
        }
      } else {
        pendingScrollToBottomRef.current = false;
        setError(response.message || 'Не удалось отправить сообщение');
      }
    } catch {
      pendingScrollToBottomRef.current = false;
      setError('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  if (isAuthLoading) {
    return (
      <View style={s.centerState}>
        <ActivityIndicator color="#8ec0ed" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={s.authScreen}>
        <View style={s.authCard}>
          <View style={s.authIcon}>
            <MessageSquareIcon size={34} color="#8ec0ed" />
          </View>
          <Text style={s.authTitle}>Чат с поддержкой</Text>
          <Text style={s.authDescription}>
            Чтобы обратиться в службу поддержки и просмотреть ваши обращения, пожалуйста, войдите в аккаунт.
          </Text>
          <TouchableOpacity style={s.authButton} onPress={openAuth} activeOpacity={0.85}>
            <Text style={s.authButtonText}>Войти в аккаунт</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderMessage = (item: SupportMessage) => {
    const fromUser = item.from_user == null ? '' : String(item.from_user);
    const isUser = isTruthy(item.is_user) ||
      item.sender_type === 'user' ||
      item.sender_type === 'customer' ||
      fromUser === '1' ||
      fromUser === String(customerId) ||
      fromUser === encryptToken;
    const isRead = isTruthy(item.is_read);

    return (
      <View key={item.id} style={[s.messageBubble, isUser ? s.userBubble : s.operatorBubble]}>
        <Text style={s.messageText}>{item.message}</Text>
        <View style={s.messageMeta}>
          <Text style={s.messageDate}>{formatMessageDate(item.date_added || item.created)}</Text>
          {isUser ? <CheckIcon size={12} color={isRead ? '#10b981' : '#94a3b8'} /> : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={s.header}>
        <View style={s.headerTitleRow}>
          <Text style={s.title}>Служба поддержки</Text>
          <View style={[s.statusBadge, isOnline ? s.onlineBadge : s.offlineBadge]}>
            <View style={[s.statusDot, isOnline ? s.onlineDot : s.offlineDot]} />
            <Text style={[s.statusText, isOnline ? s.onlineText : s.offlineText]}>
              {isOnline ? 'Онлайн' : 'Офлайн'}
            </Text>
          </View>
        </View>
        <Text style={s.workTime}>Режим работы операторов: с 10:00 до 23:00 МСК</Text>
      </View>

      {error ? (
        <View style={s.errorBanner}>
          <AlertCircleIcon size={16} color="#ef4444" />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator color="#8ec0ed" />
          <Text style={s.loadingText}>Загрузка чата...</Text>
        </View>
      ) : (
        <ScrollView
          ref={listRef}
          style={s.history}
          contentContainerStyle={s.historyContent}
          onLayout={handleContentSizeChange}
          onContentSizeChange={handleContentSizeChange}
          onScrollBeginDrag={() => {
            if (!hasScrolledInitiallyRef.current && pendingScrollToBottomRef.current) {
              pendingScrollToBottomRef.current = false;
              if (scrollRetryTimerRef.current) clearTimeout(scrollRetryTimerRef.current);
              scrollRetryTimerRef.current = null;
            }
          }}
          onScroll={(event) => {
            if (!hasScrolledInitiallyRef.current && pendingScrollToBottomRef.current) return;
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isAtBottom =
              contentSize.height - contentOffset.y - layoutMeasurement.height < 24;
            shouldScrollToBottomRef.current = isAtBottom;
            if (!isAtBottom) pendingScrollToBottomRef.current = false;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <View style={s.emptyState}>
              <MessageSquareIcon size={36} color="#8ec0ed" />
              <Text style={s.emptyTitle}>Задайте вопрос оператору</Text>
              <Text style={s.emptyDescription}>
                Мы поможем с любым вопросом по заказу, доставке или консультации
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={s.composer}>
        <View style={s.inputShell}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            onContentSizeChange={(event) => {
              setInputHeight(Math.max(36, Math.min(108, event.nativeEvent.contentSize.height + 12)));
            }}
            style={[s.input, { height: inputHeight }]}
            placeholder="Задайте вопрос..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={4000}
            editable={!sending}
            textAlignVertical="center"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendButton, (!inputText.trim() || sending) && s.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
            accessibilityLabel="Отправить сообщение"
          >
            {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <SendIcon />}
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View
        style={{
          height: keyboardSpacer.interpolate({
            inputRange: [0, 16],
            outputRange: [bottomNavClearance, bottomNavClearance + 16],
          }),
          backgroundColor: '#ffffff',
        }}
      />
    </KeyboardAvoidingView>
  );
};
