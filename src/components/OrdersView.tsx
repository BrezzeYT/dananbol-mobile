import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PackageIcon,
  TruckIcon,
  XCircleIcon,
} from './icons';
import { CatalogPagination } from './CatalogPagination';
import {
  fetchMobileOrders,
  fetchMobileOrderDetails,
  payMobileOrder,
} from '../api/orders';
import { useAuthContext } from '../context/useAuthContext';
import { ordersStyles as s } from '../styles/OrdersView.styles';
import type { Order, OrderDetails } from '../types/orders';

function formatPrice(val: number): string {
  return `${val.toLocaleString('ru-RU')} ₽`;
}

function formatOrderAddress(rawAddress: string): string {
  if (!rawAddress) return '';
  const clean = rawAddress
    .replace(/,\s*Российская Федерация\s*,/gi, ',')
    .replace(/^Российская Федерация,\s*/gi, '')
    .replace(/,\s*Российская Федерация$/gi, '')
    .replace(/,\s*Россия\s*,/gi, ',')
    .replace(/^Россия,\s*/gi, '')
    .replace(/,\s*Россия$/gi, '');
  return clean
    .replace(/,\s*,/g, ',')
    .trim()
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '');
}

function getStatusClass(status: string): string {
  const st = (status || '').toLowerCase();
  if (
    st.includes('доставлен') ||
    st.includes('отправлен') ||
    st.includes('завершен')
  ) {
    return 'complete';
  }
  if (st.includes('оплачен')) return 'processing';
  if (st.includes('на отправке')) return 'shipped';
  if (st.includes('отменен') || st.includes('истек') || st.includes('возврат')) {
    return 'canceled';
  }
  if (st.includes('ожида')) return 'pending';
  if (st.includes('в обработке') || st.includes('обработка')) return 'processing';
  return 'default';
}

function StatusIcon({ statusClass, size = 24 }: { statusClass: string; size?: number }) {
  switch (statusClass) {
    case 'complete':
      return <CheckCircleIcon size={size} color="#22c55e" />;
    case 'pending':
      return <ClockIcon size={size} color="#3b82f6" />;
    case 'processing':
      return <PackageIcon size={size} color="#22c55e" />;
    case 'shipped':
      return <TruckIcon size={size} color="#22c55e" />;
    case 'canceled':
      return <XCircleIcon size={size} color="#ef4444" />;
    default:
      return <ClockIcon size={size} color="#64748b" />;
  }
}

interface OrdersViewProps {
  onBack?: () => void;
  initialOrderId?: string | null;
  onOpenSupport?: (message: string) => void;
}

let cachedOrders: Order[] = [];

