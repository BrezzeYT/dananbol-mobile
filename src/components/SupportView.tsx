import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const HeadphonesIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#8ec0ed',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);

export const SupportView: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <HeadphonesIcon size={42} color="#8ec0ed" />
      </View>
      <Text style={styles.title}>Поддержка</Text>
      <Text style={styles.subtitle}>Раздел находится в разработке</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(142, 192, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 192, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
