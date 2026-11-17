import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  cardInner: {
    width: '100%',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  noImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    padding: 12,
  },
  ampoulesPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ampoulesArt: {
    fontSize: 28,
  },
  ampouleText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    color: '#8ebce6',
    textAlign: 'center',
    lineHeight: 13,
  },
  title: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#0f172a',
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 4,
  },
  stockStatus: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 13,
  },
  stockIn: {
    color: '#2ecc71',
  },
  stockOut: {
    color: '#ef4444',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  priceColumn: {
    flex: 1,
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#6a6a6a',
  },
  priceOld: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  priceRegular: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
    color: '#2d4e6a',
    marginTop: 1,
  },
  priceSpecial: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    color: '#ef4444',
    marginTop: 1,
  },
  cartButton: {
    width: 44,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonPromo: {
    backgroundColor: '#fff5f5',
  },
  cartButtonRegular: {
    backgroundColor: '#eef6ff',
  },
  cartButtonAdded: {
    backgroundColor: '#dcfce7',
  },
  cartButtonDisabled: {
    opacity: 0.4,
  },
});
