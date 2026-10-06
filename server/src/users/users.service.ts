import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SafeUser, toSafeUser } from './dto/safe-user.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ Email: email });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ Id: id });
  }

  async create(email: string, passwordHash: string, role: string = 'User'): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const user = this.usersRepository.create({
      Email: email,
      PasswordHash: passwordHash,
      Role: role,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({ order: { Email: 'ASC' } });
    return users.map(toSafeUser);
  }

  async createUser(email: string, password: string, role: string): Promise<SafeUser> {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return toSafeUser(await this.create(email, hash, role));
  }

  async updateRole(id: number, role: string): Promise<SafeUser> {
    const user = await this.getOrFail(id);
    user.Role = role;
    user.UpdatedAt = new Date();
    return toSafeUser(await this.usersRepository.save(user));
  }

  async resetPassword(id: number, password: string): Promise<SafeUser> {
    const user = await this.getOrFail(id);
    user.PasswordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.UpdatedAt = new Date();
    return toSafeUser(await this.usersRepository.save(user));
  }

  async archive(id: number): Promise<SafeUser> {
    const user = await this.getOrFail(id);
    user.IsActive = false;
    user.UpdatedAt = new Date();
    return toSafeUser(await this.usersRepository.save(user));
  }

  private async getOrFail(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
