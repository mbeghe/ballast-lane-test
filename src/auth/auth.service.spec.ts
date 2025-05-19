import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));

    const hashedPassword = await bcrypt.hash('password', 10);
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: hashedPassword,
    } as User;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'password',
    };
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.create.mockReturnValue({ ...dto });
    mockUserRepo.save.mockResolvedValue({ id: 1, ...dto });

    const result = await service.register(dto);
    expect(result).toEqual({ message: 'User registered' });
    expect(mockUserRepo.save).toHaveBeenCalled();
  });

  it('should not allow registering with existing email', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'password',
    };
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    await expect(service.register(dto)).rejects.toThrow('Email already in use');
  });

  it('should login successfully with valid credentials', async () => {
    const dto: LoginDto = { email: mockUser.email, password: 'password' };
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.login(dto);
    expect(result).toEqual({ access_token: 'mock-jwt-token' });
  });

  it('should fail login with invalid password', async () => {
    const dto: LoginDto = { email: mockUser.email, password: 'wrongpassword' };
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should fail login if user not found', async () => {
    const dto: LoginDto = { email: 'unknown@example.com', password: '1234' };
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
  });
});
