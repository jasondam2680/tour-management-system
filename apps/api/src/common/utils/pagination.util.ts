/**
 * Sanitize pagination params. Query DTO transforms can yield NaN
 * (e.g. class-transformer's implicit conversion turns undefined into NaN),
 * which breaks Prisma `skip`/`take` with a 500. This guarantees sane values.
 */
export function toPagination(query: { page?: unknown; limit?: unknown }): {
  page: number;
  limit: number;
  skip: number;
} {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : 20;
  return { page, limit, skip: (page - 1) * limit };
}
