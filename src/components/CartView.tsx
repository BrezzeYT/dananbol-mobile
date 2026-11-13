import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { Image } from 'expo-image';
import { useCartContext } from '../context/useCartContext';
import { useAuthContext } from '../context/useAuthContext';
import {
  CartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from './icons';
import { cartStyles as s } from '../styles/CartView.styles';
import type { Product } from '../types';
import { hapticLight, hapticMedium, hapticHeavy } from '../services/haptics';

function formatPrice(v: number) {
  return `${v.toLocaleString('ru-RU')} ₽`;
}

interface CartItemRowProps {
  product: Product;
  quantity: number;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, q: number) => void;
  onProductClick?: (product: Product) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  product,
  quantity,
  onRemove,
  onUpdateQuantity,
  onProductClick,
}) => {
  const isPromo = Boolean(product.isPromo && product.priceRegular);
  const maxQty = product.quantity ?? Infinity;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleRemove = () => {
    hapticHeavy();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRemove(product.id);
    });
  };

  const handleUpdate = (newQty: number) => {
    hapticMedium();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onUpdateQuantity(product.id, newQty);
  };

  return (
    <Animated.View
      style={[
        s.itemCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={s.itemImageBox}
        onPress={() => onProductClick?.(product)}
        activeOpacity={0.8}
      >
        {product.avatar ? (
          <Image
            source={{ uri: product.avatar }}
            cachePolicy="memory-disk"
            style={s.itemImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={s.itemNoImage}>
            <Text style={s.itemNoImageEmoji}>🧴</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.itemInfo}>
        <TouchableOpacity
          onPress={() => onProductClick?.(product)}
          activeOpacity={0.7}
        >
          <Text style={s.itemName} numberOfLines={2}>
            {product.name}
          </Text>
        </TouchableOpacity>

        <View style={s.stepperRow}>
          <TouchableOpacity
            style={[s.stepperBtn, quantity <= 1 && s.stepperBtnDisabled]}
            onPress={() => handleUpdate(quantity - 1)}
            disabled={quantity <= 1}
            activeOpacity={0.7}
          >
            <MinusIcon size={14} color={quantity <= 1 ? '#cbd5e1' : '#3a81c1'} />
          </TouchableOpacity>

          <Text style={s.stepperVal}>{quantity}</Text>

          <TouchableOpacity
            style={[s.stepperBtn, quantity >= maxQty && s.stepperBtnDisabled]}
            onPress={() => handleUpdate(quantity + 1)}
            disabled={quantity >= maxQty}
            activeOpacity={0.7}
          >
            <PlusIcon size={14} color={quantity >= maxQty ? '#cbd5e1' : '#3a81c1'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.itemRight}>
        <TouchableOpacity
          style={s.removeBtn}
          onPress={handleRemove}
          activeOpacity={0.6}
        >
          <TrashIcon size={20} color="#ef4444" strokeWidth={1.8} />
        </TouchableOpacity>

        <View style={s.priceGroup}>
          {isPromo && product.priceRegular ? (
            <Text style={s.priceOld}>
              {formatPrice(product.priceRegular * quantity)}
            </Text>
          ) : null}
          <Text style={[s.priceMain, isPromo && s.pricePromo]}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

interface CartViewProps {
  onProductClick?: (product: Product) => void;
  onCheckout?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onProductClick, onCheckout }) => {
  const {
    items,
    subTotal,
    insurance,
    shipping,
    removeFromCart,
    updateQuantity,
  } = useCartContext();
  const { customer, openAuth } = useAuthContext();

  const validItems = items.filter(
    (i) => i.product && i.product.name && typeof i.product.price === 'number'
  );

  let eligibleSubtotal = 0;
  validItems.forEach(({ product, quantity }) => {
    if (product.isPromo) return;
    const isGormon =
      product.category === '70' ||
      String(product.categoryName || '').toLowerCase().includes('гормон');
    if (isGormon) return;
    eligibleSubtotal += product.price * quantity;
  });

  let volumeDiscountPercent = 0;
  if (eligibleSubtotal >= 100000) {
    volumeDiscountPercent = 30;
  } else if (eligibleSubtotal >= 50000) {
    volumeDiscountPercent = 20;
  } else if (eligibleSubtotal >= 20000) {
    volumeDiscountPercent = 10;
  }

  const volumeDiscount = Math.round(
    (eligibleSubtotal * volumeDiscountPercent) / 100
  );

  const displayGrandTotal = Math.max(
    0,
    subTotal - volumeDiscount + insurance + shipping
  );

  const minOrderTarget = 5000;
  const remainingForMinOrder = Math.max(0, minOrderTarget - displayGrandTotal);
  const minOrderProgress = Math.min(
    100,
    Math.round((displayGrandTotal / minOrderTarget) * 100)
  );

  const progressAnim = useRef(new Animated.Value(minOrderProgress)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: minOrderProgress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [minOrderProgress]);

  if (validItems.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <View style={s.emptyIconWrap}>
          <CartIcon size={44} color="#e68c33" strokeWidth={1.5} />
        </View>
        <Text style={s.emptyTitle}>В корзине пока пусто</Text>
        <Text style={s.emptySub}>
          Добавьте товары, чтобы увидеть их здесь
        </Text>
      </View>
    );
  }

  const handleOrder = () => {
    hapticLight();
    if (!customer) {
      openAuth();
      return;
    }
    onCheckout?.();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.container}>
      <FlatList
        data={validItems}
        keyExtractor={(item) => String(item.product.id)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <CartItemRow
            product={item.product}
            quantity={item.quantity}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onProductClick={onProductClick}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {remainingForMinOrder > 0 && (
        <View style={s.minOrderWrap}>
          <View style={s.minOrderHeader}>
            <Text style={s.minOrderTitle}>Мин. заказ 5 000 ₽</Text>
            <View style={s.minOrderBadge}>
              <Text style={s.minOrderRem}>
                еще {formatPrice(remainingForMinOrder)}
              </Text>
            </View>
          </View>
          <View style={s.minOrderTrack}>
            <Animated.View
              style={[s.minOrderBar, { width: progressWidth }]}
            />
          </View>
        </View>
      )}

      <View style={s.footer}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Сумма</Text>
          <Text style={s.totalValue}>{formatPrice(subTotal)}</Text>
        </View>

        {volumeDiscount > 0 && (
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.discountLabel]}>
              Скидка ({volumeDiscountPercent}%)
            </Text>
            <Text style={[s.totalValue, s.discountValue]}>
              −{formatPrice(volumeDiscount)}
            </Text>
          </View>
        )}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Страховка (3%)</Text>
          <Text style={s.totalValue}>{formatPrice(insurance)}</Text>
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Почта России</Text>
          <Text style={s.totalValue}>{formatPrice(shipping)}</Text>
        </View>

        <View style={s.grandRow}>
          <Text style={s.grandLabel}>Итого к оплате</Text>
          <Text style={s.grandValue}>{formatPrice(displayGrandTotal)}</Text>
        </View>

        <TouchableOpacity
          style={s.checkoutBtn}
          onPress={handleOrder}
          activeOpacity={0.85}
        >
          <Text style={s.checkoutBtnText}>
            {customer ? 'Оформить заказ' : 'Войти и оформить'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
