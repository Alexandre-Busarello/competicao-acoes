import { redirect } from 'next/navigation';

/**
 * Redirect 301 permanente de /post/[slug] para /posts/[slug]
 * Mantém compatibilidade com links antigos e melhora SEO
 */
export default function PostRedirect({ params }: { params: { slug: string } }) {
  redirect(`/posts/${params.slug}`);
}

