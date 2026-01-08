#!/usr/bin/env python3
"""
Script para gerar splash screens do iOS a partir do logo.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# Tamanhos de splash screen do iOS (em pontos)
SPLASH_SIZES = [
    # iPhone
    (640, 1136),   # iPhone SE (1st gen) - 2x
    (750, 1334),   # iPhone 8 - 2x
    (828, 1792),   # iPhone XR - 2x
    (1125, 2436),  # iPhone X/XS - 3x
    (1242, 2688),  # iPhone XS Max - 3x
    (1284, 2778),  # iPhone 12 Pro Max - 3x
    (1170, 2532),  # iPhone 12/13 - 3x
    (1290, 2796),  # iPhone 14 Pro Max - 3x
    (1179, 2556),  # iPhone 14 Pro - 3x
    (1284, 2778),  # iPhone 15 Pro Max - 3x
    (1179, 2556),  # iPhone 15 Pro - 3x
    # iPad
    (1536, 2048),  # iPad (1st-5th gen) - 2x
    (1668, 2224),  # iPad Pro 10.5" - 2x
    (2048, 2732),  # iPad Pro 12.9" - 2x
]

def create_splash_screen(logo_path, width, height, output_path):
    """
    Cria uma splash screen com o logo centralizado.
    """
    # Criar imagem com fundo branco
    splash = Image.new("RGB", (width, height), (255, 255, 255))
    
    # Carregar logo
    try:
        logo = Image.open(logo_path).convert("RGBA")
    except Exception as e:
        print(f"❌ Erro ao carregar logo: {e}")
        return False
    
    # Calcular tamanho do logo (máximo 40% da menor dimensão)
    max_logo_size = int(min(width, height) * 0.4)
    
    # Manter proporção do logo
    logo_aspect = logo.width / logo.height
    if logo_aspect > 1:
        logo_width = max_logo_size
        logo_height = int(max_logo_size / logo_aspect)
    else:
        logo_height = max_logo_size
        logo_width = int(max_logo_size * logo_aspect)
    
    # Redimensionar logo
    logo_resized = logo.resize((logo_width, logo_height), Image.LANCZOS)
    
    # Centralizar logo
    x = (width - logo_width) // 2
    y = (height - logo_height) // 2
    
    # Criar imagem RGBA para colar o logo
    logo_rgb = Image.new("RGB", (logo_width, logo_height), (255, 255, 255))
    logo_rgb.paste(logo_resized, (0, 0), logo_resized)
    
    # Colar logo na splash screen
    splash.paste(logo_rgb, (x, y))
    
    # Salvar
    splash.save(output_path, "PNG", optimize=True)
    return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    logo_path = os.path.join(project_root, "public", "logo.png")
    splash_dir = os.path.join(project_root, "public", "splash")
    
    # Verificar se o logo existe
    if not os.path.exists(logo_path):
        print(f"❌ Erro: Logo não encontrado em {logo_path}")
        sys.exit(1)
    
    # Criar diretório de splash screens se não existir
    os.makedirs(splash_dir, exist_ok=True)
    
    print("📱 Gerando splash screens para iOS...")
    
    created_count = 0
    for width, height in SPLASH_SIZES:
        filename = f"apple-splash-{width}-{height}.png"
        output_path = os.path.join(splash_dir, filename)
        
        if create_splash_screen(logo_path, width, height, output_path):
            print(f"✓ Criado: {filename} ({width}x{height})")
            created_count += 1
    
    print(f"\n✅ {created_count} splash screens gerados!")
    print(f"Splash screens salvos em: {splash_dir}")

if __name__ == "__main__":
    main()

