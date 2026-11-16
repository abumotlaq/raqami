export interface Page {
  page: number;
  perPage: number;
  offset: number;
}

const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 100;

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return typeof value === "string" && Number.isInteger(n) && n >= 1 ? n : fallback;
}

// Reads ?page=1&per_page=12. Missing or invalid values fall back to the defaults.
export function readPage(query: Record<string, unknown>): Page {
  const page = positiveInt(query.page, 1);
  const perPage = Math.min(positiveInt(query.per_page, DEFAULT_PER_PAGE), MAX_PER_PAGE);
  return { page, perPage, offset: (page - 1) * perPage };
}

export function paginated<T>(data: T[], total: number, { page, perPage }: Page) {
  return {
    data,
    meta: {
      currentPage: page,
      lastPage: Math.max(1, Math.ceil(total / perPage)),
      perPage,
      total,
    },
  };
}
