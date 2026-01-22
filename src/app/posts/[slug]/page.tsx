import { Metadata } from 'next';
import { PostContent } from '@/components/feed/PostContent';
import { PostContentServer } from '@/components/feed/PostContentServer';
import { feedService } from '@/lib/services/feed-service';
import { getServerSession } from '@/lib/auth/server';

async function getPostData(slug: string) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user.id;
    const post = await feedService.getPostBySlug(slug, currentUserId);
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostData(params.slug);

  if (!post) {
    return {
      title: 'Post não encontrado',
    };
  }

  const title = `${post.user.name} - ${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}`;
  const description = post.content.substring(0, 160);
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/posts/${params.slug}`;
  const publishedTime = new Date(post.createdAt).toISOString();
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;

  return {
    title,
    description,
    keywords: [
      'investimentos',
      'ações',
      'bolsa de valores',
      'análise técnica',
      'análise fundamentalista',
      'carteira de investimentos',
      'estratégias de investimento',
      'análise de investimentos',
      'comunidade de investidores',
      'social trading',
      'hold',
      'análise de mercado',
    ],
    authors: [{ name: post.user.name }],
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Hold Arena',
      publishedTime,
      modifiedTime,
      authors: [post.user.name],
      images: post.user.avatarUrl
        ? [
            {
              url: post.user.avatarUrl,
              width: 400,
              height: 400,
              alt: post.user.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: post.user.avatarUrl ? [post.user.avatarUrl] : [],
      creator: `@${post.user.name.replace(/\s+/g, '')}`,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center py-16">
            <p className="text-muted-foreground">Post não encontrado</p>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/posts/${params.slug}`;
  const publishedTime = new Date(post.createdAt).toISOString();
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;

  // Structured data JSON-LD para SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.content.substring(0, 110),
    description: post.content.substring(0, 160),
    author: {
      '@type': 'Person',
      name: post.user.name,
      url: `${baseUrl}/perfil/${post.user.slug || post.user.id}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hold Arena',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-combinada-claro.svg`,
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleBody: post.content,
    url: url,
    ...(post.user.avatarUrl && {
      image: {
        '@type': 'ImageObject',
        url: post.user.avatarUrl,
      },
    }),
  };

  // Renderizar conteúdo inicial no servidor para SEO
  // PostContent client-side será usado para interatividade (hydration)
  return (
    <>
      {/* Structured data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      {/* Conteúdo SSR visível para crawlers - renderizado no servidor */}
      <PostContentServer post={post} />
      
      {/* Componente client-side para interatividade (likes, comentários, edição) */}
      {/* Este componente faz fetch e renderiza, mas o conteúdo SSR já está no HTML para crawlers */}
      <div suppressHydrationWarning>
        <PostContent slug={params.slug} />
      </div>
    </>
  );
}

