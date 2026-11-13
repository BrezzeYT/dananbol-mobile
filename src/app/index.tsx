import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchIcon, ChevronDownIcon } from '../components/icons';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailsSheet } from '../components/ProductDetailsSheet';
import { NotificationsSheet } from '../components/NotificationsSheet';
import { CatalogPagination } from '../components/CatalogPagination';
import { BottomNav, BottomNavPage } from '../components/BottomNav';
import { CartView } from '../components/CartView';
import { CheckoutView } from '../components/CheckoutView';
import { ProfileView } from '../components/ProfileView';
import { ContactsView } from '../components/ContactsView';
import { SupportView } from '../components/SupportView';
import { TopupModal } from '../components/TopupModal';
import { useAppContext } from '../context/useAppContext';
import { useAuthContext } from '../context/useAuthContext';
import { useCartContext } from '../context/useCartContext';
import { useCatalog } from '../hooks/useCatalog';
import {
  fetchMobileNotifications,
  clearMobileNotifications,
  registerPushToken,
  type BackendNotification,
} from '../api/notifications';
import {
  initNotifications,
  showLocalNotification,
  subscribeToNotificationClick,
  getPushToken,
} from '../services/notifications';
import { styles } from '../styles/HomeView.styles';
import type { Product } from '../types';

const NOTIF_LAST_READ_KEY = '@danabol_mobile_notif_last_read';

