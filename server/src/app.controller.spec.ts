import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController: AppController;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseService,
          useValue: {
            isConnected: jest.fn(),
            ping: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    databaseService = app.get(DatabaseService);
  });

  describe('root', () => {
    it('should return "Backend is running"', () => {
      expect(appController.getHello()).toBe('Backend is running');
    });
  });

  describe('db-test', () => {
    it('reports an error when the data source is not connected', async () => {
      databaseService.isConnected.mockReturnValue(false);

      const result = await appController.testDb();

      expect(result).toEqual({
        status: 'error',
        message: 'Database connection is not initialized. Check server logs.',
      });
      expect(databaseService.ping).not.toHaveBeenCalled();
    });

    it('returns the query result when connected', async () => {
      databaseService.isConnected.mockReturnValue(true);
      databaseService.ping.mockResolvedValue([{ test: 1 }]);

      const result = await appController.testDb();

      expect(result).toEqual([{ test: 1 }]);
    });

    it('reports an error when the query fails', async () => {
      databaseService.isConnected.mockReturnValue(true);
      databaseService.ping.mockRejectedValue(new Error('boom'));

      const result = await appController.testDb();

      expect(result).toEqual({
        status: 'error',
        message: 'Database query failed',
        details: 'boom',
      });
    });
  });
});
