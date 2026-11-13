import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
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
  const [navWidth, setNavWidth] = React.useState(0);
  const indicatorX = React.useRef(new Animated.Value(0)).current;
  const hasPositionedIndicator = React.useRef(false);

  const items = [
    {
      id: 'home' as BottomNavPage,
      icon: HomeIcon,
      onPress: onHome,
    },
    {
      id: 'cart' as BottomNavPage,
      icon: CartIcon,
      onPress: onCart,
      hasBadge: true,
    },
    {
      id: 'profile' as BottomNavPage,
      icon: UserIcon,
      onPress: onProfile,
    },
    {
      id: 'contacts' as BottomNavPage,
      icon: CompassIcon,
      onPress: onContacts,
    },
    {
      id: 'support' as BottomNavPage,
      icon: MessageSquareIcon,
      onPress: onSupport,
    },
  ];

  const activeIndex = items.findIndex((item) => item.id === activePage);
  const tabWidth = navWidth > 14.4 ? (navWidth - 14.4) / items.length : 0;
  const activeCenter = 7.2 + tabWidth * (activeIndex + 0.5);
  const edgeClearance = Math.min(activeCenter - 18, navWidth - 18 - activeCenter);
  const coneSpread = navWidth > 0
    ? Math.max(0, Math.min(23, edgeClearance - 12))
    : 0;

  React.useEffect(() => {
    if (!navWidth || activeIndex < 0) return;
    const targetX = tabWidth * activeIndex + (tabWidth - 24) / 2;
    if (!hasPositionedIndicator.current) {
      indicatorX.setValue(targetX);
      hasPositionedIndicator.current = true;
      return;
    }
    const animation = Animated.timing(indicatorX, {
      toValue: targetX,
      duration: 250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, indicatorX, navWidth, tabWidth]);

  return (
    <View
      style={[
        styles.navWrapper,
        { bottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none"
    >
      <GlassView
        glassEffectStyle="regular"
        tintColor={Platform.OS === 'ios' ? '#ebf4fc' : undefined}
        style={styles.navBar}
        onLayout={(event) => setNavWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeGlow,
            {
              left: 7.2 - coneSpread,
              borderLeftWidth: coneSpread,
              borderRightWidth: coneSpread,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.activeLight, { transform: [{ translateX: indicatorX }] }]}
        />
        {items.map((item) => {
          const isActive = activePage === item.id;
          const IconComponent = item.icon;
          const iconColor = isActive ? '#f28c28' : '#64748b';

          const handlePress = () => {
            hapticLight();
            item.onPress();
          };

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
              ]}
              onPress={handlePress}
              activeOpacity={1}
            >
              <View style={styles.iconWrap}>
                <IconComponent
                  size={25}
                  color={iconColor}
                  strokeWidth={2.1}
                />
                {item.hasBadge && cartCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { width: cartCount > 99 ? 26 : cartCount > 9 ? 22 : 18 },
                    ]}
                  >
                    <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                )}
              </View>

            </TouchableOpacity>
          );
        })}
      </GlassView>
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
    backgroundColor: Platform.select({
      ios: 'transparent',
      default: 'rgba(235, 244, 252, 0.3)',
    }),
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 24,
    shadowColor: '#8ec0ed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  navItem: {
    flex: 1,
    flexBasis: 0,
    height: 42,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrap: {
    width: 28,
    height: 28,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    position: 'absolute',
    top: -1,
    boxSizing: 'content-box',
    width: 24,
    height: 0,
    borderBottomWidth: 56,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(90, 168, 232, 0.07)',
  },
  activeLight: {
    position: 'absolute',
    top: -1,
    left: 7.2,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8ec0ed',
    shadowColor: '#5aa8e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 9,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    height: 18,
    paddingHorizontal: 0,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    color: '#ffffff',
    lineHeight: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
