import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, ClipPath, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useCartContext } from '../context/useCartContext';
import { useAuthContext } from '../context/useAuthContext';
import {
  fetchMobileAddresses,
  createMobileAddress,
  lookupPostalOffice,
} from '../api/addresses';
import {
  fetchMobileQuote,
  createMobileOrder,
  type QuoteResult,
} from '../api/checkout';
import type { Address } from '../types/addresses';
import type { Product } from '../types';
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  TagIcon,
  CloseIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
} from './icons';
import { OrderProcessingLoader } from './OrderProcessingLoader';
import { showLocalNotification } from '../services/notifications';
import { checkoutStyles as s } from '../styles/CheckoutView.styles';

function formatPrice(v: number) {
  return `${Math.round(v).toLocaleString('ru-RU')} ₽`;
}

function generateIdempKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}



const InsuranceToggle: React.FC<{ value: boolean; onValueChange: (value: boolean) => void }> = ({ value, onValueChange }) => {
  const thumbPosition = useRef(new Animated.Value(value ? 18 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: value ? 18 : 0,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [thumbPosition, value]);

  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Включить страховку"
      onPress={() => onValueChange(!value)}
      activeOpacity={1}
      style={[s.insuranceSwitchTrack, value && s.insuranceSwitchTrackActive]}
    >
      <Animated.View style={[s.insuranceSwitchThumb, { transform: [{ translateX: thumbPosition }] }]} />
    </TouchableOpacity>
  );
};



interface SuccessData {
  orderId: number;
  managerLink: string;
  isPaid: boolean;
  totalAmount: number;
  items: { product: Product; quantity: number }[];
}

