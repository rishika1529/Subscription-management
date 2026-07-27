import { Module } from "@nestjs/common";

/**
 * CacheModule - stub module for Redis caching.
 * Redis/cache-manager packages are optional. When configured,
 * replace this with a real CacheModule implementation using
 * @nestjs/cache-manager or cache-manager-ioredis.
 */
@Module({})
export class CacheModule {}
