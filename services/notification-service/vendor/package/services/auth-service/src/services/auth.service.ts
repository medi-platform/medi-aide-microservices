import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    // TODO: Replace with real user lookup and bcrypt verification
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: 'demo-user-id', email, role: 'user' };
    const accessToken = await this.jwt.signAsync(payload);

    return { accessToken, tokenType: 'Bearer', expiresIn: '7d' };
  }
}
