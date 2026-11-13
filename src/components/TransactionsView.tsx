import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeftIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  SearchIcon,
} from './icons';
import { CatalogPagination } from './CatalogPagination';
import { fetchMobileTransactions } from '../api/transactions';
import { useAuthContext } from '../context/useAuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { transactionsStyles as s } from '../styles/TransactionsView.styles';
import type { Transaction } from '../types/transactions';

interface TransactionsViewProps {
  onBack: () => void;
}

let cachedTransactions: Transaction[] = [];
const TRANSACTIONS_PER_PAGE = 5;

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onBack }) => {
  const { token } = useAuthContext();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<Transaction[]>(cachedTransactions);
  const [isLoading, setIsLoading] = useState<boolean>(cachedTransactions.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (!token) {
      setError('Не авторизован');
      setIsLoading(false);
      return;
    }

    if (cachedTransactions.length === 0) {
      setIsLoading(true);
    }

    fetchMobileTransactions(token)
      .then((res) => {
        if (res.ok && res.transactions) {
          cachedTransactions = res.transactions;
          setTransactions(res.transactions);
        } else {
          setError(res.error || 'Не удалось загрузить транзакции');
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Ошибка сети';
        setError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  const filteredTransactions = transactions.filter((transaction) =>
    [transaction.description, transaction.date_added, transaction.amount].some((value) =>
      String(value ?? '').toLocaleLowerCase('ru-RU').includes(normalizedQuery)
    )
  );
  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const visibleTransactions = filteredTransactions.slice(
    (currentPage - 1) * TRANSACTIONS_PER_PAGE,
    currentPage * TRANSACTIONS_PER_PAGE
  );
  const bottomContentPadding = Math.max(insets.bottom, 10) + 68;

  return (
    <View style={s.container}>
      <View style={[s.content, { paddingBottom: bottomContentPadding }]}>
        <View style={s.subHeader}>
          <Text style={s.sectionTitle}>История транзакций</Text>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
            <Text style={s.backBtnText}>Назад</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchBox}>
          <SearchIcon size={18} color="#94a3b8" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setCurrentPage(1);
            }}
            placeholder="Найти транзакцию"
            placeholderTextColor="#94a3b8"
            accessibilityLabel="Поиск по описанию, дате или сумме транзакции"
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#8ec0ed" />
            <Text style={s.loadingText}>Загрузка транзакций...</Text>
          </View>
        ) : transactions.length === 0 && !error ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>У вас еще нет транзакций</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Транзакции не найдены</Text>
          </View>
        ) : (
          <View style={s.listArea}>
            <ScrollView
              style={s.listScroll}
              contentContainerStyle={s.cardsContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {visibleTransactions.map((tx, idx) => {
                const isPlus = tx.amount > 0;
                return (
                  <View
                    key={`tx_${(currentPage - 1) * TRANSACTIONS_PER_PAGE + idx}_${tx.date_added}`}
                    style={s.item}
                  >
                    <View style={s.itemLeft}>
                      <View
                        style={[
                          s.iconBox,
                          isPlus ? s.iconBoxPlus : s.iconBoxMinus,
                        ]}
                      >
                        {isPlus ? (
                          <ArrowDownRightIcon size={24} color="#8ec0ed" strokeWidth={2} />
                        ) : (
                          <ArrowUpRightIcon size={24} color="#e05252" strokeWidth={2} />
                        )}
                      </View>
                      <View style={s.itemText}>
                        <Text
                          style={s.itemTitle}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {tx.description}
                        </Text>
                        <Text style={s.itemDate}>{tx.date_added}</Text>
                      </View>
                    </View>

                    <View style={s.itemRight}>
                      <Text
                        style={[
                          s.itemAmount,
                          isPlus ? s.itemAmountPlus : s.itemAmountMinus,
                        ]}
                      >
                        {isPlus ? '+' : ''}
                        {tx.amount} ₽
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              wrapperStyle={s.pagination}
            />
          </View>
        )}
      </View>
    </View>
  );
};
