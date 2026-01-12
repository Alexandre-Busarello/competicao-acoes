import { prisma } from '@/lib/prisma/client';
import { cacheService } from '@/lib/cache/cache-service';

/**
 * Handlers específicos para cada tipo de ação na fila
 */

export async function handleLikeAction(payload: { postId: string; userId: string }): Promise<void> {
  const { postId, userId } = payload;

  // Verifica se já existe like
  const existingLike = await prisma.feedLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    // Remove like (toggle)
    await prisma.feedLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    // Adiciona like
    await prisma.feedLike.create({
      data: {
        postId,
        userId,
      },
    });
  }

  // Invalida cache do feed
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (post) {
    await cacheService.clear(`feed:${post.userId}:*`);
  }
}

export async function handleCommentAction(payload: {
  postId: string;
  userId: string;
  content: string;
}): Promise<void> {
  const { postId, userId, content } = payload;

  // Cria comentário (contador é atualizado via trigger)
  await prisma.feedComment.create({
    data: {
      postId,
      userId,
      content,
    },
  });

  // Invalida cache do feed
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (post) {
    await cacheService.clear(`feed:${post.userId}:*`);
  }
}

export async function handleFollowAction(payload: {
  followerId: string;
  followingId: string;
}): Promise<void> {
  const { followerId, followingId } = payload;

  // Verifica se já existe follow
  const existingFollow = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    // Remove follow (toggle)
    await prisma.userFollow.delete({
      where: { id: existingFollow.id },
    });
  } else {
    // Cria follow (contadores são atualizados via trigger)
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }
}

export async function handleNotificationAction(payload: {
  userId: string;
  type: string;
  actorId: string;
  postId?: string;
  commentId?: string;
  content?: string;
}): Promise<void> {
  const { userId, type, actorId, postId, commentId, content } = payload;

  // Cria notificação
  await prisma.notification.create({
    data: {
      userId,
      type,
      actorId,
      postId,
      commentId,
      content,
    },
  });

  // Invalida cache de notificações
  await cacheService.delete(`notifications:unread:${userId}`);
}

export async function handleTimelineUpdateAction(payload: {
  postId: string;
  userId: string;
}): Promise<void> {
  const { postId, userId } = payload;

  // Busca post
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      createdAt: true,
      isPublic: true,
    },
  });

  if (!post || !post.isPublic) {
    return;
  }

  // Busca seguidores do autor do post
  const followers = await prisma.userFollow.findMany({
    where: {
      followingId: post.userId,
    },
    select: {
      followerId: true,
    },
  });

  // Adiciona post às timelines dos seguidores
  const timelineEntries = followers.map(follower => ({
    userId: follower.followerId,
    postId,
    postUserId: post.userId,
    createdAt: post.createdAt,
    score: null, // Pode ser calculado por algoritmo de relevância no futuro
  }));

  if (timelineEntries.length > 0) {
    await prisma.feedTimeline.createMany({
      data: timelineEntries,
      skipDuplicates: true,
    });
  }

  // Invalida cache de timelines
  for (const follower of followers) {
    await cacheService.clear(`timeline:${follower.followerId}:*`);
  }
}

/**
 * Executa handler baseado no tipo de ação
 */
export async function executeActionHandler(actionType: string, payload: any): Promise<void> {
  switch (actionType) {
    case 'like':
      await handleLikeAction(payload);
      break;
    case 'comment':
      await handleCommentAction(payload);
      break;
    case 'follow':
    case 'unfollow':
      await handleFollowAction(payload);
      break;
    case 'notification':
      await handleNotificationAction(payload);
      break;
    case 'timeline_update':
      await handleTimelineUpdateAction(payload);
      break;
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}


