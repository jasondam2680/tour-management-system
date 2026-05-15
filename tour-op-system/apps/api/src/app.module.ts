import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ToursModule }    from './modules/tours/tours.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FinanceModule }  from './modules/finance/finance.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { LeadsModule } from './modules/leads/leads.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    CustomersModule,
    SuppliersModule,
    LeadsModule,
    QuotationsModule,
    ToursModule,
    BookingsModule,
    FinanceModule,
  ],
  providers: [
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_GUARD,       useClass: JwtAuthGuard },
    { provide: APP_GUARD,       useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER,      useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
