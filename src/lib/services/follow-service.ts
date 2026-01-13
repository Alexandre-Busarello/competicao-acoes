import { prisma } from '@/lib/prisma/client';
import { queueService } from '@/lib/queue/queue-service';
import { executeActionHandler } from '@/lib/queue/action-handlers';

/**
 * Serviço para gerenciar relacionamentos de seguir usuários
 */
export class FollowService {
  /**
   * Segue ou deixa de seguir um usuário (com processamento otimista)
   */
  async followUser(followerId: string, followingId: string): Promise<{
    following: boolean;
    followerCount: number;
    followingCount: number;
  }> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Verifica se já existe follow
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    const following = !existingFollow;

    // Enfileira ação
    const actionId = await queueService.enqueue(
      following ? 'follow' : 'unfollow',
      {
        followerId,
        followingId,
      },
      10 // Prioridade alta
    );

    // Tenta processar imediatamente (otimista)
    try {
      await executeActionHandler('follow', { followerId, followingId });
      await queueService.markCompleted(actionId);

      // Cria notificação se está seguindo
      if (following) {
        await queueService.enqueue('notification', {
          userId: followingId,
          type: 'follow',
          actorId: followerId,
        }, 5); // Prioridade média
      }
    } catch (error) {
      // Se falhar, deixa na fila para processamento posterior
      console.error('Failed to process follow immediately:', error);
    }

    // Busca contadores atualizados (atualizados via trigger)
    const [followerStats, followingStats] = await Promise.all([
      prisma.userStats.findUnique({
        where: { userId: followingId },
        select: { followerCount: true },
      }),
      prisma.userStats.findUnique({
        where: { userId: followerId },
        select: { followingCount: true },
      }),
    ]);

    return {
      following,
      followerCount: followerStats?.followerCount || 0,
      followingCount: followingStats?.followingCount || 0,
    };
  }

  /**
   * Remove follow (deixa de seguir)
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }

  /**
   * Obtém lista de seguidores
   */
  async getFollowers(userId: string, limit: number = 50): Promise<Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
  }>> {
    const follows = await prisma.userFollow.findMany({
      where: { followingId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return follows.map(f => ({
      id: f.follower.id,
      name: f.follower.name,
      avatarUrl: f.follower.avatarUrl,
      createdAt: f.createdAt,
    }));
  }

  /**
   * Obtém lista de usuários seguidos
   */
  async getFollowing(userId: string, limit: number = 50): Promise<Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
  }>> {
    const follows = await prisma.userFollow.findMany({
      where: { followerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return follows.map(f => ({
      id: f.following.id,
      name: f.following.name,
      avatarUrl: f.following.avatarUrl,
      createdAt: f.createdAt,
    }));
  }

  /**
   * Verifica se usuário A segue usuário B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }
}

export const followService = new FollowService();





