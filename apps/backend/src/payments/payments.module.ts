import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentService } from './payment.service';
import { PaymentRecord } from './entities/payment-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecord])],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}
