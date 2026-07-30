import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { dataSourceOptions } from "./data-source";
import { EventsModule } from "./events/events.module";
import { BookingsModule } from "./bookings/bookings.module";
import { VenuesModule } from "./venues/venues.module";
import { UsersModule } from "./users/users.module";
import { HostsModule } from "./hosts/hosts.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    EventsModule,
    BookingsModule,
    VenuesModule,
    UsersModule,
    HostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
