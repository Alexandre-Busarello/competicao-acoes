import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed para variações de mensagens de notificação
 */
async function seedNotificationVariations() {
  console.log('🌱 Iniciando seed de variações de notificações...');

  const variations = [
    // Ranking Top 3
    {
      type: 'ranking_top3',
      variation: 'A',
      title: '{medal} Parabéns! Você entrou no top 3!',
      body: 'Você está na {position}ª posição no ranking {period}',
    },
    {
      type: 'ranking_top3',
      variation: 'B',
      title: '🎯 Você está entre os melhores traders!',
      body: 'Parabéns! Você alcançou a {position}ª posição no ranking {period}',
    },
    {
      type: 'ranking_top3',
      variation: 'C',
      title: '⭐ Top 3 alcançado! Continue assim!',
      body: 'Incrível! Você está na {position}ª posição no ranking {period}',
    },
    {
      type: 'ranking_top3',
      variation: 'D',
      title: '🏆 Incrível! Você está no pódio!',
      body: 'Parabéns pela {position}ª posição no ranking {period}!',
    },
    {
      type: 'ranking_top3',
      variation: 'F',
      title: '💎 Você faz parte da elite!',
      body: 'Top 3 alcançado! Você está na {position}ª posição no ranking {period}',
    },

    // Ranking Up
    {
      type: 'ranking_up',
      variation: 'A',
      title: '📈 Subiu no ranking!',
      body: 'Você subiu {positions} posição{positions} e agora está na {position}ª posição',
    },
    {
      type: 'ranking_up',
      variation: 'B',
      title: '🚀 Progresso incrível!',
      body: 'Parabéns! Você subiu {positions} posição{positions} no ranking',
    },
    {
      type: 'ranking_up',
      variation: 'C',
      title: '💪 Você está evoluindo!',
      body: 'Ótimo trabalho! Você subiu {positions} posição{positions} e agora está na {position}ª posição',
    },
    {
      type: 'ranking_up',
      variation: 'D',
      title: '🎯 Subida no ranking!',
      body: 'Excelente! Você subiu {positions} posição{positions} e alcançou a {position}ª posição',
    },
    {
      type: 'ranking_up',
      variation: 'F',
      title: '⭐ Continue assim!',
      body: 'Você subiu {positions} posição{positions} e agora está na {position}ª posição. Mantenha o foco!',
    },

    // Ranking Down
    {
      type: 'ranking_down',
      variation: 'A',
      title: '📉 Atenção: Desceu no ranking',
      body: 'Você desceu {positions} posição{positions} e agora está na {position}ª posição',
    },
    {
      type: 'ranking_down',
      variation: 'B',
      title: '⚠️ Sua posição mudou',
      body: 'Você está na {position}ª posição. Continue investindo para subir novamente!',
    },
    {
      type: 'ranking_down',
      variation: 'C',
      title: '💪 É hora de reagir!',
      body: 'Você desceu {positions} posição{positions}. Não desista, continue investindo!',
    },
    {
      type: 'ranking_down',
      variation: 'D',
      title: '🔄 Volte ao topo!',
      body: 'Você está na {position}ª posição. Analise sua estratégia e volte mais forte!',
    },
    {
      type: 'ranking_down',
      variation: 'F',
      title: '📊 Sua posição atualizada',
      body: 'Você está na {position}ª posição. Continue investindo para melhorar!',
    },

    // Engagement
    {
      type: 'engagement',
      variation: 'A',
      title: '🔥 Post em alta!',
      body: '"{postTitle}" está gerando muito engajamento na comunidade!',
    },
    {
      type: 'engagement',
      variation: 'B',
      title: '💬 Discussão interessante!',
      body: 'Um post está recebendo muita atenção: "{postTitle}"',
    },
    {
      type: 'engagement',
      variation: 'C',
      title: '⭐ Post popular!',
      body: '"{postTitle}" está bombando! Não perca essa discussão',
    },
    {
      type: 'engagement',
      variation: 'D',
      title: '🎯 Alta interação!',
      body: 'Um post está gerando muito engajamento: "{postTitle}"',
    },
    {
      type: 'engagement',
      variation: 'F',
      title: '🚀 Post viral!',
      body: '"{postTitle}" está em alta! Confira o que está rolando',
    },

    // Following
    {
      type: 'following',
      variation: 'A',
      title: '👤 Nova publicação',
      body: '{authorName} publicou algo novo que pode te interessar',
    },
    {
      type: 'following',
      variation: 'B',
      title: '📝 Atualização do feed',
      body: '{authorName} acabou de compartilhar algo novo',
    },
    {
      type: 'following',
      variation: 'C',
      title: '💬 Nova postagem',
      body: '{authorName} publicou no feed. Confira!',
    },
    {
      type: 'following',
      variation: 'D',
      title: '⭐ Conteúdo novo',
      body: '{authorName} compartilhou algo que você pode gostar',
    },
    {
      type: 'following',
      variation: 'F',
      title: '🔔 Atualização',
      body: '{authorName} acabou de postar. Não perca!',
    },

    // Re-engajamento
    {
      type: 'reengagement',
      variation: 'A',
      title: '🎁 Tem um prêmio esperando por você!',
      body: 'Volte e descubra o que mudou na plataforma',
    },
    {
      type: 'reengagement',
      variation: 'B',
      title: '⚡ Você está perdendo oportunidades incríveis!',
      body: 'Volte e veja o que está acontecendo no ranking',
    },
    {
      type: 'reengagement',
      variation: 'C',
      title: '🚀 Volte e descubra o que mudou!',
      body: 'Tem novidades esperando por você na plataforma',
    },
    {
      type: 'reengagement',
      variation: 'D',
      title: '💎 Sua jornada continua aqui!',
      body: 'Volte e continue sua trajetória no ranking',
    },
    {
      type: 'reengagement',
      variation: 'F',
      title: '🎯 Não perca sua posição no ranking!',
      body: 'Volte e mantenha-se competitivo na plataforma',
    },
  ];

  for (const variation of variations) {
    await prisma.notificationMessageVariation.upsert({
      where: {
        type_variation: {
          type: variation.type,
          variation: variation.variation,
        },
      },
      update: {
        title: variation.title,
        body: variation.body,
        isActive: true,
      },
      create: variation,
    });
  }

  console.log(`✅ Seed concluído: ${variations.length} variações criadas/atualizadas`);
}

seedNotificationVariations()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

