/**
 * JwtAuthGuard
 *
 * This guard is responsible for protecting routes using JWT authentication strategy.
 * It extends the built-in AuthGuard from @nestjs/passport, specifying the 'jwt' strategy.
 * When applied to a route, it ensures that the incoming request contains a valid JWT token.
 * If the token is valid, the request proceeds; otherwise, an unauthorized response is returned.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   async someProtectedRoute() { ... }
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
