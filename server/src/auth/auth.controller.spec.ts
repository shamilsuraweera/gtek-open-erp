import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('delegates to AuthService when valid', async () => {
      authService.register.mockResolvedValue({ Id: 1, Email: 'a@b.com' } as any);

      const result = await controller.register({
        email: 'a@b.com',
        password: 'password',
      });

      expect(authService.register).toHaveBeenCalledWith('a@b.com', 'password', undefined);
      expect(result).toEqual({ Id: 1, Email: 'a@b.com' });
    });
  });

  describe('login', () => {
    it('throws when credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token on success', async () => {
      const user = { Id: 1, Email: 'a@b.com', Role: 'User' };
      authService.validateUser.mockResolvedValue(user);
      authService.login.mockResolvedValue({ access_token: 'signed-token' });

      const result = await controller.login({
        email: 'a@b.com',
        password: 'correct',
      });

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
