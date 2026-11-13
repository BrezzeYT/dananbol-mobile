import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Vibration } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  Circle,
  G,
} from 'react-native-svg';
import { CheckIcon } from './icons';
import { checkoutStyles as s } from '../styles/CheckoutView.styles';

const STEPS = [
  'Инициализация транзакции',
  'Проверка баланса аккаунта',
  'Резервирование товаров на складе',
  'Передача заказа Бригадиру',
];

const BUBBLES = [
  { id: 1, cx: 35, cy: 130, r: 3, delay: 0 },
  { id: 2, cx: 65, cy: 110, r: 4, delay: 300 },
  { id: 3, cx: 45, cy: 120, r: 2.5, delay: 600 },
  { id: 4, cx: 55, cy: 100, r: 3.5, delay: 900 },
  { id: 5, cx: 40, cy: 105, r: 2, delay: 1200 },
  { id: 6, cx: 60, cy: 125, r: 3, delay: 1500 },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BubbleItem: React.FC<{
  cx: number;
  cy: number;
  r: number;
  delay: number;
  active: boolean;
}> = ({ cx, cy, r, delay, active }) => {
  const [offsetY, setOffsetY] = useState(0);
  const [bubbleOpacity, setBubbleOpacity] = useState(0.6);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setOffsetY(value * -90);
      if (value < 0.2) setBubbleOpacity(0.6);
      else if (value < 0.8) setBubbleOpacity(0.6 - (value - 0.2) * 0.66);
      else setBubbleOpacity(Math.max(0, 0.2 - (value - 0.8) * 1.0));
    });
    return () => {
      anim.removeListener(id);
    };
  }, [anim]);

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim, delay]);

  if (!active) return null;

  return (
    <Circle
      cx={cx}
      cy={cy + offsetY}
      r={r}
      fill="#ffffff"
      opacity={bubbleOpacity}
    />
  );
};

export const OrderProcessingLoader: React.FC<{ onFinish: () => void }> = ({
  onFinish,
}) => {
  const [step, setStep] = useState(0);
  const currentYRef = useRef(140);
  const [fillYVal, setFillYVal] = useState(140);
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeRot = useRef(new Animated.Value(0)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;


  useEffect(() => {
    let animId: number;
    const startY = currentYRef.current;
    const targetY = 140 - (step / 4) * 102;
    const startTime = Date.now();
    const duration = 800;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const curY = startY + (targetY - startY) * ease;
      currentYRef.current = curY;
      setFillYVal(curY);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [step]);

  useEffect(() => {
    const intervals = [800, 1800, 2800, 3800];
    const timers = intervals.map((time, index) =>
      setTimeout(() => {
        const nextStep = index + 1;
        setStep(nextStep);


        try {
          Vibration.vibrate(20);
        } catch { }


        Animated.sequence([
          Animated.parallel([
            Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: -6, duration: 60, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: 8, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: 6, duration: 70, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: -6, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: -4, duration: 70, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: 6, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: 4, duration: 70, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: -4, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: -2, duration: 60, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: 4, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: 2, duration: 60, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, { toValue: 0, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeRot, { toValue: 0, duration: 70, useNativeDriver: true }),
          ]),
        ]).start();
      }, time)
    );

    const finishTimer = setTimeout(() => {
      try {
        Vibration.vibrate([0, 30, 80, 40]);
      } catch { }
      setTimeout(() => onFinishRef.current(), 700);
    }, 4500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [shakeRot, shakeX]);

  const rotateStr = shakeRot.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={s.loaderOverlay}>
      <View style={s.loaderCard}>
        <Animated.View
          style={[
            s.loaderShakerWrap,
            { transform: [{ translateX: shakeX }, { rotate: rotateStr }] },
          ]}
        >
          <Svg
            viewBox="0 0 100 150"
            fill="none"
            style={s.loaderShakerSvg}
          >
            <Defs>
              <LinearGradient id="neonGradient" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor="#00f2fe" />
                <Stop offset="100%" stopColor="#4facfe" />
              </LinearGradient>
              <ClipPath id="shakerClip">
                <Path d="M25 40 L30 135 C30 137.76 32.24 140 35 140 L65 140 C67.76 140 70 137.76 70 135 L75 40 Z" />
              </ClipPath>
            </Defs>

            <Path
              d="M25 40 L30 135 C30 137.76 32.24 140 35 140 L65 140 C67.76 140 70 137.76 70 135 L75 40 Z"
              fill="#f8fafc"
            />

            <G clipPath="url(#shakerClip)">
              <Rect
                x={0}
                y={fillYVal}
                width={100}
                height={150}
                fill="url(#neonGradient)"
              />

              {BUBBLES.map((b) => (
                <BubbleItem
                  key={b.id}
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  delay={b.delay}
                  active={step > 0}
                />
              ))}
            </G>

            <Path
              d="M25 40 L30 135 C30 137.76 32.24 140 35 140 L65 140 C67.76 140 70 137.76 70 135 L75 40 Z"
              fill="none"
              stroke="#0f172a"
              strokeWidth={4}
              strokeLinejoin="round"
            />

            <Path
              d="M20 40 L80 40 L75 30 L25 30 Z"
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth={2}
            />

            <Path
              d="M42 30 L58 30 L55 20 L45 20 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth={2}
            />
          </Svg>
        </Animated.View>

        <Text style={s.loaderTitle}>
          {step < 4 ? 'Оформляем заказ...' : 'Заказ оформлен!'}
        </Text>
        <Text style={s.loaderDesc}>
          {step < 4
            ? 'Пожалуйста, подождите несколько секунд'
            : 'Спортивное питание успешно зарезервировано'}
        </Text>

        <View style={s.loaderSteps}>
          {STEPS.map((text, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx;

            return (
              <View key={idx} style={s.loaderStepItem}>
                {idx < STEPS.length - 1 && (
                  <View
                    style={[
                      s.loaderStepLine,
                      isCompleted && s.loaderStepLineCompleted,
                    ]}
                  />
                )}
                <View
                  style={[
                    s.loaderStepCircle,
                    isCompleted && s.loaderStepCircleCompleted,
                    isCurrent && s.loaderStepCircleCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <CheckIcon size={12} color="#ffffff" strokeWidth={3} />
                  ) : isCurrent ? (
                    <View style={s.loaderStepDot} />
                  ) : null}
                </View>
                <Text
                  style={[
                    s.loaderStepLabel,
                    isCompleted && s.loaderStepLabelCompleted,
                    isCurrent && s.loaderStepLabelCurrent,
                  ]}
                >
                  {text}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

