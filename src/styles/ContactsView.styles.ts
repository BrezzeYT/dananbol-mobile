import { StyleSheet } from "react-native";

export const contactsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 12,
  },
  title: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 20,
    color: "#000000",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: "#718096",
    marginBottom: 8,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#edf2f7",
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlobe: {
    backgroundColor: "rgba(142, 192, 237, 0.12)",
  },
  iconBot: {
    backgroundColor: "rgba(236, 159, 25, 0.1)",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
    color: "#2d4e6a",
  },
  cardAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerBox: {
    marginTop: 24,
    padding: 18,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#edf2f7",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  footerText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    lineHeight: 18,
  },
});
