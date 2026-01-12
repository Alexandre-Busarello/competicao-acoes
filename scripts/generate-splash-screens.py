#!/usr/bin/env python3
"""
Script para gerar splash screens do iOS a partir dos SVGs de logo.
"""

from PIL import Image, ImageDraw, ImageFont
import cairosvg
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

def svg_to_pil_image(svg_path, width, height):
    """
    Converte SVG para PIL Image.
    """
    try:
        with open(svg_path, 'rb') as f:
            svg_data = f.read()
        
        # Converter SVG para PNG em memória
        png_data = cairosvg.svg2png(
            bytestring=svg_data,
            output_width=width,
            output_height=height
        )
        
        # Converter bytes para PIL Image
        from io import BytesIO
        return Image.open(BytesIO(png_data)).convert("RGBA")
    except Exception as e:
        print(f"❌ Erro ao converter SVG: {e}")
        return None

def create_splash_screen(logo_svg_path, width, height, output_path, bg_color=(255, 255, 255)):
    """
    Cria uma splash screen com o logo centralizado a partir de SVG.
    """
    # Criar imagem com fundo
    splash = Image.new("RGB", (width, height), bg_color)
    
    # Converter SVG para imagem PIL
    # Primeiro converter em tamanho maior para melhor qualidade
    temp_size = max(width, height) * 2
    logo = svg_to_pil_image(logo_svg_path, temp_size, temp_size)
    
    if logo is None:
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
    
    # Usar logo combinada claro para splash screens (fundo branco)
    logo_svg_path = os.path.join(project_root, "public", "logo-combinada-claro.svg")
    splash_dir = os.path.join(project_root, "public", "splash")
    
    # Verificar se o logo SVG existe
    if not os.path.exists(logo_svg_path):
        print(f"❌ Erro: Logo SVG não encontrado em {logo_svg_path}")
        sys.exit(1)
    
    # Criar diretório de splash screens se não existir
    os.makedirs(splash_dir, exist_ok=True)
    
    print("📱 Gerando splash screens para iOS...")
    
    created_count = 0
    for width, height in SPLASH_SIZES:
        filename = f"apple-splash-{width}-{height}.png"
        output_path = os.path.join(splash_dir, filename)
        
        if create_splash_screen(logo_svg_path, width, height, output_path):
            print(f"✓ Criado: {filename} ({width}x{height})")
            created_count += 1
    
    print(f"\n✅ {created_count} splash screens gerados!")
    print(f"Splash screens salvos em: {splash_dir}")

if __name__ == "__main__":
    main()

