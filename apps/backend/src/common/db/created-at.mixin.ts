import { CreateDateColumn } from 'typeorm';

export abstract class WithCreatedAt {
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
