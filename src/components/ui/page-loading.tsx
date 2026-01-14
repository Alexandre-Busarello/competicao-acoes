interface PageLoadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageLoading({ title, description, className = '' }: PageLoadingProps) {
  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${className}`}>
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        {/* Logo animado */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 relative">
            {/* Logo SVG - usando a logo combinada */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logo-combinada-claro.svg" 
                alt="Hold Arena" 
                className="w-full h-full object-contain dark:hidden animate-pulse"
              />
              <img 
                src="/logo-combinada-escuro.svg" 
                alt="Hold Arena" 
                className="w-full h-full object-contain hidden dark:block animate-pulse"
              />
            </div>
            {/* Anel rotativo */}
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        {/* Texto */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}


