import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useAuthContext } from '../context/useAuthContext';
import { OrdersView } from './OrdersView';
import { AddressesView } from './AddressesView';
import { TransactionsView } from './TransactionsView';
import { fetchMobileOrders } from '../api/orders';
import type { Order } from '../types/orders';
import { profileStyles as s } from '../styles/ProfileView.styles';
import { UserIcon } from './icons';
import Svg, { Path, Circle } from 'react-native-svg';

const ShoppingBagIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#8ec0ed',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#8ec0ed',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ReceiptIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#8ec0ed',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <Path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <Path d="M12 17.5v-11" />
  </Svg>
);

const PlusIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#ffffff',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14" />
    <Path d="M12 5v14" />
  </Svg>
);

const LogOutIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#ef4444',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="m16 17 5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
);

interface ProfileViewProps {
  onAfterLogout?: () => void;
  onBalanceClick?: () => void;
  onAddressesClick?: () => void;
  onTransactionsClick?: () => void;
  initialOrderId?: string | null;
  initialSubView?: 'main' | 'orders' | 'addresses' | 'transactions';
  initialShowAddAddressForm?: boolean;
  onOpenSupport?: (message: string) => void;
}

function formatBalance(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function getStatusStyle(status: string) {
  const st = (status || '').toLowerCase();
  if (st.includes('доставлен') || st.includes('отправлен') || st.includes('завершен') || st.includes('оплачен') || st.includes('на отправке')) {
    return {
      bg: 'rgba(34, 197, 94, 0.12)',
      color: '#22c55e',
    };
  }
  if (st.includes('ожида') || st.includes('в обработке')) {
    return {
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#3b82f6',
    };
  }
  if (st.includes('отменен') || st.includes('истек') || st.includes('возврат')) {
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#ef4444',
    };
  }
  return {
    bg: 'rgba(142, 192, 237, 0.15)',
    color: '#2d4e6a',
  };
}

const LatestOrderSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={s.latestOrderSection}>
      <Text style={s.sectionSubtitle}>Крайний заказ</Text>
      <View style={s.latestOrderCard}>
        <View style={s.latestOrderHeader}>
          <Animated.View style={[s.skeletonOrderId, { opacity: pulseAnim }]} />
          <Animated.View style={[s.skeletonBadge, { opacity: pulseAnim }]} />
        </View>
        <View style={s.latestOrderBody}>
          <Animated.View style={[s.skeletonDate, { opacity: pulseAnim }]} />
          <Animated.View style={[s.skeletonTotal, { opacity: pulseAnim }]} />
        </View>
      </View>
    </View>
  );
};

let cachedLatestOrder: Order | null = null;
let hasLoadedLatestOrderOnce = false;

