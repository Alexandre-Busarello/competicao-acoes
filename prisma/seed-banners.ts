import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const banners = [
  {
    variation: 'A',
    title: 'Acesse TODAS as carteiras',
    description: 'Veja as carteiras completas de todos os investidores da comunidade',
    benefit: 'Acesso Total',
    ctaText: 'Tornar-se Membro Pro',
  },
  {
    variation: 'B',
    title: 'Receba recompensa DOBRADA',
    description: 'Ganhe o dobro de recompensas nos prêmios anuais',
    benefit: 'Recompensa Dobrada',
    ctaText: 'Tornar-se Membro Pro',
  },
  {
    variation: 'C',
    title: 'Veja rankings completos',
    description: 'Acesse rankings completos e históricos de todos os períodos',
    benefit: 'Ranking Exclusivo',
    ctaText: 'Tornar-se Membro Pro',
  },
  {
    variation: 'D',
    title: 'Desbloqueie carteiras sem blur',
    description: 'Veja todas as carteiras sem nenhum bloqueio ou blur',
    benefit: 'Sem Blur',
    ctaText: 'Tornar-se Membro Pro',
  },
  {
    variation: 'E',
    title: 'Funcionalidades exclusivas PRO',
    description: 'Desbloqueie todas as funcionalidades exclusivas para membros PRO',
    benefit: 'Funcionalidades Exclusivas',
    ctaText: 'Tornar-se Membro Pro',
  },
];

async function main() {
  console.log('🌱 Seeding banners...');

  for (const banner of banners) {
    const existing = await prisma.feedBanner.findUnique({
      where: { variation: banner.variation },
    });

    if (existing) {
      console.log(`⏭️  Banner ${banner.variation} já existe, pulando...`);
      continue;
    }

    await prisma.feedBanner.create({
      data: banner,
    });

    console.log(`✅ Banner ${banner.variation} criado`);
  }

  console.log('✨ Seeding concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao fazer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


















