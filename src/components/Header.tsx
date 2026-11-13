import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { WalletIcon, BellIcon, UserIcon } from './icons';
import { styles } from '../styles/Header.styles';
import { LOGO_URL } from '../config/constants';

interface HeaderProps {
  balance?: number;
  isLoggedIn?: boolean;
  unreadCount?: number;
  isBellActive?: boolean;
  onBalancePress?: () => void;
  onBellPress?: () => void;
  onProfilePress?: () => void;
  onLogoPress?: () => void;
}

function formatBalance(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export const Header: React.FC<HeaderProps> = ({
  balance = 0,
  isLoggedIn = false,
  unreadCount = 0,
  isBellActive = false,
  onBalancePress,
  onBellPress,
  onProfilePress,
  onLogoPress,
}) => {
  const bellActive = isBellActive || unreadCount > 0;
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.logoContainer}
        onPress={onLogoPress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logoImage}
          contentFit="contain"
          transition={150}
        />
      </TouchableOpacity>

      <View style={styles.actionsRight}>
        {isLoggedIn && (
          <>
            <TouchableOpacity
              style={styles.balanceBadge}
              onPress={onBalancePress}
              activeOpacity={0.7}
            >
              <WalletIcon size={14} color="#ec9f19" strokeWidth={2.5} />
              <Text style={styles.balanceText}>{formatBalance(balance)}</Text>
              <View style={styles.orangeDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bellButton,
                bellActive && styles.bellButtonActive,
              ]}
              onPress={onBellPress}
              activeOpacity={0.7}
            >
              <BellIcon
                size={18}
                color={bellActive ? '#8ec0ed' : '#475569'}
                strokeWidth={2.25}
              />
              {unreadCount > 0 && <View style={styles.bellBadgeDot} />}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.profileButton,
            isLoggedIn ? styles.profileButtonActive : styles.profileButtonInactive,
          ]}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <UserIcon
            size={18}
            color={isLoggedIn ? '#8ec0ed' : '#475569'}
            strokeWidth={2.25}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
