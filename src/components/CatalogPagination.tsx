import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { getVisiblePaginationPages } from '../lib/pagination';

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  wrapperStyle?: StyleProp<ViewStyle>;
}

export const CatalogPagination: React.FC<CatalogPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  wrapperStyle,
}) => {
  if (totalPages <= 1) return null;

  const pages = getVisiblePaginationPages(currentPage, totalPages);

  return (
    <View style={[styles.paginationWrapper, wrapperStyle]}>
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[
            styles.paginationLink,
            currentPage <= 1 && styles.paginationLinkDisabled,
          ]}
          disabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon
            size={18}
            color={currentPage <= 1 ? '#94a3b8' : '#2d4e6a'}
          />
        </TouchableOpacity>

        {pages.map((page) => {
          const isActive = currentPage === page;
          return (
            <TouchableOpacity
              key={page}
              style={[
                styles.paginationLink,
                isActive && styles.paginationLinkActive,
              ]}
              disabled={isActive}
              onPress={() => onPageChange(page)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.paginationText,
                  isActive && styles.paginationTextActive,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.paginationLink,
            currentPage >= totalPages && styles.paginationLinkDisabled,
          ]}
          disabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          activeOpacity={0.7}
        >
          <ChevronRightIcon
            size={18}
            color={currentPage >= totalPages ? '#94a3b8' : '#2d4e6a'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paginationWrapper: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  paginationLink: {
    width: 36,
    height: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eef2f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationLinkActive: {
    backgroundColor: '#8ebce6',
    borderColor: '#8ebce6',
  },
  paginationLinkDisabled: {
    opacity: 0.35,
  },
  paginationText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#2d4e6a',
  },
  paginationTextActive: {
    color: '#ffffff',
  },
});
