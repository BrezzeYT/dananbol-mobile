export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): number[] {
  if (totalPages <= 1) return [];

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentPage - half;
  let end = start + maxVisible - 1;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function getVisiblePaginationPages(
  currentPage: number,
  totalPages: number
): number[] {
  const window = getPaginationRange(currentPage, totalPages);
  const pages = new Set<number>();

  if (window[0] > 1) {
    pages.add(1);
  }

  window.forEach((page) => pages.add(page));

  if (window[window.length - 1] < totalPages) {
    pages.add(totalPages);
  }

  return [...pages].sort((a, b) => a - b);
}
