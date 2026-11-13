import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BackendNotification } from '../api/notifications';
import { BellIcon, CheckIcon, CloseIcon } from './icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface NotificationsSheetProps {
  visible: boolean;
  notifications: BackendNotification[];
  onClose: () => void;
  onClear: () => void;
  onOrderClick?: (orderId: string) => void;
}

function formatNotificationTime(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(' ');
  if (parts.length < 2) return dateStr;
  const timeParts = parts[1].split(':');
  if (timeParts.length < 2) return parts[1];
  return `${timeParts[0]}:${timeParts[1]}`;
}

export const NotificationsSheet: React.FC<NotificationsSheetProps> = ({
  visible,
  notifications,
  onClose,
  onClear,
  onOrderClick,
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          stiffness: 380,
          damping: 32,
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
        setModalVisible(false);
        overlayOpacity.setValue(0);
        sheetTranslateY.setValue(SCREEN_HEIGHT);
      });
    }
  }, [visible]);

  const renderMessageWithOrderLink = (message: string) => {
    const regex = /#\s*(\d+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(message)) !== null) {
      const matchIndex = match.index;
      const fullMatch = match[0];
      const orderId = match[1];

      if (matchIndex > lastIndex) {
        parts.push(message.substring(lastIndex, matchIndex));
      }

      parts.push(
        <Text
          key={`order_${matchIndex}`}
          style={styles.orderLink}
          onPress={() => {
            onClose();
            onOrderClick?.(orderId);
          }}
        >
          {fullMatch}
        </Text>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < message.length) {
      parts.push(message.substring(lastIndex));
    }

    return parts.length > 0 ? parts : message;
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  maxHeight: SCREEN_HEIGHT * 0.8,
                  paddingBottom: Math.max(insets.bottom, 16) + 8,
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={styles.headerTitle}>Оповещения</Text>
                <View style={styles.headerActions}>
                  {notifications.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={onClear}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearBtnText}>Очистить</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <CloseIcon size={18} color="#475569" strokeWidth={2.25} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.content}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrapper}>
                      <BellIcon size={34} color="#94a3b8" strokeWidth={1.75} />
                    </View>
                    <Text style={styles.emptyText}>
                      У вас пока нет новых оповещений
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.scrollList}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {notifications.map((item) => {
                      const isSuccess = item.type === 'success';
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.itemCard,
                            isSuccess
                              ? styles.itemCardSuccess
                              : styles.itemCardInfo,
                          ]}
                        >
                          <View
                            style={[
                              styles.iconWrapper,
                              isSuccess
                                ? styles.iconWrapperSuccess
                                : styles.iconWrapperInfo,
                            ]}
                          >
                            {isSuccess ? (
                              <CheckIcon
                                size={14}
                                color="#22c55e"
                                strokeWidth={2.75}
                              />
                            ) : (
                              <BellIcon
                                size={14}
                                color="#3b82f6"
                                strokeWidth={2.25}
                              />
                            )}
                          </View>
                          <View style={styles.itemBody}>
                            <Text style={styles.itemText}>
                              {renderMessageWithOrderLink(item.message)}
                            </Text>
                            <Text style={styles.itemTime}>
                              {formatNotificationTime(item.date_added)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#edf2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxHeight: 450,
  },
  emptyContainer: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    opacity: 0.5,
    marginBottom: 14,
  },
  emptyText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemCardSuccess: {
    backgroundColor: 'rgba(240, 253, 244, 0.75)',
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  itemCardInfo: {
    backgroundColor: 'rgba(240, 249, 255, 0.75)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  iconWrapperSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconWrapperInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 18,
  },
  itemTime: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#94a3b8',
  },
  orderLink: {
    fontFamily: 'Montserrat_700Bold',
    color: '#2481cc',
    textDecorationLine: 'underline',
  },
});

