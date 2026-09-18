import 'reflect-metadata';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesGuard } from '../common/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;
  const req = { user: { id: 1, role: 'Admin' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            createUser: jest.fn(),
            updateRole: jest.fn(),
            resetPassword: jest.fn(),
            archive: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('delegates CRUD calls to the service', async () => {
    await controller.findAll();
    await controller.create({ Email: 'a@b.com', Password: 'password1', Role: 'User' });
    await controller.updateRole(2, { Role: 'Admin' }, req);
    await controller.resetPassword(2, { Password: 'newpassword' });
    await controller.archive(2, req);

    expect(service.findAll).toHaveBeenCalled();
    expect(service.createUser).toHaveBeenCalledWith('a@b.com', 'password1', 'User');
    expect(service.updateRole).toHaveBeenCalledWith(2, 'Admin');
    expect(service.resetPassword).toHaveBeenCalledWith(2, 'newpassword');
    expect(service.archive).toHaveBeenCalledWith(2);
  });

  it('refuses self-demotion and self-deactivation', () => {
    expect(() => controller.updateRole(1, { Role: 'User' }, req)).toThrow(BadRequestException);
    expect(() => controller.archive(1, req)).toThrow(BadRequestException);
  });

  describe('RolesGuard on the controller', () => {
    const guard = new RolesGuard(new Reflector());
    const contextFor = (handler: (...args: any[]) => any, user: any) =>
      ({
        getHandler: () => handler,
        getClass: () => UsersController,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as unknown as ExecutionContext;

    it('allows Admin and rejects User on list', () => {
      expect(guard.canActivate(contextFor(controller.findAll, { role: 'Admin' }))).toBe(true);
      expect(guard.canActivate(contextFor(controller.findAll, { role: 'User' }))).toBe(false);
      expect(guard.canActivate(contextFor(controller.findAll, undefined))).toBe(false);
    });

    it('lets any authenticated role read its own profile', () => {
      expect(guard.canActivate(contextFor(controller.getProfile, { role: 'User' }))).toBe(true);
    });
  });
});
