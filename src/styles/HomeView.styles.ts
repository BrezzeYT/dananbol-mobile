import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  listContent: {
    paddingBottom: 90,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerStack: {
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 42,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    flexWrap: "wrap",
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#eef6ff",
    borderColor: "#cfe4f7",
  },
  chipPromoActive: {
    backgroundColor: "#fff5f5",
    borderColor: "#fecaca",
  },
  categoryChipActive: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
  },
  subcategoryChipActive: {
    backgroundColor: "#8ebce6",
    borderColor: "#8ebce6",
  },
  chipText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  chipTextActive: {
    color: "#8ebce6",
  },
  chipTextPromoActive: {
    color: "#ef4444",
  },
  chipTextWhite: {
    color: "#ffffff",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },
  subcategoryChipTextActive: {
    color: "#ffffff",
  },
  horizontalTrackWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  categoriesWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  categoriesTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoriesWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#000000",
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadgeText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: "#94a3b8",
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loadingText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
  },
  emptyTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    color: "#0f172a",
  },
  emptySubtitle: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    color: "#94a3b8",
  },
});
