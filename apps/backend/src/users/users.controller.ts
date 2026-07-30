import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

// ---------------------------------------------------------------------------
// DEMO STUB — stands in for a proper auth system.
//
// In a real application this endpoint would not exist. Instead, the logged-in
// user's identity would be derived from a JWT / session token on the server
// (e.g. via a NestJS AuthGuard) and injected into request handlers via
// @CurrentUser(). There would be no client-fetchable "who am I?" endpoint.
//
// Here we return a random seeded user on every call so the frontend has a
// userId to attach to reservations without requiring login infrastructure.
// ---------------------------------------------------------------------------

@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  // GET /v1/users/me — returns a random user, simulating the logged-in session
  @Get('me')
  async getMe(): Promise<{ id: string; name: string; email: string }> {
    const users = await this.userRepository.find();
    const user = users[Math.floor(Math.random() * users.length)];
    return { id: user.id, name: user.name, email: user.email };
  }
}
