import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface User {
  Id: number;
  Email: string;
  PasswordHash: string;
  Role: string;
  IsActive: boolean;
  CreatedAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private db: DatabaseService) {}

  async findByEmail(email: string): Promise<User | null> {
    if (!this.db.pool) {
      throw new Error('Database pool not initialized');
    }
    const result = await this.db.pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE Email = @email');
    return result.recordset[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    if (!this.db.pool) {
      throw new Error('Database pool not initialized');
    }
    const result = await this.db.pool.request()
      .input('id', id)
      .query('SELECT * FROM Users WHERE Id = @id');
    return result.recordset[0] || null;
  }

  async create(email: string, passwordHash: string, role: string = 'User'): Promise<User> {
    if (!this.db.pool) {
      throw new Error('Database pool not initialized');
    }
    
    // Check if user exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }

    const result = await this.db.pool.request()
      .input('email', email)
      .input('passwordHash', passwordHash)
      .input('role', role)
      .query(`
        INSERT INTO Users (Email, PasswordHash, Role)
        OUTPUT INSERTED.*
        VALUES (@email, @passwordHash, @role)
      `);
      
    return result.recordset[0];
  }
}
