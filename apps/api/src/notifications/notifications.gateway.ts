import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.userId = userId;

      // Add to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);

      this.logger.log(
        `✅ Client ${client.id} connected for user ${userId} (Total connections: ${this.userSockets.get(userId)!.size})`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to SubTrack Pro',
        userId,
        timestamp: new Date(),
      });

      // Send initial presence data
      this.broadcastPresence(userId, true);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          this.broadcastPresence(userId, false);
        }
      }

      this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
    }
  }

  // Event handlers

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  @SubscribeMessage('join:room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room ${data.room}`);
    return { event: 'room:joined', data: { room: data.room } };
  }

  @SubscribeMessage('leave:room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} left room ${data.room}`);
    return { event: 'room:left', data: { room: data.room } };
  }

  @SubscribeMessage('subscription:update')
  handleSubscriptionUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    // Client is notifying about a subscription update
    // Broadcast to all client's connections
    if (client.userId) {
      this.sendToUser(client.userId, 'subscription:updated', data);
    }
  }

  // Public methods for other services to use

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    this.logger.debug(`📤 Sent '${event}' to user ${userId}`);
  }

  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  // Specific notification types

  sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    this.sendToUser(userId, 'notification', notification);
  }

  sendRenewalReminder(userId: string, subscription: any) {
    this.sendToUser(userId, 'renewal:reminder', {
      subscription,
      message: `${subscription.name} renews in ${this.getDaysUntil(subscription.nextBillingDate)} days`,
    });
  }

  sendPaymentSuccess(userId: string, payment: any) {
    this.sendToUser(userId, 'payment:success', {
      payment,
      message: `Payment of $${payment.amount} successful`,
    });
  }

  sendPaymentFailed(userId: string, payment: any) {
    this.sendToUser(userId, 'payment:failed', {
      payment,
      message: `Payment of $${payment.amount} failed`,
    });
  }

  sendAIInsight(userId: string, insight: any) {
    this.sendToUser(userId, 'ai:insight', insight);
  }

  // Helper methods

  private broadcastPresence(userId: string, online: boolean) {
    this.server.emit('user:presence', {
      userId,
      online,
      timestamp: new Date(),
    });
  }

  private getDaysUntil(date: Date): number {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  // Admin methods

  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      uniqueUsers: this.userSockets.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
    };
  }
}
