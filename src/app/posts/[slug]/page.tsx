import { Metadata } from 'next';
import { PostContent } from '@/components/feed/PostContent';

async function getPostData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/posts/${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
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
    keywords: ['investimentos', 'ações', 'bolsa de valores', 'análise técnica', 'carteira de investimentos'],
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

export default function PostPage({ params }: { params: { slug: string } }) {
  return <PostContent slug={params.slug} />;
}

