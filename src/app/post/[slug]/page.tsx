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

  const title = `${post.user.name} - ${post.content.substring(0, 60)}...`;
  const description = post.content.substring(0, 160);
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/post/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Arena do Investidor',
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
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  return <PostContent slug={params.slug} />;
}