export const ProfileView: React.FC<ProfileViewProps> = ({
  onAfterLogout,
  onBalanceClick,
  onAddressesClick,
  onTransactionsClick,
  initialOrderId = null,
  initialSubView = 'main',
  initialShowAddAddressForm = false,
  onOpenSupport,
}) => {
  const { token, customer, logout, openAuth, isLoggedIn, refreshSession } = useAuthContext();
  const [activeSubView, setActiveSubView] = useState<'main' | 'orders' | 'addresses' | 'transactions'>(initialSubView);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [latestOrder, setLatestOrder] = useState<Order | null>(cachedLatestOrder);
  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(!hasLoadedLatestOrderOnce);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn && refreshSession) {
      refreshSession();
    }
  }, [isLoggedIn, refreshSession]);

  const handlePullRefresh = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshSession ? refreshSession() : Promise.resolve(),
        fetchMobileOrders(token)
          .then((res) => {
            if (res.ok && res.orders && res.orders.length > 0) {
              cachedLatestOrder = res.orders[0];
              setLatestOrder(res.orders[0]);
            }
          })
          .catch(() => {}),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
      setActiveSubView('orders');
    } else if (initialSubView && initialSubView !== 'main') {
      setActiveSubView(initialSubView);
    }
  }, [initialOrderId, initialSubView]);


  useEffect(() => {
    if (!token || !isLoggedIn) {
      cachedLatestOrder = null;
      hasLoadedLatestOrderOnce = false;
      setLatestOrder(null);
      setIsOrderLoading(false);
      return;
    }

    if (!hasLoadedLatestOrderOnce) {
      setIsOrderLoading(true);
    }

    fetchMobileOrders(token)
      .then((res) => {
        hasLoadedLatestOrderOnce = true;
        if (res.ok && res.orders && res.orders.length > 0) {
          cachedLatestOrder = res.orders[0];
          setLatestOrder(res.orders[0]);
        } else {
          cachedLatestOrder = null;
          setLatestOrder(null);
        }
      })
      .catch(() => {
        hasLoadedLatestOrderOnce = true;
        cachedLatestOrder = null;
        setLatestOrder(null);
      })
      .finally(() => {
        setIsOrderLoading(false);
      });
  }, [token, isLoggedIn]);

  if (!isLoggedIn || !customer) {
    return (
      <View style={s.notLoggedIn}>
        <View style={s.notLoggedInIcon}>
          <UserIcon size={38} color="#8ec0ed" strokeWidth={2.2} />
        </View>
        <Text style={s.notLoggedInTitle}>Вы не вошли в аккаунт</Text>
        <Text style={s.notLoggedInSub}>
          Войдите, чтобы увидеть баланс, заказы и историю
        </Text>
        <TouchableOpacity
          style={s.loginBtn}
          onPress={openAuth}
          activeOpacity={0.85}
        >
          <Text style={s.loginBtnText}>Войти</Text>
        </TouchableOpacity>
      </View>
    );
  }


  if (activeSubView === 'orders') {
    return (
      <View style={s.container}>
        <OrdersView
          initialOrderId={selectedOrderId}
          onBack={() => {
            setSelectedOrderId(null);
            setActiveSubView('main');
          }}
          onOpenSupport={onOpenSupport}
        />
      </View>
    );
  }

  if (activeSubView === 'addresses') {
    return (
      <View style={s.container}>
        <AddressesView
          initialShowAddForm={initialShowAddAddressForm}
          onBack={() => {
            setActiveSubView('main');
          }}
        />
      </View>
    );
  }

  if (activeSubView === 'transactions') {
    return (
      <View style={s.container}>
        <TransactionsView
          onBack={() => {
            setActiveSubView('main');
          }}
        />
      </View>
    );
  }

  const fullName = [customer.firstname, customer.lastname]
    .filter(Boolean)
    .join(' ');
  const displayName = fullName || customer.email || 'Клиент';

  const handleLogout = async () => {
    await logout();
    onAfterLogout?.();
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handlePullRefresh}
          tintColor="#8ec0ed"
          colors={['#8ec0ed']}
        />
      }
    >

      <View style={s.headerSection}>
        <Text style={s.titleText}>Кабинет</Text>
        <View style={s.statusBadge}>
          <Text style={s.statusBadgeText}>Покупатель</Text>
        </View>
      </View>


      <View style={s.panel}>
        <View style={s.panelInfo}>
          <Text style={s.panelName}>{displayName}</Text>
          {customer.telephone ? (
            <Text style={s.panelContact}>{customer.telephone}</Text>
          ) : null}
          {customer.email && customer.email !== displayName ? (
            <Text style={[s.panelContact, s.panelContactSub]}>
              {customer.email}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={s.balanceBox}
          activeOpacity={0.8}
          onPress={onBalanceClick}
        >
          <View style={s.balanceTextContainer}>
            <Text style={s.balanceLabel}>Ваш баланс</Text>
            <Text style={s.balanceValue}>
              {formatBalance(customer.balance || 0)}
            </Text>
          </View>
          <View style={s.topupBtn}>
            <PlusIcon size={14} color="#ffffff" />
            <Text style={s.topupBtnText}>Пополнить</Text>
          </View>
        </TouchableOpacity>
      </View>


      {isOrderLoading ? (
        <LatestOrderSkeleton />
      ) : latestOrder ? (
        <View style={s.latestOrderSection}>
          <Text style={s.sectionSubtitle}>Крайний заказ</Text>
          <TouchableOpacity
            style={s.latestOrderCard}
            activeOpacity={0.7}
            onPress={() => {
              setSelectedOrderId(latestOrder.order_id);
              setActiveSubView('orders');
            }}
          >
            <View style={s.latestOrderHeader}>
              <Text style={s.latestOrderId}>Заказ №{latestOrder.order_id}</Text>
              <View
                style={[
                  s.latestOrderStatusBadge,
                  { backgroundColor: getStatusStyle(latestOrder.status).bg },
                ]}
              >
                <Text
                  style={[
                    s.latestOrderStatusText,
                    { color: getStatusStyle(latestOrder.status).color },
                  ]}
                >
                  {latestOrder.status}
                </Text>
              </View>
            </View>
            <View style={s.latestOrderBody}>
              <Text style={s.latestOrderDate}>
                Добавлен: {latestOrder.date_added}
              </Text>
              <Text style={s.latestOrderTotal}>{latestOrder.total}</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}


      <View style={s.menuSection}>
        <Text style={s.sectionSubtitle}>Действия</Text>
        <View style={s.profileGrid}>
          <TouchableOpacity
            style={s.actionCard}
            activeOpacity={0.7}
            onPress={() => {
              setSelectedOrderId(null);
              setActiveSubView('orders');
            }}
          >
            <View style={s.actionContent}>
              <View style={s.actionIcon}>
                <ShoppingBagIcon size={24} color="#8ec0ed" />
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionTitle}>Ваши заказы</Text>
                <Text style={s.actionSubtitle}>История покупок и их статусы</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionCard}
            activeOpacity={0.7}
            onPress={() => {
              if (onAddressesClick) {
                onAddressesClick();
              } else {
                setActiveSubView('addresses');
              }
            }}
          >
            <View style={s.actionContent}>
              <View style={s.actionIcon}>
                <MapPinIcon size={24} color="#8ec0ed" />
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionTitle}>Мои адреса</Text>
                <Text style={s.actionSubtitle}>Сохраненные адреса для заказов</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionCard}
            activeOpacity={0.7}
            onPress={() => {
              if (onTransactionsClick) {
                onTransactionsClick();
              } else {
                setActiveSubView('transactions');
              }
            }}
          >
            <View style={s.actionContent}>
              <View style={s.actionIcon}>
                <ReceiptIcon size={24} color="#8ec0ed" />
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionTitle}>История транзакций</Text>
                <Text style={s.actionSubtitle}>Детализация списаний и начислений</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>


      <TouchableOpacity
        style={s.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOutIcon size={16} color="#ef4444" />
        <Text style={s.logoutBtnText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
