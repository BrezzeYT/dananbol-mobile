import { StyleSheet } from 'react-native';

export const transactionsStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
    color: '#000000',
    letterSpacing: -0.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 0,
    backgroundColor: 'transparent',
  },
  backBtnText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#5a7085',
  },
  list: {
    flexDirection: 'column',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  cardsContainerPaged: {
    minHeight: 460,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
    shadowColor: '#ececec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxPlus: {
    backgroundColor: 'rgba(142, 192, 237, 0.15)',
  },
  iconBoxMinus: {
    backgroundColor: 'rgba(240, 100, 100, 0.1)',
  },
  itemText: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  itemDate: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#6a6a6a',
  },
  itemRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  itemAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  itemAmountPlus: {
    color: '#8ec0ed',
  },
  itemAmountMinus: {
    color: '#e05252',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#8ec0ed',
  },
  emptyBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  emptyText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 15,
    color: '#6a6a6a',
    textAlign: 'center',
  },
  errorBox: {
    padding: 20,
    backgroundColor: 'rgba(240, 100, 100, 0.1)',
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#e05252',
    textAlign: 'center',
  },
});

