import { Injectable, ForbiddenException } from '@nestjs/common';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

@Injectable()
export class RateLimiterService {
    private readonly store = new Map<string, RateLimitRecord>();

    constructor() {
        setInterval(() => this.cleanupRateLimits(), 60000);
    }

    checkRateLimit(userId: string, limit: number = 10, windowMs: number = 60000): void {
        const now = Date.now();
        const record = this.store.get(userId);

        if (!record) {
            this.store.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return;
        }

        if (now > record.resetTime) {
            this.store.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return;
        }

        if (record.count >= limit) {
            throw new ForbiddenException('Rate limit exceeded. Try again in a minute.');
        }

        // Increment counter and update
        record.count++;
        this.store.set(userId, record);
    }

    private cleanupRateLimits(): void {
        const now = Date.now();
        for (const [userId, record] of this.store.entries()) {
            if (now > record.resetTime) {
                this.store.delete(userId);
            }
        }
    }
}