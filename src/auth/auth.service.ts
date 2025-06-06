
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async signIn(email: string, pass: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { email },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const isPasswordValid = await user.password && (await bcrypt.compare(pass, user.password));
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }
        const payload = { email: user.email, id: user.id, isAdmin: user.isAdmin };
        const token = this.jwtService.sign(payload);
        const { password, ...result } = user;

        return {
            ...result,
            token,
        };
    }
}
