import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { CartIcon, CheckIcon } from './icons';
import { hapticMedium } from '../services/haptics';
import { styles } from '../styles/ProductCard.styles';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  appearanceKey: string;
  appearanceIndex: number;
  onAddToCart?: (product: Product) => void;
  onPress?: (product: Product) => void;
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export const ProductCard = memo(({ product, appearanceKey, appearanceIndex, onAddToCart, onPress }: ProductCardProps) => {
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    entranceProgress.setValue(0);
    const animation = Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 320,
      delay: Math.min(appearanceIndex, 9) * 30,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [appearanceIndex, appearanceKey, entranceProgress]);

  const entranceY = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const inStock = (product.quantity ?? 1) > 0;
  const isPromo = Boolean(product.isPromo && product.priceRegular);

  const handleBuy = () => {
    if (!inStock || isAdding) return;
    hapticMedium();
    setIsAdding(true);
    onAddToCart?.(product);

    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }, 350);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entranceProgress,
          transform: [{ translateY: entranceY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardInner}
        activeOpacity={0.92}
        onPress={() => onPress?.(product)}
      >
        <View style={styles.imageBox}>
          {product.avatar ? (
            <Image
              source={{ uri: product.avatar }}
              cachePolicy="memory-disk"
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <View style={styles.ampoulesPlaceholder}>
                <Text style={styles.ampoulesArt}>🧴</Text>
                <Text style={styles.ampouleText}>Ампулы для яркой жизни</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        <Text style={[styles.stockStatus, inStock ? styles.stockIn : styles.stockOut]}>
          {inStock ? 'В наличии' : 'Нет в наличии'}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceColumn}>
            <View style={styles.priceLabelRow}>
              <Text style={styles.priceLabel}>Цена:</Text>
              {isPromo && product.priceRegular ? (
                <Text style={styles.priceOld}>{formatPrice(product.priceRegular)}</Text>
              ) : null}
            </View>
            <Text style={isPromo ? styles.priceSpecial : styles.priceRegular}>
              {formatPrice(product.price)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.cartButton,
              isPromo ? styles.cartButtonPromo : styles.cartButtonRegular,
              isAdded && styles.cartButtonAdded,
              !inStock && styles.cartButtonDisabled,
            ]}
            disabled={!inStock || isAdding}
            onPress={handleBuy}
            activeOpacity={0.75}
          >
            {isAdding ? (
              <ActivityIndicator
                size="small"
                color={isPromo ? '#ef4444' : '#3b82f6'}
              />
            ) : isAdded ? (
              <CheckIcon size={18} color="#16a34a" strokeWidth={2.5} />
            ) : (
              <CartIcon
                size={18}
                color={isPromo ? '#ef4444' : '#8ebce6'}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

ProductCard.displayName = 'ProductCard';
