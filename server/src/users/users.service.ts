import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
}
