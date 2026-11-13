import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Product } from '../types';
import { CartIcon, CheckIcon, PlusIcon, MinusIcon } from './icons';
import { hapticMedium } from '../services/haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface ProductDetailsSheetProps {
  product: Product | null;
  visible: boolean;
  cartQuantity: number;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onGoToCart: () => void;
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export const ProductDetailsSheet: React.FC<ProductDetailsSheetProps> = ({
  product,
  visible,
  cartQuantity,
  onClose,
  onAddToCart,
  onUpdateQuantity,
  onGoToCart,
}) => {
  const insets = useSafeAreaInsets();
  const [localQuantity, setLocalQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setLocalQuantity(1);
      // overlay fades in immediately, sheet slides up with spring
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          stiffness: 380,
          damping: 32,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // reverse: sheet slides down, overlay fades out
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        overlayOpacity.setValue(0);
        sheetTranslateY.setValue(SCREEN_HEIGHT);
      });
    }
  }, [visible]);

  const inStock = product ? (product.quantity ?? 1) > 0 : false;
  const isPromo = product ? Boolean(product.isPromo && product.priceRegular) : false;
  const currentQuantity = cartQuantity > 0 ? cartQuantity : localQuantity;
  const maxQty = product ? (product.quantity ?? Infinity) : Infinity;

  const handleDecrease = () => {
    if (!product) return;
    hapticMedium();
    if (cartQuantity > 0) {
      onUpdateQuantity(product.id, cartQuantity - 1);
    } else {
      setLocalQuantity((prev) => Math.max(1, prev - 1));
    }
  };

  const handleIncrease = () => {
    if (!product) return;
    hapticMedium();
    if (cartQuantity > 0) {
      if (cartQuantity < maxQty) {
        onUpdateQuantity(product.id, cartQuantity + 1);
      }
    } else {
      setLocalQuantity((prev) => Math.min(maxQty, prev + 1));
    }
  };

  const handleAdd = () => {
    if (!inStock || !product) return;
    hapticMedium();
    onAddToCart(product, localQuantity);
  };

  const categoryLabel = product ? (product.subcategoryName || product.categoryName || '—') : '—';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {product && (
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  paddingBottom: Math.max(insets.bottom, 16) + 10,
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              <View style={styles.handle} />

              <View style={styles.content}>
                <Text style={styles.title}>{product.name}</Text>

                <View style={styles.specs}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Категория</Text>
                    <Text style={styles.specValue}>{categoryLabel}</Text>
                  </View>

                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Наличие</Text>
                    <View
                      style={[
                        styles.stockBadge,
                        inStock ? styles.stockIn : styles.stockOut,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          inStock ? styles.stockInText : styles.stockOutText,
                        ]}
                      >
                        {inStock ? `${product.quantity} шт.` : 'Нет в наличии'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.priceBlock}>
                  <Text style={styles.priceLabel}>Стоимость</Text>
                  {isPromo && product.priceRegular ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceOld}>
                        {formatPrice(product.priceRegular * currentQuantity)}
                      </Text>
                      <Text style={[styles.priceCurrent, styles.pricePromo]}>
                        {formatPrice(product.price * currentQuantity)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.priceCurrent}>
                      {formatPrice(product.price * currentQuantity)}
                    </Text>
                  )}
                </View>

                {inStock && (
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleDecrease}
                      disabled={currentQuantity <= 1 && cartQuantity === 0}
                      activeOpacity={0.7}
                    >
                      <MinusIcon size={14} color="#64748b" />
                    </TouchableOpacity>

                    <Text style={styles.stepperVal}>{currentQuantity}</Text>

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleIncrease}
                      disabled={currentQuantity >= maxQty}
                      activeOpacity={0.7}
                    >
                      <PlusIcon size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                )}

                {cartQuantity > 0 ? (
                  <TouchableOpacity
                    style={[styles.buyBtn, styles.buyBtnSuccess]}
                    onPress={onGoToCart}
                    activeOpacity={0.8}
                  >
                    <CheckIcon size={18} color="#ffffff" strokeWidth={2.5} />
                    <Text style={styles.buyBtnText}>В корзине</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      isPromo ? styles.buyBtnPromo : styles.buyBtnNormal,
                      !inStock && styles.buyBtnDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!inStock}
                    activeOpacity={0.8}
                  >
                    <CartIcon size={16} color="#ffffff" />
                    <View style={styles.buyDivider} />
                    <Text style={styles.buyBtnText}>Купить</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: '#0f172a',
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  specs: {
    gap: 14,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#94a3b8',
  },
  specValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#2d4e6a',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stockIn: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
  },
  stockOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stockBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  stockInText: {
    color: '#16a34a',
  },
  stockOutText: {
    color: '#ef4444',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  priceBlock: {
    minWidth: 90,
  },
  priceLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  priceRow: {
    gap: 1,
  },
  priceOld: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  priceCurrent: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 18,
    color: '#2d4e6a',
    letterSpacing: -0.5,
  },
  pricePromo: {
    color: '#ef4444',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 50,
    padding: 2,
    height: 40,
    minWidth: 90,
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stepperVal: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#0f172a',
    minWidth: 20,
    textAlign: 'center',
  },
  buyBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyBtnNormal: {
    backgroundColor: '#8ebce6',
  },
  buyBtnPromo: {
    backgroundColor: '#ef4444',
  },
  buyBtnSuccess: {
    backgroundColor: '#2ecc71',
  },
  buyBtnDisabled: {
    opacity: 0.55,
  },
  buyBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  buyDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});

