import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  ArrowLeftIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
} from './icons';
import { CatalogPagination } from './CatalogPagination';
import { fetchMobileTransactions } from '../api/transactions';
import { useAuthContext } from '../context/useAuthContext';
import { transactionsStyles as s } from '../styles/TransactionsView.styles';
import type { Transaction } from '../types/transactions';

interface TransactionsViewProps {
  onBack: () => void;
}

let cachedTransactions: Transaction[] = [];

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onBack }) => {
  const { token } = useAuthContext();

  const [transactions, setTransactions] = useState<Transaction[]>(cachedTransactions);
  const [isLoading, setIsLoading] = useState<boolean>(cachedTransactions.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const visibleTransactions = transactions.slice(
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
        <Text style={s.sectionTitle}>История транзакций</Text>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
          <Text style={s.backBtnText}>Назад</Text>
        </TouchableOpacity>
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
      ) : (
        <View style={s.list}>
          <View
            style={[
              s.cardsContainer,
              totalPages > 1 && s.cardsContainerPaged,
            ]}
          >
            {visibleTransactions.map((tx, idx) => {
              const isPlus = tx.amount > 0;
              return (
                <View
                  key={`tx_${currentPage}_${idx}_${tx.date_added}`}
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

