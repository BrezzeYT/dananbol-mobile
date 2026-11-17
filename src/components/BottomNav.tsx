import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { hapticLight } from '../services/haptics';
import {
  CartIcon,
  CompassIcon,
  HomeIcon,
  MessageSquareIcon,
  UserIcon,
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
  blurTarget?: React.RefObject<View | null>;
  onHome: () => void;
  onCart: () => void;
  onProfile: () => void;
  onContacts: () => void;
  onSupport: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activePage,
  cartCount = 0,
  blurTarget,
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
    { id: 'home' as BottomNavPage, icon: HomeIcon, onPress: onHome },
    { id: 'cart' as BottomNavPage, icon: CartIcon, onPress: onCart, hasBadge: true },
    { id: 'profile' as BottomNavPage, icon: UserIcon, onPress: onProfile },
    { id: 'contacts' as BottomNavPage, icon: CompassIcon, onPress: onContacts },
    { id: 'support' as BottomNavPage, icon: MessageSquareIcon, onPress: onSupport },
  ];

  const activeIndex = items.findIndex((item) => item.id === activePage);
  const tabWidth = navWidth > 14 ? (navWidth - 14) / items.length : 0;
  const indicatorWidth = Math.max(44, tabWidth - 8);

  React.useEffect(() => {
    if (!navWidth || activeIndex < 0) return;
    const targetX = tabWidth * activeIndex + (tabWidth - indicatorWidth) / 2;
    if (!hasPositionedIndicator.current) {
      indicatorX.setValue(targetX);
      hasPositionedIndicator.current = true;
      return;
    }
    const animation = Animated.spring(indicatorX, {
      toValue: targetX,
      stiffness: 300,
      damping: 32,
      mass: 0.8,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, indicatorWidth, indicatorX, navWidth, tabWidth]);

  const navContent = (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          {
            left: 7,
            width: indicatorWidth,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />
      {items.map((item) => {
        const isActive = activePage === item.id;
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => {
              hapticLight();
              item.onPress();
            }}
            activeOpacity={1}
          >
            <View style={styles.iconWrap}>
              <IconComponent
                size={25}
                color={isActive ? '#f28c28' : '#64748b'}
                strokeWidth={2.1}
              />
              {item.hasBadge && cartCount > 0 && (
                <View
                  style={[
                    styles.badge,
                    { width: cartCount > 99 ? 26 : cartCount > 9 ? 22 : 18 },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <View
      style={[styles.navWrapper, { bottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.navShadow}>
        {Platform.OS === 'android' ? (
          <View
            style={styles.androidBar}
            onLayout={(event) => setNavWidth(event.nativeEvent.layout.width)}
          >
            <BlurView
              pointerEvents="none"
              blurTarget={blurTarget}
              blurMethod="dimezisBlurViewSdk31Plus"
              blurReductionFactor={2}
              intensity={64}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            {navContent}
          </View>
        ) : (
          <GlassView
            glassEffectStyle="regular"
            tintColor={Platform.OS === 'ios' ? '#ebf4fc' : undefined}
            style={styles.otherBar}
            onLayout={(event) => setNavWidth(event.nativeEvent.layout.width)}
          >
            {navContent}
          </GlassView>
        )}
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
  navShadow: {
    width: '100%',
    maxWidth: 430,
    height: 52,
    borderRadius: 26,
    shadowColor: '#8ec0ed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  androidBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  otherBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(235, 244, 252, 0.84)',
  },
  navItem: {
    flex: 1,
    flexBasis: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 28,
    height: 28,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    top: 6,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 140, 40, 0.14)',
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
