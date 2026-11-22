import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export const SplashScreen: React.FC = () => {
  const outerRing = useRef(new Animated.Value(0)).current;
  const middleRing = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const shinePosition = useRef(new Animated.Value(-90)).current;
  const topGlowMotion = useRef(new Animated.Value(0)).current;
  const bottomGlowMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringPulse = (progress: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: 2400,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 1,
            useNativeDriver: true,
          }),
        ])
      );

    const topGlowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(topGlowMotion, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(topGlowMotion, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const bottomGlowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bottomGlowMotion, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bottomGlowMotion, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const logoFloatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const shineAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(shinePosition, {
          toValue: 90,
          duration: 2100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shinePosition, {
          toValue: -90,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );

    const outerRingAnimation = ringPulse(outerRing, 0);
    const middleRingAnimation = ringPulse(middleRing, 500);
    outerRingAnimation.start();
    middleRingAnimation.start();
    topGlowAnimation.start();
    bottomGlowAnimation.start();
    logoFloatAnimation.start();
    shineAnimation.start();

    return () => {
      outerRingAnimation.stop();
      middleRingAnimation.stop();
      topGlowAnimation.stop();
      bottomGlowAnimation.stop();
      logoFloatAnimation.stop();
      shineAnimation.stop();
    };
  }, [
    bottomGlowMotion,
    logoFloat,
    middleRing,
    outerRing,
    shinePosition,
    topGlowMotion,
  ]);

  const ringScaleOuter = outerRing.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.45] });
  const ringOpacityOuter = outerRing.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
  const ringScaleMiddle = middleRing.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.45] });
  const ringOpacityMiddle = middleRing.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
  const topGlowX = topGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const topGlowY = topGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const topGlowScale = topGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const bottomGlowX = bottomGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const bottomGlowY = bottomGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const bottomGlowScale = bottomGlowMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const logoTranslateY = logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowTop,
          { transform: [{ translateX: topGlowX }, { translateY: topGlowY }, { scale: topGlowScale }] },
        ]}
      >
        <View style={styles.glowTopMiddle} />
        <View style={styles.glowTopCore} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowBottom,
          { transform: [{ translateX: bottomGlowX }, { translateY: bottomGlowY }, { scale: bottomGlowScale }] },
        ]}
      >
        <View style={styles.glowBottomMiddle} />
        <View style={styles.glowBottomCore} />
      </Animated.View>
      <View style={styles.center}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ringOuter,
            { opacity: ringOpacityOuter, transform: [{ scale: ringScaleOuter }] },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ringMiddle,
            { opacity: ringOpacityMiddle, transform: [{ scale: ringScaleMiddle }] },
          ]}
        />
        <Animated.View
          style={[
            styles.logo,
            { transform: [{ translateY: logoTranslateY }] },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.logoShine,
              { transform: [{ translateX: shinePosition }, { rotate: '25deg' }] },
            ]}
          />
          <Text style={styles.logoLetter}>D</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#080e15',
  },
  glowTop: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    top: -120,
    right: -100,
    backgroundColor: 'rgba(236, 159, 25, 0.015)',
  },
  glowTopMiddle: {
    position: 'absolute',
    top: 65,
    left: 65,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(236, 159, 25, 0.018)',
  },
  glowTopCore: {
    position: 'absolute',
    top: 130,
    left: 130,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(236, 159, 25, 0.022)',
  },
  glowBottom: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    bottom: -100,
    left: -80,
    backgroundColor: 'rgba(45, 78, 106, 0.025)',
  },
  glowBottomMiddle: {
    position: 'absolute',
    top: 60,
    left: 60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(45, 78, 106, 0.055)',
  },
  glowBottomCore: {
    position: 'absolute',
    top: 125,
    left: 125,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(45, 78, 106, 0.1)',
  },
  center: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(236, 159, 25, 0.28)',
  },
  ringMiddle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 78, 106, 0.4)',
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#203a50',
    borderWidth: 1.8,
    borderColor: '#ec9f19',
    shadowColor: '#ec9f19',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  logoShine: {
    position: 'absolute',
    top: -37,
    left: 23,
    width: 22,
    height: 148,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  logoLetter: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 38,
    lineHeight: 46,
    color: '#ec9f19',
    textShadowColor: 'rgba(236, 159, 25, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
