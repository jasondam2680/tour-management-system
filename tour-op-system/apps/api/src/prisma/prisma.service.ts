import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async paginate<T>(
    model: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
    args: { where?: any; orderBy?: any; include?: any; select?: any },
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      model.findMany({ ...args, skip, take: limit }),
      model.count({ where: args.where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
