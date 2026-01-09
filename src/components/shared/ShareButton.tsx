'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  shareViaWebAPI,
  shareViaWhatsApp,
  shareViaTwitter,
  shareViaFacebook,
  shareViaLinkedIn,
  copyToClipboard,
  isWebShareAvailable,
} from '@/lib/utils/share';
import {
  WhatsappIcon,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
} from 'react-share';

export interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ShareButton({
  url,
  title,
  description,
  variant = 'icon',
  size = 'default',
  className,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleWebShare = async () => {
    try {
      setIsSharing(true);
      await shareViaWebAPI({ url, title, description });
    } catch (error) {
      // Se Web Share não disponível ou cancelado, não faz nada
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'linkedin') => {
    switch (platform) {
      case 'whatsapp':
        shareViaWhatsApp(url, description || title);
        break;
      case 'twitter':
        shareViaTwitter(url, description || title);
        break;
      case 'facebook':
        shareViaFacebook(url);
        break;
      case 'linkedin':
        shareViaLinkedIn(url, title);
        break;
    }
  };

  // Mobile: usa Web Share API se disponível
  if (isWebShareAvailable() && variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleWebShare}
        disabled={isSharing}
        className={className}
        aria-label="Compartilhar"
      >
        {isSharing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Desktop: dropdown com opções
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'icon' ? 'ghost' : 'outline'}
          size={size}
          className={className}
          aria-label="Compartilhar"
        >
          {variant === 'icon' ? (
            copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )
          ) : (
            <>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copiado!' : 'Compartilhar'}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <div className="flex items-center gap-2">
            <WhatsappIcon size={20} round />
            WhatsApp
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <div className="flex items-center gap-2">
            <TwitterIcon size={20} round />
            Twitter/X
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <div className="flex items-center gap-2">
            <FacebookIcon size={20} round />
            Facebook
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <div className="flex items-center gap-2">
            <LinkedinIcon size={20} round />
            LinkedIn
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

