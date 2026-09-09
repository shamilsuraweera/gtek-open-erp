import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('returns the user without the password hash on a match', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      usersService.findByEmail.mockResolvedValue({
        Id: 1,
        Email: 'a@b.com',
        PasswordHash: hash,
        Role: 'User',
        IsActive: true,
        CreatedAt: new Date(),
      });

      const result = await service.validateUser('a@b.com', 'correct-password');

      expect(result).toEqual(
        expect.objectContaining({ Id: 1, Email: 'a@b.com' }),
      );
      expect(result.PasswordHash).toBeUndefined();
    });

    it('returns null when the password does not match', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      usersService.findByEmail.mockResolvedValue({
        Id: 1,
        Email: 'a@b.com',
        PasswordHash: hash,
        Role: 'User',
        IsActive: true,
        CreatedAt: new Date(),
      });

      const result = await service.validateUser('a@b.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('missing@b.com', 'anything');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('signs a JWT with the expected payload', async () => {
      jwtService.sign.mockReturnValue('signed-token');

      const result = await service.login({ Id: 1, Email: 'a@b.com', Role: 'User' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'a@b.com',
        sub: 1,
        role: 'User',
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });

  describe('register', () => {
    it('throws when the email is already in use', async () => {
      usersService.findByEmail.mockResolvedValue({
        Id: 1,
        Email: 'a@b.com',
        PasswordHash: 'hash',
        Role: 'User',
        IsActive: true,
        CreatedAt: new Date(),
      });

      await expect(service.register('a@b.com', 'password')).rejects.toThrow(
        'Email already in use',
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates the user and strips the password hash', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        Id: 1,
        Email: 'a@b.com',
        PasswordHash: 'hash',
        Role: 'User',
        IsActive: true,
        CreatedAt: new Date(),
      });

      const result = await service.register('a@b.com', 'password');

      expect(result).not.toHaveProperty('PasswordHash');
      expect(result).toEqual(expect.objectContaining({ Id: 1, Email: 'a@b.com' }));
    });
  });
});
