import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../services/haptics';
import {
  HomeIcon,
  CartIcon,
  UserIcon,
  CompassIcon,
  MessageSquareIcon,
} from './icons';

export type BottomNavPage =
  | 'home'
  | 'cart'
  | 'profile'
  | 'contacts'
  | 'support';

interface BottomNavProps {
  activePage: BottomNavPage;
  cartCount?: number;
  onHome: () => void;
  onCart: () => void;
  onProfile: () => void;
  onContacts: () => void;
  onSupport: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activePage,
  cartCount = 0,
  onHome,
  onCart,
  onProfile,
  onContacts,
  onSupport,
}) => {
  const insets = useSafeAreaInsets();

  const items = [
    {
      id: 'home' as BottomNavPage,
      label: 'Главная',
      icon: HomeIcon,
      onPress: onHome,
    },
    {
      id: 'cart' as BottomNavPage,
      label: 'Корзина',
      icon: CartIcon,
      onPress: onCart,
      hasBadge: true,
    },
    {
      id: 'profile' as BottomNavPage,
      label: 'Профиль',
      icon: UserIcon,
      onPress: onProfile,
    },
    {
      id: 'contacts' as BottomNavPage,
      label: 'Контакты',
      icon: CompassIcon,
      onPress: onContacts,
    },
    {
      id: 'support' as BottomNavPage,
      label: 'Поддержка',
      icon: MessageSquareIcon,
      onPress: onSupport,
    },
  ];

  return (
    <View
      style={[
        styles.navWrapper,
        { bottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.navBar}>
        {items.map((item) => {
          const isActive = activePage === item.id;
          const IconComponent = item.icon;
          const iconColor = isActive ? '#1b75d0' : '#64748b';

          const handlePress = () => {
            hapticLight();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            item.onPress();
          };

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && [
                  styles.navItemActive,
                  item.id === 'support' && styles.navItemActiveSupport,
                ],
              ]}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <IconComponent
                  size={21}
                  color={iconColor}
                  strokeWidth={isActive ? 2.4 : 2.1}
                />
                {item.hasBadge && cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>

              {isActive && (
                <Text
                  style={styles.navLabel}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 100,
  },
  navBar: {
    width: '100%',
    maxWidth: 430,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: '#ebf4fc',
    borderWidth: 1.2,
    borderColor: 'rgba(142, 192, 237, 0.55)',
    borderRadius: 24,
    shadowColor: '#8ec0ed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  navItem: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  navItemActive: {
    flex: 1.9,
    backgroundColor: 'rgba(27, 117, 208, 0.09)',
    paddingHorizontal: 8,
    gap: 6,
  },
  navItemActiveSupport: {
    flex: 2.15,
  },
  iconWrap: {
    width: 22,
    height: 22,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ebf4fc',
  },
  badgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    color: '#ffffff',
    lineHeight: 12,
  },
  navLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: '#1b75d0',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
});