export default function HomeScreen() {
  const { categories, isCatalogLoading, catalogError, handleBuyClick } = useAppContext();
  const { customer, token, isLoggedIn, openAuth, refreshSession } = useAuthContext();
  const { totalCount, items, addToCart, updateQuantity } = useCartContext();

  const [activeTab, setActiveTab] = useState<BottomNavPage>('home');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const catalogListRef = useRef<FlatList<Product>>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [targetProfileOrderId, setTargetProfileOrderId] = useState<string | null>(null);
  const [profileSubView, setProfileSubView] = useState<'main' | 'orders' | 'addresses' | 'transactions'>('main');
  const [profileShowAddAddress, setProfileShowAddAddress] = useState(false);

  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(Date.now());
  const seenNotifIds = useRef<Set<string>>(new Set());
  const isFirstNotifLoad = useRef(true);

  const handleCardAddToCart = useCallback((p: Product) => {
    addToCart(p, 1);
    handleBuyClick(p);
  }, [addToCart, handleBuyClick]);

  const handleCardPress = useCallback((p: Product) => {
    setSelectedProduct(p);
  }, []);

  const switchTab = useCallback((nextTab: BottomNavPage) => {
    setIsCheckingOut(false);
    if (nextTab !== 'profile') {
      setProfileSubView('main');
      setProfileShowAddAddress(false);
    }
    setActiveTab(nextTab);
  }, []);

  const startCheckout = useCallback(() => {
    setIsCheckingOut(true);
  }, []);

  useEffect(() => {
    initNotifications();

    const unsubscribe = subscribeToNotificationClick((orderId) => {
      setTargetProfileOrderId(orderId);
      setIsCheckingOut(false);
      setProfileSubView('orders');
      setActiveTab('profile');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    getPushToken().then((pushToken) => {
      if (pushToken) {
        registerPushToken(token, pushToken).catch(() => {});
      }
    });
  }, [isLoggedIn, token]);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_LAST_READ_KEY).then((saved) => {
      if (saved) {
        setLastReadTime(Number(saved));
      }
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchMobileNotifications(token);
      if (res.ok && res.notifications) {
        setNotifications(res.notifications);

        if (isFirstNotifLoad.current) {
          isFirstNotifLoad.current = false;
          res.notifications.forEach((n) => seenNotifIds.current.add(n.id));
        } else {
          for (const n of res.notifications) {
            if (!seenNotifIds.current.has(n.id)) {
              seenNotifIds.current.add(n.id);
              if (n.id.startsWith('tx_') && n.message.includes('-')) {
                continue;
              }
              const orderMatch = n.message.match(/#\s*(\d+)/);
              const orderId = orderMatch ? orderMatch[1] : undefined;
              if (orderId && seenNotifIds.current.has(`created_ord_${orderId}`)) {
                continue;
              }
              showLocalNotification(
                'Danabol',
                n.message,
                orderId ? { orderId } : undefined
              );
            }
          }
        }
      }
    } catch (err) {
      console.debug('Failed to fetch mobile notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setNotifications([]);
      seenNotifIds.current.clear();
      isFirstNotifLoad.current = true;
      return;
    }

    loadNotifications();

    const interval = setInterval(loadNotifications, 15000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isLoggedIn, token, loadNotifications]);

  const handleBellPress = () => {
    if (!isLoggedIn) {
      openAuth();
      return;
    }
    setShowNotifications(true);
    const maxTime =
      notifications.length > 0
        ? Math.max(...notifications.map((n) => n.timestamp), Date.now())
        : Date.now();
    setLastReadTime(maxTime);
    AsyncStorage.setItem(NOTIF_LAST_READ_KEY, String(maxTime));
  };

  const handleClearNotifications = () => {
    if (token) {
      clearMobileNotifications(token).catch(() => {});
    }
    setNotifications([]);
  };

  const {
    catalogViewKey,
    currentPage,
    products,
    totalProducts,
    totalPages,
    isProductsLoading,
    productsError,
    subcategories,
    categoryTitle,
    handlePageChange,
  } = useCatalog({
    categories,
    categoryId: selectedCategory,
    subcategoryId: selectedSubcategory,
    searchQuery,
    inStockOnly,
    promoOnly,
  });

  const handleCatalogPageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    if (activeTab === 'home' && !isCheckingOut) {
      catalogListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    handlePageChange(page);
  }, [activeTab, currentPage, handlePageChange, isCheckingOut]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('all');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const selectedProductCartQty = selectedProduct
    ? items.find((i) => i.product.id === selectedProduct.id)?.quantity ?? 0
    : 0;

  const renderCategoryChips = () =>
    categories.map((cat) => {
      const isSelected = selectedCategory === cat.id;
      return (
        <TouchableOpacity
          key={cat.id}
          style={[styles.chip, isSelected && styles.categoryChipActive]}
          onPress={() => handleCategorySelect(cat.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextWhite]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      );
    });

  const renderSubcategoryChips = () =>
    subcategories.map((subcat) => {
      const isSelected = selectedSubcategory === subcat.id;
      return (
        <TouchableOpacity
          key={subcat.id}
          style={[styles.chip, isSelected && styles.subcategoryChipActive]}
          onPress={() => handleSubcategorySelect(subcat.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextWhite]}>
            {subcat.name}
          </Text>
        </TouchableOpacity>
      );
    });

  const renderContent = () => {
    if (isCheckingOut) {
      return (
        <CheckoutView
          onBack={() => setIsCheckingOut(false)}
          onGoHome={() => switchTab('home')}
          onProductClick={(product) => setSelectedProduct(product)}
          onOrderCreated={(orderId) => {
            if (orderId) {
              seenNotifIds.current.add(`created_ord_${orderId}`);
            }
            loadNotifications();
            refreshSession?.();
          }}
          onGoToAddresses={() => {
            setIsCheckingOut(false);
            setTargetProfileOrderId(null);
            setProfileSubView('addresses');
            setProfileShowAddAddress(true);
            setActiveTab('profile');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'cart':
        return (
          <CartView
            onProductClick={(product) => setSelectedProduct(product)}
            onCheckout={startCheckout}
          />
        );
      case 'profile':
        return (
          <ProfileView
            initialOrderId={targetProfileOrderId}
            initialSubView={profileSubView}
            initialShowAddAddressForm={profileShowAddAddress}
            onBalanceClick={() => setShowTopupModal(true)}
            onOpenSupport={() => {
              switchTab('support');
            }}
          />
        );
      case 'contacts':
        return <ContactsView />;
      case 'support':
        return <SupportView />;
      case 'home':
      default:
        return (
          <FlatList
            ref={catalogListRef}
            data={products}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#f59e0b']}
              />
            }
            ListHeaderComponent={
              <View style={styles.headerStack}>
                <View style={styles.searchBox}>
                  <SearchIcon size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Поиск по названию или бренду..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    style={[styles.chip, inStockOnly && styles.chipActive]}
                    onPress={() => setInStockOnly(!inStockOnly)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, inStockOnly && styles.chipTextActive]}>
                      Только в наличии
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, promoOnly && styles.chipPromoActive]}
                    onPress={() => setPromoOnly(!promoOnly)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, promoOnly && styles.chipTextPromoActive]}>
                      Только акционные
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.horizontalTrackWrapper}>
                  {isExpanded ? (
                    <View style={styles.categoriesWrap}>
                      {renderCategoryChips()}
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoriesTrack}
                      style={{ flex: 1 }}
                    >
                      {renderCategoryChips()}
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleExpanded}
                    activeOpacity={0.7}
                  >
                    <ChevronDownIcon
                      size={18}
                      color="#8ebce6"
                      rotate={isExpanded ? '180deg' : '0deg'}
                    />
                  </TouchableOpacity>
                </View>

                {subcategories.length > 0 && (
                  <View style={styles.horizontalTrackWrapper}>
                    {isExpanded ? (
                      <View style={styles.categoriesWrap}>
                        {renderSubcategoryChips()}
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesTrack}
                        style={{ flex: 1 }}
                      >
                        {renderSubcategoryChips()}
                      </ScrollView>
                    )}
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{categoryTitle || 'Каталог товаров'}</Text>
                  <View style={styles.countBadgeRow}>
                    {isProductsLoading && products.length > 0 ? (
                      <ActivityIndicator size="small" color="#f59e0b" />
                    ) : null}
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{totalProducts} товаров</Text>
                    </View>
                  </View>
                </View>
              </View>
            }
            renderItem={({ item, index }) => (
              <ProductCard
                product={item}
                appearanceKey={catalogViewKey}
                appearanceIndex={index}
                onAddToCart={handleCardAddToCart}
                onPress={handleCardPress}
              />
            )}
            ListEmptyComponent={
              isProductsLoading || isCatalogLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#f59e0b" />
                  <Text style={styles.loadingText}>Загрузка товаров...</Text>
                </View>
              ) : (
                <View style={styles.centerBox}>
                  <Text style={styles.emptyTitle}>
                    {productsError || 'Товары не найдены'}
                  </Text>
                  <Text style={styles.emptySubtitle}>Попробуйте сбросить фильтры</Text>
                </View>
              )
            }
            ListFooterComponent={
              products.length > 0 ? (
                <CatalogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handleCatalogPageChange}
                />
              ) : undefined
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        balance={customer?.balance ?? 0}
        isLoggedIn={isLoggedIn}
        unreadCount={
          isLoggedIn
            ? notifications.filter((n) => n.timestamp > lastReadTime).length
            : 0
        }
        isBellActive={
          showNotifications ||
          (isLoggedIn &&
            notifications.some((n) => n.timestamp > lastReadTime))
        }
        onBalancePress={() => {
          if (!isLoggedIn) {
            openAuth();
          } else {
            setShowTopupModal(true);
          }
        }}
        onBellPress={handleBellPress}
        onProfilePress={() => {
          if (!isLoggedIn) {
            openAuth();
          } else {
            setTargetProfileOrderId(null);
            switchTab('profile');
          }
        }}
        onLogoPress={() => switchTab('home')}
      />

      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {renderContent()}
      </View>

      <BottomNav
        activePage={isCheckingOut ? 'cart' : activeTab}
        cartCount={totalCount}
        onHome={() => switchTab('home')}
        onCart={() => {
          setIsCheckingOut(false);
          switchTab('cart');
        }}
        onProfile={() => {
          if (!isLoggedIn) {
            openAuth();
          } else {
            setTargetProfileOrderId(null);
            switchTab('profile');
          }
        }}
        onContacts={() => switchTab('contacts')}
        onSupport={() => switchTab('support')}
      />

      <ProductDetailsSheet
        product={selectedProduct}
        visible={!!selectedProduct}
        cartQuantity={selectedProductCartQty}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => {
          addToCart(p, qty);
          handleBuyClick(p);
        }}
        onUpdateQuantity={(pid, qty) => {
          updateQuantity(pid, qty);
        }}
        onGoToCart={() => {
          setSelectedProduct(null);
          switchTab('cart');
        }}
      />

      <NotificationsSheet
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onClear={handleClearNotifications}
        onOrderClick={(orderId) => {
          setTargetProfileOrderId(orderId);
          switchTab('profile');
        }}
      />

      <TopupModal
        visible={showTopupModal}
        onClose={() => setShowTopupModal(false)}
      />
    </SafeAreaView>
  );
}
