#!/usr/bin/env python3
"""
Script para gerar ícones PWA a partir dos SVGs de favicon.
Gera ícones em diferentes tamanhos para uso no PWA.
"""

from PIL import Image
import cairosvg
import os
import sys
import io

# Tamanhos de ícones PWA
ICON_SIZES = [
    (192, 192),
    (512, 512),
]

def svg_to_png(svg_path, width, height, output_path, background_color=None):
    """
    Converte SVG para PNG usando cairosvg.
    """
    try:
        # Ler SVG
        with open(svg_path, 'rb') as f:
            svg_data = f.read()
        
        # Converter para PNG
        if background_color:
            # Criar PNG com fundo
            png_data = cairosvg.svg2png(
                bytestring=svg_data,
                output_width=width,
                output_height=height,
                background_color=background_color
            )
        else:
            # PNG transparente
            png_data = cairosvg.svg2png(
                bytestring=svg_data,
                output_width=width,
                output_height=height
            )
        
        # Salvar PNG
        with open(output_path, 'wb') as f:
            f.write(png_data)
        
        return True
    except Exception as e:
        print(f"❌ Erro ao converter {svg_path}: {e}")
        return False

def create_maskable_icon(icon_path, output_path):
    """
    Cria versão maskable do ícone adicionando padding seguro.
    Ícones maskable devem ter conteúdo seguro dentro de 80% da área central.
    """
    try:
        # Carregar ícone
        icon = Image.open(icon_path).convert("RGBA")
        width, height = icon.size
        
        # Criar nova imagem maior (padding de 20% em cada lado = 40% total)
        # Para ter conteúdo seguro em 80% central, precisamos aumentar em 25% (1/0.8)
        new_size = int(max(width, height) * 1.25)
        new_icon = Image.new("RGBA", (new_size, new_size), (255, 255, 255, 0))
        
        # Calcular posição para centralizar
        x = (new_size - width) // 2
        y = (new_size - height) // 2
        
        # Colar ícone original no centro
        new_icon.paste(icon, (x, y), icon)
        
        # Redimensionar de volta para o tamanho original
        final_icon = new_icon.resize((width, height), Image.LANCZOS)
        
        # Salvar
        final_icon.save(output_path, "PNG", optimize=True)
        return True
    except Exception as e:
        print(f"❌ Erro ao criar maskable icon: {e}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    favicon_claro_svg = os.path.join(project_root, "public", "favicon-claro.svg")
    favicon_escuro_svg = os.path.join(project_root, "public", "favicon-escuro.svg")
    icons_dir = os.path.join(project_root, "public", "icons")
    
    # Verificar se os SVGs existem
    if not os.path.exists(favicon_claro_svg):
        print(f"❌ Erro: favicon-claro.svg não encontrado em {favicon_claro_svg}")
        sys.exit(1)
    
    if not os.path.exists(favicon_escuro_svg):
        print(f"❌ Erro: favicon-escuro.svg não encontrado em {favicon_escuro_svg}")
        sys.exit(1)
    
    # Criar diretório de ícones se não existir
    os.makedirs(icons_dir, exist_ok=True)
    
    print("🎨 Gerando ícones PWA...\n")
    
    # Usar favicon claro como base (pode ser ajustado)
    base_svg = favicon_claro_svg
    
    created_count = 0
    
    for width, height in ICON_SIZES:
        # Ícone normal
        filename = f"icon-{width}x{height}.png"
        output_path = os.path.join(icons_dir, filename)
        
        if svg_to_png(base_svg, width, height, output_path):
            print(f"✓ Criado: {filename} ({width}x{height})")
            created_count += 1
        
        # Ícone maskable
        maskable_filename = f"icon-maskable-{width}x{height}.png"
        maskable_output_path = os.path.join(icons_dir, maskable_filename)
        
        if create_maskable_icon(output_path, maskable_output_path):
            print(f"✓ Criado: {maskable_filename} ({width}x{height})")
            created_count += 1
    
    print(f"\n✅ {created_count} ícones gerados!")
    print(f"Ícones salvos em: {icons_dir}")

if __name__ == "__main__":
    main()

