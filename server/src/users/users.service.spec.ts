import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      const user = { Id: 1, Email: 'a@b.com' } as User;
      repository.findOneBy.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(repository.findOneBy).toHaveBeenCalledWith({ Email: 'a@b.com' });
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmail('missing@b.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and saves a new user', async () => {
      repository.findOneBy.mockResolvedValue(null);
      const created: Partial<User> = { Email: 'a@b.com', PasswordHash: 'hash', Role: 'User' };
      const saved = { Id: 1, ...created } as User;
      repository.create.mockReturnValue(created as User);
      repository.save.mockResolvedValue(saved);

      const result = await service.create('a@b.com', 'hash');

      expect(repository.create).toHaveBeenCalledWith({
        Email: 'a@b.com',
        PasswordHash: 'hash',
        Role: 'User',
      });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(saved);
    });

    it('throws when the user already exists', async () => {
      repository.findOneBy.mockResolvedValue({ Id: 1 } as User);

      await expect(service.create('a@b.com', 'hash')).rejects.toThrow(
        'User already exists',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('admin operations', () => {
    const stored = () =>
      ({ Id: 5, Email: 'x@y.com', PasswordHash: 'HASH', Role: 'User', IsActive: true }) as User;

    it('findAll never includes PasswordHash', async () => {
      repository.find.mockResolvedValue([stored()]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('PasswordHash');
    });

    it('createUser hashes the password and strips the hash from the result', async () => {
      repository.findOneBy.mockResolvedValue(null);
      repository.create.mockImplementation((v) => v as User);
      repository.save.mockImplementation(async (v) => v as User);

      const result = await service.createUser('n@e.com', 'plainpass1', 'Admin');

      const saved = repository.save.mock.calls[0][0] as User;
      expect(saved.PasswordHash).not.toBe('plainpass1');
      expect(await bcrypt.compare('plainpass1', saved.PasswordHash)).toBe(true);
      expect(result).not.toHaveProperty('PasswordHash');
      expect(result.Role).toBe('Admin');
    });

    it('updateRole changes the role', async () => {
      repository.findOneBy.mockResolvedValue(stored());
      repository.save.mockImplementation(async (v) => v as User);
      expect((await service.updateRole(5, 'Admin')).Role).toBe('Admin');
    });

    it('resetPassword stores a fresh bcrypt hash', async () => {
      repository.findOneBy.mockResolvedValue(stored());
      repository.save.mockImplementation(async (v) => v as User);
      const result = await service.resetPassword(5, 'brandnew123');
      const saved = repository.save.mock.calls[0][0] as User;
      expect(await bcrypt.compare('brandnew123', saved.PasswordHash)).toBe(true);
      expect(result).not.toHaveProperty('PasswordHash');
    });

    it('archive soft-deletes via IsActive=false', async () => {
      repository.findOneBy.mockResolvedValue(stored());
      repository.save.mockImplementation(async (v) => v as User);
      expect((await service.archive(5)).IsActive).toBe(false);
    });

    it('throws NotFound for an unknown id', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.archive(99)).rejects.toThrow('not found');
    });
  });
});
