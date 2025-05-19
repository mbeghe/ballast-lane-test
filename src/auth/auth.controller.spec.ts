import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const dto: RegisterDto = { email: 'test@example.com', password: 'secret' };
      const expected = { userId: 1 };

      (authService.register as jest.Mock).mockResolvedValue(expected);

      const result = await controller.register(dto);
      expect(result).toEqual(expected);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when authService.register fails', async () => {
      const dto: RegisterDto = { email: 'existing@example.com', password: 'secret' };
      (authService.register as jest.Mock).mockRejectedValue(new Error('User already exists'));

      try {
        await controller.register(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('User already exists');
      }
    });
  });

  describe('login', () => {
    it('should call authService.login and return JWT', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'secret' };
      const expected = { access_token: 'jwt-token' };

      (authService.login as jest.Mock).mockResolvedValue(expected);

      const result = await controller.login(dto);
      expect(result).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when authService.login fails', async () => {
      const dto: LoginDto = { email: 'fail@example.com', password: 'wrong' };
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      try {
        await controller.login(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Invalid credentials');
      }
    });
  });
});
