#!/usr/bin/env python3
"""
Script para processar o logo e gerar ícones PWA.
Remove o fundo branco e cria versões em diferentes tamanhos.
"""

from PIL import Image
import os
import sys

def remove_white_background(image_path, threshold=240):
    """
    Remove fundo branco de uma imagem.
    threshold: valor de 0-255, pixels acima deste valor serão considerados brancos
    """
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Se o pixel for branco (R, G, B todos acima do threshold), torna transparente
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))  # Transparente
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def create_icon(source_img, size, output_path, maskable=False):
    """
    Cria um ícone redimensionado a partir da imagem fonte.
    Se maskable=True, adiciona padding para criar área segura.
    """
    if maskable:
        # Para maskable icons, precisamos de padding (80% do tamanho é área segura)
        safe_size = int(size * 0.8)
        padding = (size - safe_size) // 2
        
        # Criar imagem com fundo transparente
        icon = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        
        # Redimensionar imagem original para o tamanho seguro
        resized = source_img.resize((safe_size, safe_size), Image.LANCZOS)
        
        # Colar no centro
        icon.paste(resized, (padding, padding), resized)
    else:
        # Para ícones normais, redimensionar diretamente
        icon = source_img.resize((size, size), Image.LANCZOS)
    
    # Salvar
    icon.save(output_path, "PNG", optimize=True)
    print(f"✓ Criado: {output_path} ({size}x{size})")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    logo_path = os.path.join(project_root, "public", "logo.png")
    icons_dir = os.path.join(project_root, "public", "icons")
    
    # Verificar se o logo existe
    if not os.path.exists(logo_path):
        print(f"❌ Erro: Logo não encontrado em {logo_path}")
        sys.exit(1)
    
    # Criar diretório de ícones se não existir
    os.makedirs(icons_dir, exist_ok=True)
    
    print("🖼️  Processando logo...")
    
    # Remover fundo branco
    print("  Removendo fundo branco...")
    logo_no_bg = remove_white_background(logo_path, threshold=240)
    
    # Salvar versão do logo sem fundo (opcional, para referência)
    logo_no_bg_path = os.path.join(project_root, "public", "logo-no-bg.png")
    logo_no_bg.save(logo_no_bg_path, "PNG", optimize=True)
    print(f"✓ Logo sem fundo salvo: logo-no-bg.png")
    
    # Criar ícones PWA
    print("\n📱 Gerando ícones PWA...")
    
    # Ícones normais
    create_icon(logo_no_bg, 192, os.path.join(icons_dir, "icon-192x192.png"), maskable=False)
    create_icon(logo_no_bg, 512, os.path.join(icons_dir, "icon-512x512.png"), maskable=False)
    
    # Ícones maskable (com padding)
    create_icon(logo_no_bg, 192, os.path.join(icons_dir, "icon-maskable-192x192.png"), maskable=True)
    create_icon(logo_no_bg, 512, os.path.join(icons_dir, "icon-maskable-512x512.png"), maskable=True)
    
    print("\n✅ Processamento concluído!")
    print(f"\nÍcones gerados em: {icons_dir}")

if __name__ == "__main__":
    main()

