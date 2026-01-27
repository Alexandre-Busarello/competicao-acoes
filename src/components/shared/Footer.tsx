import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Structured data para navegação do site
  const navigationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Hold Arena Navigation',
    url: baseUrl,
    mainEntity: [
      {
        '@type': 'MenuItem',
        name: 'Feed',
        url: `${baseUrl}/feed`,
      },
      {
        '@type': 'MenuItem',
        name: 'Ranking',
        url: `${baseUrl}/ranking`,
      },
      {
        '@type': 'MenuItem',
        name: 'Como Funciona',
        url: `${baseUrl}/como-funciona`,
      },
      {
        '@type': 'MenuItem',
        name: 'Rede Social do Investidor',
        url: `${baseUrl}/rede-social-investidor`,
      },
    ],
  };

  return (
    <>
      {/* Structured data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(navigationStructuredData),
        }}
      />
      
      <footer className="border-t border-border bg-background mt-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Links principais */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Navegação</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/feed" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Feed
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/ranking" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ranking
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/como-funciona" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/rede-social-investidor" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Rede Social do Investidor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sobre */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Sobre</h3>
              <p className="text-muted-foreground text-sm">
                Hold Arena é a rede social do investidor. Teste sua estratégia de investimentos, 
                compartilhe sua carteira e competa no ranking público com premiação por performance.
              </p>
            </div>

            {/* Informações */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Hold Arena</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Onde investidores se testam.
              </p>
              <p className="text-muted-foreground text-xs">
                © {currentYear} Hold Arena. Todos os direitos reservados.
              </p>
              <p className="text-muted-foreground text-xs mt-2 opacity-70">
                Dados das empresas do GGB fornecidos por{' '}
                <a 
                  href="https://precojusto.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Preço Justo AI - Análise Fundamentalista de Ações da B3"
                  className="hover:underline"
                >
                  Preço Justo AI
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

