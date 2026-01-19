import { prisma } from '@/lib/prisma/client';
import { cacheService } from '@/lib/cache/cache-service';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { internalNotificationService } from '@/lib/services/internal-notification-service';

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

    // Enviar notificação push para o autor do post (se não for ele mesmo)
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: {
        userId: true,
        content: true,
        slug: true,
      },
    });

    console.log('[handleLikeAction] Post encontrado:', { postId, postUserId: post?.userId, likeUserId: userId });

    if (post && post.userId !== userId) {
      console.log('[handleLikeAction] Enviando notificação push - post.userId !== userId');
      
      // Buscar informações do usuário que curtiu
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
        },
      });

      console.log('[handleLikeAction] Actor encontrado:', { actorId: actor?.id, actorName: actor?.name });

      if (actor) {
        // Criar preview do conteúdo do post (primeiros 50 caracteres)
        const postPreview = post.content.length > 50
          ? post.content.substring(0, 50) + '...'
          : post.content;

        console.log('[handleLikeAction] Chamando sendInteractionNotification para userId:', post.userId);

        // Enviar notificação push (não bloqueia se falhar)
        pushNotificationService.sendInteractionNotification(post.userId, {
          postId: postId,
          postSlug: post.slug,
          actorId: actor.id,
          actorName: actor.name || 'Alguém',
          interactionType: 'like',
          postTitle: postPreview,
        }).then((result) => {
          console.log('[handleLikeAction] Resultado do sendInteractionNotification:', result);
        }).catch((error) => {
          console.error('[handleLikeAction] Erro ao enviar notificação de like:', error);
        });

        // Criar notificação interna agregada (sem rate limit)
        internalNotificationService.createOrUpdateAggregatedNotification({
          userId: post.userId,
          type: 'like',
          actorId: actor.id,
          postId: postId,
        }).catch((error) => {
          console.error('[handleLikeAction] Erro ao criar notificação interna:', error);
        });
      } else {
        console.log('[handleLikeAction] Actor não encontrado para userId:', userId);
      }
    } else {
      console.log('[handleLikeAction] Não enviando notificação - post não encontrado ou é o próprio autor');
    }
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
  parentCommentId?: string;
}): Promise<void> {
  const { postId, userId, content, parentCommentId } = payload;

  // Cria comentário (contador é atualizado via trigger)
  const comment = await prisma.feedComment.create({
    data: {
      postId,
      userId,
      content,
      parentCommentId: parentCommentId || null,
    },
  });

  // Buscar informações do post
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      slug: true,
    },
  });

  // Buscar informações do usuário que comentou
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!actor) {
    return;
  }

  // Se é resposta a um comentário
  if (parentCommentId) {
    // Buscar comentário pai
    const parentComment = await prisma.feedComment.findUnique({
      where: { id: parentCommentId },
      select: { userId: true },
    });

    if (parentComment && parentComment.userId !== userId) {
      // Criar notificação de resposta para o autor do comentário pai
      internalNotificationService.createNotification({
        userId: parentComment.userId,
        type: 'reply',
        actorId: actor.id,
        postId: postId,
        commentId: parentCommentId,
        content: content.substring(0, 100), // Preview
      }).catch((error) => {
        console.error('Erro ao criar notificação de resposta:', error);
      });
    }
  } else if (post && post.userId !== userId) {
    // É comentário no post (não resposta)
    // Preparar preview do comentário (primeiros 100 caracteres)
    const commentPreview = content.length > 100
      ? content.substring(0, 100) + '...'
      : content;

    // Criar preview do conteúdo do post (primeiros 50 caracteres)
    const postPreview = post.content.length > 50
      ? post.content.substring(0, 50) + '...'
      : post.content;

    // Enviar notificação push (não bloqueia se falhar)
    pushNotificationService.sendInteractionNotification(post.userId, {
      postId: postId,
      postSlug: post.slug,
      actorId: actor.id,
      actorName: actor.name || 'Alguém',
      interactionType: 'comment',
      postTitle: postPreview,
      commentPreview,
    }).catch((error) => {
      console.error('Erro ao enviar notificação de comentário:', error);
    });

    // Criar notificação interna agregada (sem rate limit)
    internalNotificationService.createOrUpdateAggregatedNotification({
      userId: post.userId,
      type: 'comment',
      actorId: actor.id,
      postId: postId,
    }).catch((error) => {
      console.error('Erro ao criar notificação interna de comentário:', error);
    });
  }

  // Invalida cache do feed
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





