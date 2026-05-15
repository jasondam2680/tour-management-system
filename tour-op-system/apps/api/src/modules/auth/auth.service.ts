import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: { select: { id: true, name: true, code: true } } },
    });
    if (!user)                   throw new UnauthorizedException('Invalid email or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    const { passwordHash, ...safe } = user;
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);
    return { user: safe, ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatarUrl: true, role: true, status: true,
        permissions: true, lastLoginAt: true,
        organization: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async generateTokens(userId: string, email: string, role: string, orgId: string) {
    const payload = { sub: userId, email, role, orgId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn', '30d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