const OrderSuccessScreen: React.FC<{
  data: SuccessData;
  balance: number;
  onClose: () => void;
  onTopUp: () => void;
}> = ({ data, balance, onClose, onTopUp }) => {
  const shortfall = Math.max(0, data.totalAmount - balance);
  const formattedShortfall = shortfall.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <ScrollView style={s.successContainer} contentContainerStyle={s.successInner} showsVerticalScrollIndicator={false}>

      <View style={s.successSubHeader}>
        <Text style={s.successTitle}>Заказ #{data.orderId}</Text>
        <TouchableOpacity style={s.successBackBtn} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
          <Text style={s.successBackTxt}>Назад</Text>
        </TouchableOpacity>
      </View>


      <View style={[s.successStatusLabel, data.isPaid ? s.successStatusLabelPaid : s.successStatusLabelPending]}>
        <Text style={[s.successStatusTxt, data.isPaid ? s.successStatusTxtPaid : s.successStatusTxtPending]}>
          {data.isPaid ? 'Статус: Оплачен' : 'Статус: Ожидает оплаты'}
        </Text>
      </View>


      <View style={s.successBlock}>
        <View style={s.successIconRow}>
          <View style={[s.successIconCircle, data.isPaid ? s.successIconCirclePaid : s.successIconCirclePending]}>
            {data.isPaid ? (
              <CheckCircle2Icon size={22} color="#10b981" strokeWidth={2.5} />
            ) : (
              <AlertTriangleIcon size={22} color="#f59e0b" strokeWidth={2.5} />
            )}
          </View>
          <View style={s.successIconInfo}>
            <Text style={s.successIconTitle}>
              {data.isPaid ? 'Оплата успешно проведена' : 'Оплата не завершена'}
            </Text>
            <Text style={s.successIconDesc}>
              {data.isPaid ? 'Средства списаны с вашего счета' : 'Недостаточно средств на балансе'}
            </Text>
          </View>
        </View>

        <View style={s.successDivider} />

        <View style={s.successDetailRow}>
          <Text style={s.successDetailLabel}>Сумма заказа</Text>
          <Text style={s.successDetailValue}>{data.totalAmount} ₽</Text>
        </View>
        <View style={s.successDetailRow}>
          <Text style={s.successDetailLabel}>Ваш баланс</Text>
          <Text style={s.successDetailValue}>{balance} ₽</Text>
        </View>

        {!data.isPaid && (
          <>
            <View style={s.successUnpaidBox}>
              <View style={s.successUnpaidRow}>
                <Text style={s.successUnpaidLabel}>Не хватает:</Text>
                <Text style={s.successUnpaidValue}>{formattedShortfall} ₽</Text>
              </View>
              <Text style={s.successUnpaidDesc}>
                Пожалуйста, пополните баланс для завершения оплаты заказа.
              </Text>
            </View>
            <TouchableOpacity style={s.successTopupBtn} onPress={onTopUp} activeOpacity={0.85}>
              <Text style={s.successTopupBtnTxt}>Пополнить баланс</Text>
              <ChevronRightIcon size={16} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        )}
      </View>


      {data.items && data.items.length > 0 && (
        <View style={s.successBlock}>
          <Text style={s.successBlockTitle}>Товары</Text>
          {data.items.map((item, idx) => (
            <View key={idx} style={s.successProductItem}>
              <View style={s.successProductImg}>
                {item.product.avatar ? (
                  <Image
                    source={{ uri: item.product.avatar }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={s.successProductNoImg} />
                )}
              </View>
              <View style={s.successProductBody}>
                <View style={s.successProductTopRow}>
                  <Text style={s.successProductName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={s.successProductUnitPrice}>
                    {item.product.price} ₽
                  </Text>
                </View>
                <View style={s.successProductBottomRow}>
                  <Text style={s.successProductQty}>
                    Количество: {item.quantity} шт.
                  </Text>
                  <Text style={s.successProductTotal}>
                    {item.product.price * item.quantity} ₽
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={s.successDoneBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={s.successDoneBtnTxt}>На главную</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};



const AddressFormPage: React.FC<{
  token: string;
  onSaved: (addr: Address) => void;
  onCancel: () => void;
}> = ({ token, onSaved, onCancel }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [address1, setAddress1] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [postcodeErr, setPostcodeErr] = useState<string | null>(null);
  const [isApiControlled, setIsApiControlled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const handleLookup = async () => {
    const zip = postcode.replace(/\D/g, '').slice(0, 6);
    if (zip.length !== 6) { setPostcodeErr('Индекс должен состоять из 6 цифр.'); return; }
    setIsSearching(true); setPostcodeErr(null);
    try {
      const resp = await lookupPostalOffice(zip);
      if (!resp || resp.success !== true || !resp.data?.length) {
        setPostcodeErr(
          resp?.error === 'ПОЧТОМАТ'
            ? 'Доставка в почтоматы/ПВЗ не осуществляется, введите индекс почтового отделения'
            : (resp?.error ? String(resp.error) : 'Почтовое отделение не найдено, введите корректный индекс')
        );
        return;
      }
      const a = resp.data[0].address;
      const c = ((a.settlementTypeOrCityType || '') + ' ' + (a.settlementOrCity || '')).trim();
      const addr = a.shortAddress ? String(a.shortAddress).trim() : '';
      if (c && addr) {
        setCity(c); setAddress1(addr); setIsApiControlled(true);
        const fz = resp.zone_id ? String(resp.zone_id) : '';
        setZoneId(fz);
        if (fz && resp.zone_name) setZoneName(resp.zone_name);
      } else {
        setPostcodeErr('Почтовое отделение не найдено, введите корректный индекс');
      }
    } catch (err: unknown) {
      console.warn('Checkout postcode lookup error:', err);
      const msg = err instanceof Error ? err.message : 'Ошибка поиска отделения почты';
      setPostcodeErr(msg);
    }
    finally { setIsSearching(false); }
  };

  const handleSave = async () => {
    if (!firstname.trim()) { setCreateErr('Укажите имя'); return; }
    if (!lastname.trim()) { setCreateErr('Укажите фамилию'); return; }
    if (!isApiControlled || !zoneId) { setCreateErr('Сначала найдите почтовое отделение по индексу'); return; }
    setIsCreating(true); setCreateErr(null);
    try {
      const res = await createMobileAddress(token, {
        firstname: firstname.trim(), lastname: lastname.trim(),
        city, postcode, address_1: address1, zone_id: parseInt(zoneId, 10),
      });
      if (res.ok && res.address) onSaved(res.address);
      else setCreateErr(res.error || 'Не удалось сохранить адрес');
    } catch (e: unknown) {
      setCreateErr(e instanceof Error ? e.message : 'Ошибка сохранения адреса');
    } finally { setIsCreating(false); }
  };

  return (
    <ScrollView style={s.addressFormContainer} contentContainerStyle={s.addressFormInner} showsVerticalScrollIndicator={false}>
      <View style={s.formPageHeader}>
        <Text style={s.formPageTitle}>Новый адрес доставки</Text>
        <TouchableOpacity style={s.formBackBtn} onPress={onCancel} activeOpacity={0.7}>
          <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
          <Text style={s.formBackTxt}>Назад</Text>
        </TouchableOpacity>
      </View>


      <View style={s.formRow}>
        <View style={s.formCol}>
          <Text style={s.inputLabel}>Имя *</Text>
          <TextInput style={s.textInput} placeholder="Иван" placeholderTextColor="#94a3b8" value={firstname} onChangeText={setFirstname} editable={!isCreating} />
        </View>
        <View style={s.formCol}>
          <Text style={s.inputLabel}>Фамилия *</Text>
          <TextInput style={s.textInput} placeholder="Иванов" placeholderTextColor="#94a3b8" value={lastname} onChangeText={setLastname} editable={!isCreating} />
        </View>
      </View>


      <View style={s.formGroup}>
        <Text style={s.inputLabel}>Почтовый индекс *</Text>
        <View style={s.postcodeInputRow}>
          <TextInput
            style={[s.textInput, { flex: 1 }]}
            placeholder="101000"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={6}
            value={postcode}
            onChangeText={(t: string) => { setPostcode(t.replace(/\D/g, '').slice(0, 6)); setPostcodeErr(null); setIsApiControlled(false); }}
            editable={!isCreating}
          />
          <TouchableOpacity
            style={[s.postcodeBtn, (postcode.length !== 6 || isSearching) && s.postcodeBtnDisabled]}
            onPress={handleLookup}
            disabled={postcode.length !== 6 || isSearching || isCreating}
            activeOpacity={0.8}
          >
            {isSearching
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <Text style={s.postcodeBtnTxt}>{isApiControlled ? 'Найдено ✓' : 'Найти отделение'}</Text>}
          </TouchableOpacity>
        </View>
        {postcodeErr ? <Text style={s.postcodeError}>{postcodeErr}</Text> : null}
        <Text style={s.postcodeHint}>
          Город и адрес доставки автоматически определяется по индексу.
          Доставка осуществляется до востребования в отделение Почты РФ.
        </Text>
      </View>

      <View style={s.formGroup}>
        <Text style={s.inputLabel}>Регион *</Text>
        <View pointerEvents="none">
          <TextInput
            style={[s.textInput, s.textInputDisabled]}
            value={zoneName || (zoneId ? `Регион #${zoneId}` : '')}
            placeholder="Заполняется по индексу"
            placeholderTextColor="#94a3b8"
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
      </View>
      <View style={s.formGroup}>
        <Text style={s.inputLabel}>Населённый пункт *</Text>
        <View pointerEvents="none">
          <TextInput
            style={[s.textInput, s.textInputDisabled]}
            value={city}
            placeholder="Заполняется по индексу"
            placeholderTextColor="#94a3b8"
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
      </View>
      <View style={s.formGroup}>
        <Text style={s.inputLabel}>Адрес отделения *</Text>
        <View pointerEvents="none">
          <TextInput
            style={[s.textInput, s.textInputDisabled]}
            value={address1}
            placeholder="Заполняется по индексу"
            placeholderTextColor="#94a3b8"
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
      </View>

      {createErr ? (
        <View style={s.formCreateError}><Text style={s.formCreateErrorTxt}>{createErr}</Text></View>
      ) : null}

      <View style={s.formActionsRow}>
        <TouchableOpacity style={s.formCancelBtn} onPress={onCancel} disabled={isCreating} activeOpacity={0.7}>
          <Text style={s.formCancelBtnTxt}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.formSaveBtn, (isCreating || !isApiControlled || !firstname.trim() || !lastname.trim()) && s.formSaveBtnDisabled]}
          onPress={handleSave}
          disabled={isCreating || !isApiControlled || !firstname.trim() || !lastname.trim()}
          activeOpacity={0.8}
        >
          {isCreating ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={s.formSaveBtnTxt}>Сохранить</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};



interface CheckoutViewProps {
  onBack: () => void;
  onGoHome?: () => void;
  onProductClick?: (product: Product) => void;
  onGoToAddresses?: () => void;
  onOrderCreated?: (orderId: number) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onBack, onGoHome, onProductClick, onGoToAddresses, onOrderCreated }) => {
  const { items, clearCart, subTotal: cartSubTotal } = useCartContext();
  const { customer, token, refreshSession } = useAuthContext();
  const validItems = items.filter((i) => i.product && i.quantity > 0);

  // — Addresses —
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // — Codes —
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [appliedGift, setAppliedGift] = useState('');
  const [comment, setComment] = useState('');
  const [strah, setStrah] = useState(true);

  // — Quote —
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // — Order state —
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showMinOrder, setShowMinOrder] = useState(false);
  const [balanceError, setBalanceError] = useState<{ shortfall: number; topupLink: string } | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<SuccessData | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const idempKey = useRef(generateIdempKey());


  useEffect(() => {
    if (!token) { setLoadingAddresses(false); return; }
    fetchMobileAddresses(token)
      .then((res) => {
        if (res.ok) {
          if (res.addresses) {
            setAddresses(res.addresses);
            if (res.addresses.length > 0) setSelectedAddressId(res.addresses[0].id);
          }
        }
      })
      .catch(() => { })
      .finally(() => setLoadingAddresses(false));
  }, [token]);


  const cartKey = validItems.map((i) => `${i.product.id}:${i.quantity}`).sort().join(',');

  const doFetchQuote = useCallback(async () => {
    if (!token || validItems.length === 0) return;
    setQuoteLoading(true); setQuoteError(null);
    try {
      const r = await fetchMobileQuote(
        token,
        validItems.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
        appliedCoupon, appliedGift, strah,
      );
      if (r.ok) setQuote(r);
      else {
        const msg = typeof r.error === 'object' && r.error !== null
          ? (r.error as { message?: string }).message || JSON.stringify(r.error)
          : String(r.error) || 'Ошибка расчёта';
        setQuoteError(msg); setQuote(null);
      }
    } catch (e) { setQuoteError(e instanceof Error ? e.message : 'Ошибка расчёта'); }
    finally { setQuoteLoading(false); }
  }, [token, cartKey, appliedCoupon, appliedGift, strah]); // eslint-disable-line

  useEffect(() => { doFetchQuote(); }, [doFetchQuote]);

  const insuranceCost = quote?.data?.insurance !== undefined ? quote.data.insurance : strah ? Math.floor(cartSubTotal * 0.03) : 0;
  const shippingCost = quote ? quote.data.shipping : 1190;
  const discountCost = quote ? (quote.data.discount ?? 0) : 0;
  const volumeDiscount = quote ? (quote.data.volume_discount ?? 0) : 0;
  const displayTotal = quote
    ? quote.data.total
    : Math.round(cartSubTotal + insuranceCost + shippingCost - discountCost - volumeDiscount);


  const handleOrder = async () => {
    if (displayTotal < 5000) { setShowMinOrder(true); return; }
    if (!selectedAddressId) { setOrderError('Пожалуйста, выберите адрес доставки.'); return; }
    if (!token) return;
    setIsOrdering(true); setOrderError(null);
    try {
      const r = await createMobileOrder(token, {
        address_id: parseInt(selectedAddressId, 10),
        items: validItems.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
        coupon_code: appliedCoupon, gift_code: appliedGift, strah, comment,
        idempotency_key: idempKey.current,
      });
      if (r.ok) {
        const saved = [...validItems];
        clearCart();
        if (refreshSession) refreshSession();
        showLocalNotification(
          r.paid ? `Заказ #${r.order_id} создан и оплачен` : `Заказ #${r.order_id} создан`,
          r.paid ? 'Ваш заказ принят в обработку.' : 'Ожидает оплаты.',
          { orderId: String(r.order_id) }
        );
        onOrderCreated?.(r.order_id);
        setPendingSuccess({ orderId: r.order_id, managerLink: r.manager_link, isPaid: r.paid, totalAmount: displayTotal, items: saved });
        setShowLoader(true);
      } else if (r.error === 'INSUFFICIENT_BALANCE') {
        const sf = r.shortfall ?? 0;
        const rounded = Math.ceil(sf / 100) * 100;
        const email = customer?.email || '';
        const msg = email ? `Здравствуйте, хочу пополнить баланс:\n${email}\n${rounded}` : `Здравствуйте, хочу пополнить баланс:\n${rounded}`;
        setBalanceError({ shortfall: sf, topupLink: `https://telegram.me/danabol_pay?text=${encodeURIComponent(msg)}` });
      } else {
        setOrderError(r.error ?? 'Ошибка при оформлении заказа');
      }
    } catch { setOrderError('Не удалось оформить заказ. Попробуйте снова.'); }
    finally { setIsOrdering(false); }
  };


  if (successData) {
    return (
      <OrderSuccessScreen
        data={successData}
        balance={customer?.balance !== undefined ? customer.balance : 73878.1}
        onClose={() => {
          setSuccessData(null);
          if (onGoHome) {
            onGoHome();
          } else {
            onBack();
          }
        }}
        onTopUp={() => {
          const curBal = customer?.balance !== undefined ? customer.balance : 73878.1;
          const sf = Math.max(0, successData.totalAmount - curBal);
          const rounded = Math.ceil(sf / 100) * 100;
          const email = customer?.email || '';
          const msg = email ? `Здравствуйте, хочу пополнить баланс:\n${email}\n${rounded}` : `Здравствуйте, хочу пополнить баланс:\n${rounded}`;
          Linking.openURL(`https://telegram.me/danabol_pay?text=${encodeURIComponent(msg)}`);
        }}
      />
    );
  }

  if (showAddressForm) {
    return (
      <AddressFormPage
        token={token || ''}
        onSaved={(addr) => { setAddresses((p) => [addr, ...p]); setSelectedAddressId(addr.id); setShowAddressForm(false); }}
        onCancel={() => setShowAddressForm(false)}
      />
    );
  }

  const displayedAddresses = showAllAddresses ? addresses : addresses.slice(0, 5);


  return (
    <View style={s.container}>

      <Modal visible={showLoader} transparent animationType="fade">
        <OrderProcessingLoader
          onFinish={() => { setShowLoader(false); if (pendingSuccess) { setSuccessData(pendingSuccess); setPendingSuccess(null); } }}
        />
      </Modal>

      <Modal visible={!!balanceError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.balanceModal}>
            <View style={s.balanceIconWrap}>
              <AlertCircleIcon size={44} color="#ef4444" strokeWidth={1.5} />
            </View>
            <Text style={s.balanceTitle}>Недостаточно средств</Text>
            <Text style={s.balanceDesc}>
              Не хватает <Text style={s.balanceDescBold}>{formatPrice(balanceError?.shortfall ?? 0)}</Text> для оплаты заказа. Пополните баланс, чтобы продолжить.
            </Text>
            <TouchableOpacity style={s.balanceTopupBtn} onPress={() => { if (balanceError?.topupLink) Linking.openURL(balanceError.topupLink); }} activeOpacity={0.85}>
              <ExternalLinkIcon size={16} color="#ffffff" strokeWidth={2} />
              <Text style={s.balanceTopupBtnTxt}>Пополнить баланс</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.balanceCloseBtn} onPress={() => { setBalanceError(null); (onGoHome ?? onBack)(); }} activeOpacity={0.7}>
              <Text style={s.balanceCloseTxt}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Modal visible={showMinOrder} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.minOrderModal}>
            <TouchableOpacity style={s.minOrderCloseBtn} onPress={() => setShowMinOrder(false)} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: '#0f172a' }}>✕</Text>
            </TouchableOpacity>
            <View style={s.minOrderIconWrap}><Text style={{ fontSize: 38 }}>🛍️</Text></View>
            <Text style={s.minOrderTitle}>Почти готово!</Text>
            <View style={s.minOrderTitleBar} />
            <Text style={s.minOrderDesc}>
              Минимальная сумма для заказа —{' '}<Text style={s.minOrderDescBold}>5&nbsp;000&nbsp;₽.</Text>
            </Text>
            <Text style={s.minOrderSub}>Добавьте ещё немного товаров, чтобы оформить доставку.</Text>
            <TouchableOpacity style={s.minOrderGoBtn} onPress={() => { setShowMinOrder(false); (onGoHome ?? onBack)(); }} activeOpacity={0.85}>
              <Text style={s.minOrderGoBtnTxt}>Перейти к покупкам</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>


        <View style={s.pageHeader}>
          <Text style={s.checkoutTitle}>Оформление заказа</Text>
        </View>


        {validItems.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Товары в заказе ({validItems.length + (quote?.data?.gift_products?.length || 0)})
            </Text>
            <View style={s.itemsGrid}>
              {validItems.map(({ product, quantity }) => {
                const quoteLine = quote?.data?.lines?.find((line) => line.product_id === product.id);
                const originalTotal = quoteLine?.total ?? product.price * quantity;
                const discountedTotal = quoteLine?.discounted_total ?? originalTotal;
                const hasLineDiscount = discountedTotal < originalTotal;
                return <TouchableOpacity
                  key={product.id}
                  style={s.itemCard}
                  onPress={() => onProductClick?.(product)}
                  activeOpacity={onProductClick ? 0.75 : 1}
                >
                  <View style={s.itemImgWrap}>
                    {product.avatar
                      ? <Image source={{ uri: product.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
                      : <View style={s.itemNoImage} />}
                  </View>
                  <View style={s.itemCardBody}>
                    <Text style={s.itemCardName} numberOfLines={2}>{product.name}</Text>
                    <View style={s.itemCardPriceRow}>
                      <Text style={s.itemCardQty} numberOfLines={1}>{quantity} шт.</Text>
                      <View style={s.itemCardPrices}>
                        <Text style={[s.itemCardPrice, (product.isPromo || hasLineDiscount) && s.itemCardPricePromo]} numberOfLines={1}>
                          {formatPrice(discountedTotal)}
                        </Text>
                        {hasLineDiscount && <Text style={s.itemCardOldPrice} numberOfLines={1}>{formatPrice(originalTotal)}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>;
              })}

              {quote?.data?.gift_products?.map((gift) => (
                <View key={`gift-${gift.product_id}`} style={[s.itemCard, s.itemCardGift]}>
                  <View style={s.itemImgWrap}>
                    {gift.thumb
                      ? <Image source={{ uri: gift.thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      : <View style={s.itemNoImage} />}
                    <View style={s.giftBadgeAbs}><Text style={s.giftBadgeAbsText}>Подарок</Text></View>
                  </View>
                  <View style={s.itemCardBody}>
                    <Text style={s.itemCardName} numberOfLines={2}>{gift.name}</Text>
                    <View style={s.itemCardPriceRow}>
                      <Text style={s.itemCardQty} numberOfLines={1}>{gift.quantity} шт.</Text>
                      <Text style={[s.itemCardPrice, s.itemCardPriceGift]} numberOfLines={1}>0 ₽</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}


        <View style={s.section}>
          <Text style={s.sectionTitle}>Адрес доставки</Text>
          {loadingAddresses ? (
            <View style={[s.dropdown, s.dropdownSkeleton]}>
              <View style={s.dropdownTrigger}>
                <View style={s.dropdownTriggerLeft}>
                  <Animated.View style={[s.skeletonIcon, { opacity: pulseAnim }]} />
                  <Animated.View style={[s.skeletonAddressText, { opacity: pulseAnim }]} />
                </View>
                <Animated.View style={[s.skeletonChevron, { opacity: pulseAnim }]} />
              </View>
            </View>
          ) : (
            <View style={s.dropdown}>
              <TouchableOpacity style={s.dropdownTrigger} onPress={() => setIsAddressOpen(!isAddressOpen)} activeOpacity={0.8}>
                <View style={s.dropdownTriggerLeft}>
                  <MapPinIcon size={20} color="#8ec0ed" strokeWidth={2} />
                  <Text style={[s.dropdownSelectedTxt, !selectedAddressId && s.dropdownPlaceholderTxt]} numberOfLines={2}>
                    {selectedAddressId
                      ? addresses.find((a) => a.id === selectedAddressId)?.address || 'Адрес выбран'
                      : 'Выберите адрес'}
                  </Text>
                </View>
                <ChevronDownIcon size={18} color="#94a3b8" strokeWidth={2} rotate={isAddressOpen ? '180deg' : '0deg'} />
              </TouchableOpacity>

              {isAddressOpen && (
                <View style={s.dropdownBody}>

                  <TouchableOpacity
                    style={s.createAddressBtn}
                    onPress={() => {
                      setIsAddressOpen(false);
                      if (onGoToAddresses) {
                        onGoToAddresses();
                      } else {
                        setShowAddressForm(true);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <PlusIcon size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={s.createAddressBtnTxt}>Создать адрес</Text>
                  </TouchableOpacity>

                  {addresses.length === 0 && (
                    <Text style={s.emptyAddressTxt}>У вас нет сохранённых адресов. Создайте новый выше.</Text>
                  )}

                  {displayedAddresses.map((addr) => {
                    const sel = addr.id === selectedAddressId;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[s.addressItem, sel && s.addressItemActive]}
                        onPress={() => { setSelectedAddressId(addr.id); setIsAddressOpen(false); }}
                        activeOpacity={0.75}
                      >
                        <View style={[s.addressRadio, sel && s.addressRadioActive]}>
                          {sel && <CheckIcon size={12} color="#ffffff" strokeWidth={3} />}
                        </View>
                        <Text style={[s.addressItemTxt, sel && s.addressItemTxtActive]} numberOfLines={2}>{addr.address}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {addresses.length > 5 && (
                    <TouchableOpacity style={s.addressItem} onPress={() => setShowAllAddresses(!showAllAddresses)} activeOpacity={0.7}>
                      <Text style={s.addressItemTxt}>{showAllAddresses ? 'Скрыть' : `Показать все (+${addresses.length - 5})`}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>


        {validItems.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Итог</Text>


            <View style={s.promoInputsWrap}>

              <View style={s.promoBlock}>
                {appliedCoupon && quote?.data?.coupon_valid !== false ? (
                  <View style={s.promoAppliedRow}>
                    <View style={s.promoAppliedLeft}>
                      <TagIcon size={14} color="#16a34a" strokeWidth={2} />
                      <Text style={s.promoAppliedCode}>{appliedCoupon}</Text>
                    </View>
                    <TouchableOpacity style={s.promoRemoveBtn} onPress={() => { setAppliedCoupon(''); setCouponInput(''); }} activeOpacity={0.7}>
                      <CloseIcon size={13} color="#16a34a" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[
                    s.promoInputRow,
                    appliedCoupon && quote?.data?.coupon_valid === false && s.promoInputRowError,
                  ]}>
                    <TagIcon size={14} color="#94a3b8" strokeWidth={2} style={s.promoTagIcon} />
                    <TextInput
                      style={s.promoTextInput}
                      underlineColorAndroid="transparent"
                      placeholder="Промокод"
                      placeholderTextColor="#b0b8c4"
                      value={couponInput}
                      onChangeText={(t) => { setCouponInput(t); if (appliedCoupon && quote?.data?.coupon_valid === false) setAppliedCoupon(''); }}
                      returnKeyType="done"
                      onSubmitEditing={() => setAppliedCoupon(couponInput.trim())}
                    />
                    <TouchableOpacity style={s.promoSubmitBtn} onPress={() => setAppliedCoupon(couponInput.trim())} disabled={!couponInput.trim()} activeOpacity={0.8}>
                      <CheckIcon size={15} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
                {appliedCoupon && quote?.data?.coupon_valid === false && (
                  <Text style={s.promoErrorTxt}>{quote?.data?.coupon_error || 'Неверный купон'}</Text>
                )}
              </View>


              <View style={s.promoBlock}>
                {appliedGift && quote?.data?.gift_valid !== false ? (
                  <View style={s.promoAppliedRow}>
                    <View style={s.promoAppliedLeft}>
                      <TagIcon size={14} color="#16a34a" strokeWidth={2} />
                      <Text style={[s.promoAppliedCode, s.promoAppliedCodeGift]}>{appliedGift}</Text>
                    </View>
                    <TouchableOpacity style={s.promoRemoveBtn} onPress={() => { setAppliedGift(''); setGiftInput(''); }} activeOpacity={0.7}>
                      <CloseIcon size={13} color="#16a34a" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[
                    s.promoInputRow,
                    appliedGift && quote?.data?.gift_valid === false && s.promoInputRowError,
                  ]}>
                    <TagIcon size={14} color="#94a3b8" strokeWidth={2} style={s.promoTagIcon} />
                    <TextInput
                      style={s.promoTextInput}
                      underlineColorAndroid="transparent"
                      placeholder="Подарочный код"
                      placeholderTextColor="#b0b8c4"
                      value={giftInput}
                      onChangeText={(t) => { setGiftInput(t); if (appliedGift && quote?.data?.gift_valid === false) setAppliedGift(''); }}
                      returnKeyType="done"
                      onSubmitEditing={() => setAppliedGift(giftInput.trim())}
                    />
                    <TouchableOpacity style={s.promoSubmitBtn} onPress={() => setAppliedGift(giftInput.trim())} disabled={!giftInput.trim()} activeOpacity={0.8}>
                      <CheckIcon size={15} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
                {appliedGift && quote?.data?.gift_valid === false && (
                  <Text style={s.promoErrorTxt}>{quote?.data?.gift_error || 'Неверный подарочный код'}</Text>
                )}
              </View>
            </View>


            <View style={s.summaryDivider} />

            {quoteError ? (
              <View style={s.quoteErrorBox}>
                <Text style={s.quoteErrorTxt}>⚠️ {quoteError}</Text>
              </View>
            ) : quote ? (
              <View style={quoteLoading ? s.summaryDetailsLoading : undefined}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Сумма</Text>
                  <Text style={s.summaryValue}>{formatPrice(Math.round(cartSubTotal))}</Text>
                </View>

                {discountCost > 0 && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Купон ({appliedCoupon})</Text>
                    <Text style={[s.summaryValue, s.summaryValueGreen]}>−{formatPrice(Math.round(discountCost))}</Text>
                  </View>
                )}

                {quote.data.volume_discount !== undefined && quote.data.volume_discount > 0 && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Скидка ({quote.data.volume_discount_percent}%)</Text>
                    <Text style={[s.summaryValue, s.summaryValueGreen]}>−{formatPrice(Math.round(quote.data.volume_discount))}</Text>
                  </View>
                )}

                {quote.data.gift_products && quote.data.gift_products.length > 0 && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Подарки по коду</Text>
                    <Text style={[s.summaryValue, s.summaryValueGreen]}>Бесплатно ({quote.data.gift_products.length} шт)</Text>
                  </View>
                )}

                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Почта России</Text>
                  <Text style={s.summaryValue}>{formatPrice(shippingCost)}</Text>
                </View>

                <View style={s.summaryRow}>
                  <View style={s.summaryLabelFlex}>
                    <Text style={s.summaryLabel}>Страховка (3%)</Text>
                    <InsuranceToggle value={strah} onValueChange={setStrah} />
                  </View>
                  <Text style={s.summaryValue}>{formatPrice(insuranceCost)}</Text>
                </View>

                <View style={s.summaryTotal}>
                  <Text style={s.summaryTotalLabel}>Итого к оплате</Text>
                  <Text style={s.summaryTotalValue}>{formatPrice(displayTotal)}</Text>
                </View>
              </View>
            ) : quoteLoading ? (
              <View style={s.summarySkeletonContainer}>
                <View style={s.summaryRow}>
                  <Animated.View style={[s.skeletonTextLabel, { width: 65, opacity: pulseAnim }]} />
                  <Animated.View style={[s.skeletonTextValue, { width: 80, opacity: pulseAnim }]} />
                </View>
                <View style={s.summaryRow}>
                  <Animated.View style={[s.skeletonTextLabel, { width: 105, opacity: pulseAnim }]} />
                  <Animated.View style={[s.skeletonTextValue, { width: 60, opacity: pulseAnim }]} />
                </View>
                <View style={s.summaryRow}>
                  <View style={s.summaryLabelFlex}>
                    <Animated.View style={[s.skeletonTextLabel, { width: 95, opacity: pulseAnim }]} />
                    <Animated.View style={[s.skeletonSwitch, { opacity: pulseAnim }]} />
                  </View>
                  <Animated.View style={[s.skeletonTextValue, { width: 55, opacity: pulseAnim }]} />
                </View>
                <View style={s.summaryTotal}>
                  <Animated.View style={[s.skeletonTextLabel, { width: 120, height: 18, opacity: pulseAnim }]} />
                  <Animated.View style={[s.skeletonTextValue, { width: 100, height: 22, opacity: pulseAnim }]} />
                </View>
              </View>
            ) : null}
          </View>
        )}

        {orderError ? (
          <View style={[s.section, s.orderErrorBox]}>
            <Text style={s.orderErrorTxt}>⚠️ {orderError}</Text>
          </View>
        ) : null}


        <TouchableOpacity
          style={[s.orderBtn, (isOrdering || quoteLoading || !quote) && s.orderBtnDisabled]}
          onPress={handleOrder}
          disabled={isOrdering || quoteLoading || !quote}
          activeOpacity={0.85}
        >
          {isOrdering
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={s.orderBtnTxt}>Оформить заказ</Text>}
        </TouchableOpacity>


        <TouchableOpacity
          style={[s.orderBtn, { backgroundColor: '#3b82f6', marginTop: 10, shadowColor: '#3b82f6' }]}
          onPress={() => {
            const demoTotal = displayTotal || 74918;
            const curBalance = customer?.balance ?? 73878.1;
            const isOrderPaid = curBalance >= demoTotal;
            const demoItems = validItems.length > 0 ? [...validItems] : [
              {
                product: {
                  id: 9991,
                  name: 'ANAPOLON 50 CANADA 10ml|50mg Ампулы',
                  price: 3290,
                  avatar: 'https://danabol.life/image/cache/catalog/canada/anapolon-500x500.png',
                } as Product,
                quantity: 27,
              },
            ];

            setPendingSuccess({
              orderId: 294740,
              managerLink: 'https://telegram.me/danabol_support',
              isPaid: isOrderPaid,
              totalAmount: demoTotal,
              items: demoItems,
            });
            setShowLoader(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={s.orderBtnTxt}>Тест анимации заказа (Demo)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};
