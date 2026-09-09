import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
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
});