export const OrdersView: React.FC<OrdersViewProps> = ({
  onBack,
  initialOrderId = null,
  onOpenSupport,
}) => {
  const { token, customer, refreshSession } = useAuthContext();

  const [orders, setOrders] = useState<Order[]>(cachedOrders);
  const [isLoading, setIsLoading] = useState<boolean>(cachedOrders.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);


  useEffect(() => {
    if (!token) {
      setError('Не авторизован');
      setIsLoading(false);
      return;
    }

    if (cachedOrders.length === 0) {
      setIsLoading(true);
    }
    fetchMobileOrders(token)
      .then((res) => {
        if (res.ok && res.orders) {
          cachedOrders = res.orders;
          setOrders(res.orders);
        } else {
          setError(res.error || 'Ошибка загрузки заказов');
        }
      })
      .catch((err) => {
        setError(err.message || 'Ошибка сети');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);


  useEffect(() => {
    if (!selectedOrderId || !token) {
      setDetails(null);
      return;
    }

    setIsDetailsLoading(true);
    setDetailsError(null);
    setPayError(null);

    fetchMobileOrderDetails(token, selectedOrderId)
      .then((res) => {
        if (res.ok && res.details) {
          setDetails(res.details);
        } else {
          setDetailsError(res.error || 'Заказ не найден');
        }
      })
      .catch((err) => {
        setDetailsError(err.message || 'Ошибка сети');
      })
      .finally(() => {
        setIsDetailsLoading(false);
      });
  }, [selectedOrderId, token]);


  const handlePayFromBalance = async (orderId: number) => {
    if (!token) return;
    setIsPaying(true);
    setPayError(null);

    try {
      const res = await payMobileOrder(token, orderId);
      if (res.ok && res.paid) {
        await refreshSession();

        const updated = await fetchMobileOrderDetails(token, orderId);
        if (updated.ok && updated.details) {
          setDetails(updated.details);
        }
        const updatedList = await fetchMobileOrders(token);
        if (updatedList.ok && updatedList.orders) {
          setOrders(updatedList.orders);
        }
      } else {
        setPayError(res.error || 'Не удалось оплатить заказ');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при оплате';
      setPayError(msg);
    } finally {
      setIsPaying(false);
    }
  };


  const handlePayInTelegram = (orderTotal: number) => {
    const shortfall = orderTotal - (customer?.balance || 0);
    const roundedShortfall = Math.ceil(shortfall / 100) * 100;
    const email = customer?.email || '';
    const messageText = email
      ? `Здравствуйте, хочу пополнить баланс:\n${email}\n${roundedShortfall}`
      : `Здравствуйте, хочу пополнить баланс:\n${roundedShortfall}`;
    const link = `https://telegram.me/danabol_pay?text=${encodeURIComponent(messageText)}`;
    Linking.openURL(link).catch(() => { });
  };

  if (selectedOrderId) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subHeader}>
          <Text style={s.sectionTitle}>Заказ #{selectedOrderId}</Text>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setSelectedOrderId(null)}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
            <Text style={s.backBtnText}>Назад</Text>
          </TouchableOpacity>
        </View>

        {detailsError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{detailsError}</Text>
          </View>
        )}

        {isDetailsLoading && (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color="#8ec0ed" />
            <Text style={s.loadingText}>Загрузка деталей заказа...</Text>
          </View>
        )}

        {!isDetailsLoading && details && (
          <View style={s.detailsContent}>

            <View style={s.detailsStatusRow}>
              <View
                style={[
                  s.statusBadge,
                  getStatusClass(details.status) === 'complete' && s.iconBgComplete,
                  getStatusClass(details.status) === 'pending' && s.iconBgPending,
                  getStatusClass(details.status) === 'processing' && s.iconBgProcessing,
                  getStatusClass(details.status) === 'canceled' && s.iconBgCanceled,
                ]}
              >
                <Text
                  style={[
                    s.statusText,
                    getStatusClass(details.status) === 'complete' && s.statusComplete,
                    getStatusClass(details.status) === 'pending' && s.statusPending,
                    getStatusClass(details.status) === 'processing' && s.statusProcessing,
                    getStatusClass(details.status) === 'canceled' && s.statusCanceled,
                  ]}
                >
                  Статус: {details.status}
                </Text>
              </View>
            </View>


            <View style={s.detailsBlock}>
              <Text style={s.blockTitle}>Товары</Text>
              <View style={s.productsList}>
                {details.products.map((p, idx) => (
                  <View key={`prod_${idx}`} style={s.productItem}>
                    <View style={s.productImgBox}>
                      {p.avatar ? (
                        <Image
                          source={{ uri: p.avatar }}
                          style={s.productImg}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={s.productImg} />
                      )}
                    </View>
                    <View style={s.productBody}>
                      <View style={s.productInfoRow}>
                        <Text style={s.productName} numberOfLines={2}>
                          {p.name}
                        </Text>
                        <Text style={s.productPrice}>{p.price} / шт.</Text>
                      </View>
                      <View style={s.productAmountRow}>
                        <Text style={s.productQty}>{p.quantity} шт.</Text>
                        <Text style={s.productTotal}>{p.total}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.detailsBlock}>
              <Text style={s.blockTitle}>Адрес доставки</Text>
              <View style={s.addressBox}>
                <Text style={s.addressLine}>
                  <Text style={s.addressLabel}>Получатель: </Text>
                  {details.recipient || '—'}
                </Text>
                <Text style={s.addressLine}>
                  <Text style={s.addressLabel}>Адрес: </Text>
                  {formatOrderAddress(details.address) || '—'}
                </Text>
              </View>
            </View>


            <View style={s.detailsBlock}>
              {details.totals.map((t, idx) => {
                const isTotal = t.title.toLowerCase().includes('итого');
                return (
                  <View
                    key={`total_${idx}`}
                    style={[s.totalLine, isTotal && s.totalLineFinal]}
                  >
                    <Text style={[s.totalTitle, isTotal && s.totalTitleFinal]}>
                      {t.title}
                    </Text>
                    <Text style={[s.totalVal, isTotal && s.totalValFinal]}>
                      {t.value}
                    </Text>
                  </View>
                );
              })}
            </View>

            {details.histories && details.histories.length > 0 && (
              <View style={s.detailsBlock}>
                <Text style={s.blockTitle}>История статусов</Text>
                <View style={s.timeline}>
                  {details.histories.map((h, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === (details.histories?.length ?? 1) - 1;
                    const stLower = h.status.toLowerCase();
                    const isRed =
                      stLower.includes('отменен') ||
                      stLower.includes('возврат') ||
                      stLower.includes('cancel');
                    const isGreen =
                      stLower.includes('отправлен') ||
                      stLower.includes('завершен') ||
                      stLower.includes('complete') ||
                      stLower.includes('shipped');

                    return (
                      <View key={`hist_${idx}`} style={s.timelineItem}>
                        <View style={s.timelineIndicatorBox}>
                          <View
                            style={[
                              s.timelineIndicator,
                              isFirst && isGreen && s.timelineIndicatorActiveGreen,
                              isFirst && isRed && s.timelineIndicatorActiveRed,
                              isFirst && !isGreen && !isRed && s.timelineIndicatorActiveBlue,
                            ]}
                          >
                            <View
                              style={[
                                s.timelineDot,
                                isFirst && isGreen && s.timelineDotGreen,
                                isFirst && isRed && s.timelineDotRed,
                                isFirst && !isGreen && !isRed && s.timelineDotBlue,
                              ]}
                            />
                          </View>
                          {!isLast && <View style={s.timelineLine} />}
                        </View>
                        <View style={s.timelineContent}>
                          <Text style={s.timelineStatus}>{h.status}</Text>
                          <Text style={s.timelineDate}>
                            {h.date_added.replace(/\./g, '-').replace(' ', ' | ')}
                          </Text>
                          {h.comment &&
                            h.comment !== 'Оплачено с баланса через TG App' &&
                            !h.comment.startsWith('Ожидает оплаты') ? (
                            <Text style={s.timelineComment}>{h.comment}</Text>
                          ) : h.description ? (
                            <Text style={s.timelineComment}>{h.description}</Text>
                          ) : (
                            <Text style={s.timelineComment}>
                              {stLower.includes('ожида')
                                ? 'Ваш заказ сформирован, товары зарезервированы на 48 часов'
                                : stLower.includes('оплач')
                                  ? 'Ваш заказ оплачен и находится в очереди на сборку, скоро Бригадир приступит к формированию посылки'
                                  : 'Статус заказа обновлен'}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}


            {getStatusClass(details.status) === 'pending' && (
              <View style={s.detailsBlock}>
                <Text style={s.blockTitle}>Оплата заказа</Text>
                <View style={s.payCard}>
                  <View style={s.payCardMain}>
                    <Text style={s.payCardLabel}>Мой баланс</Text>
                    <Text style={s.payCardValue}>
                      {formatPrice(customer?.balance || 0)}
                    </Text>
                  </View>
                  {(!customer || customer.balance < (details.total_numeric || 0)) && (
                    <View style={s.payCardFooter}>
                      <Text style={s.payFooterTxt}>
                        Недостаточно средств. Нужно пополнить на
                      </Text>
                      <Text style={s.payFooterVal}>
                        {formatPrice(
                          (details.total_numeric || 0) - (customer?.balance || 0)
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                {customer && customer.balance >= (details.total_numeric || 0) ? (
                  <>
                    <Text style={s.payInfoText}>
                      С вашего баланса будет списано{' '}
                      <Text style={s.payInfoTextBold}>
                        {formatPrice(details.total_numeric || 0)}
                      </Text>
                    </Text>
                    {payError && (
                      <Text style={[s.errorText, { marginBottom: 10 }]}>
                        {payError}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={s.btnPayOrder}
                      onPress={() => handlePayFromBalance(details.order_id)}
                      disabled={isPaying}
                      activeOpacity={0.8}
                    >
                      {isPaying ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={s.btnPayOrderText}>Оплатить заказ</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={s.btnPayTg}
                    onPress={() => handlePayInTelegram(details.total_numeric || 0)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.btnPayTgText}>Оплатить в Telegram</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={s.supportArea}>
              <View style={s.supportMsgBox}>
                <Text style={s.supportMsgText}>
                  Если у вас возник вопрос по заказу — нажмите кнопку ниже, и мы
                  перенаправим вас в поддержку
                </Text>
              </View>
              <TouchableOpacity
                style={s.btnSupport}
                onPress={() => {
                  const message = `Здравствуйте! У меня вопрос по заказу №${details.order_id}. `;
                  if (onOpenSupport) {
                    onOpenSupport(message);
                  } else {
                    const link = `https://telegram.me/danabol_support?text=${encodeURIComponent(message)}`;
                    Linking.openURL(link).catch(() => { });
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={s.btnSupportText}>Задать вопрос по заказу</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const visibleOrders = orders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subHeader}>
        <Text style={s.sectionTitle}>Ваши заказы</Text>
        {onBack && (
          <TouchableOpacity
            style={s.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
            <Text style={s.backBtnText}>Назад</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#8ec0ed" />
          <Text style={s.loadingText}>Загрузка заказов...</Text>
        </View>
      ) : orders.length === 0 && !error ? (
        <View style={s.centerBox}>
          <Text style={s.emptyText}>Вы еще не совершали покупок</Text>
        </View>
      ) : (
        <View style={s.list}>
          <View
            style={[
              s.ordersContainer,
              totalPages > 1 && s.ordersContainerPaged,
            ]}
          >
            {visibleOrders.map((order) => {
              const statusClass = getStatusClass(order.status);
              return (
                <TouchableOpacity
                  key={`order_${currentPage}_${order.order_id}`}
                  style={s.orderCard}
                  onPress={() => setSelectedOrderId(order.order_id)}
                  activeOpacity={0.7}
                >
                  <View style={s.orderCardLeft}>
                    <View
                      style={[
                        s.orderIconBox,
                        statusClass === 'complete' && s.iconBgComplete,
                        statusClass === 'pending' && s.iconBgPending,
                        statusClass === 'processing' && s.iconBgProcessing,
                        statusClass === 'shipped' && s.iconBgShipped,
                        statusClass === 'canceled' && s.iconBgCanceled,
                        statusClass === 'default' && s.iconBgDefault,
                      ]}
                    >
                      <StatusIcon statusClass={statusClass} size={22} />
                    </View>
                    <View style={s.orderCardText}>
                      <Text style={s.orderCardTitle}>
                        Заказ #{order.order_id}
                      </Text>
                      <Text
                        style={[
                          s.statusText,
                          statusClass === 'complete' && s.statusComplete,
                          statusClass === 'pending' && s.statusPending,
                          statusClass === 'processing' && s.statusProcessing,
                          statusClass === 'shipped' && s.statusShipped,
                          statusClass === 'canceled' && s.statusCanceled,
                          statusClass === 'default' && s.statusDefault,
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <View style={s.orderCardRight}>
                    <View style={s.orderCardRightContent}>
                      <Text style={s.orderCardTotal}>{order.total}</Text>
                      <Text style={s.orderCardDate}>{order.date_added}</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {totalPages > 1 && (
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

