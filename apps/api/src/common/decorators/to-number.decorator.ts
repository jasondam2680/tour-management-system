import { Transform } from 'class-transformer';

/**
 * Null-safe number transform for query/body DTOs.
 *
 * Replaces `@Type(() => Number)` which turns an absent value into NaN
 * (breaking `page = 1` defaults and producing Prisma "Argument skip is missing" 500s).
 * Empty / missing values stay undefined so @IsOptional() and defaults work.
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  });
}
