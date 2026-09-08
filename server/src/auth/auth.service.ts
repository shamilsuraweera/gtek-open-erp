import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.PasswordHash)) {
      const { PasswordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.Email, sub: user.Id, role: user.Role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, pass: string, role: string = 'User') {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const hash = await bcrypt.hash(pass, 10);
    const newUser = await this.usersService.create(email, hash, role);
    const { PasswordHash, ...result } = newUser;
    return result;
  }
}
