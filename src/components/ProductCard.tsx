import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { CartIcon, CheckIcon } from './icons';
import { hapticMedium } from '../services/haptics';
import { styles } from '../styles/ProductCard.styles';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onPress?: (product: Product) => void;
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export const ProductCard = memo(({ product, onAddToCart, onPress }: ProductCardProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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
    <View style={styles.card}>
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
    </View>
  );
});

ProductCard.displayName = 'ProductCard';
