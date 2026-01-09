#!/usr/bin/env python3
"""
Script para processar os favicons removendo fundos.
- favicon-claro.png: remove fundo escuro (mantém branco)
- favicon-escuro.png: remove apenas fundo branco (mantém fundo escuro e logo)
"""

from PIL import Image
import os
import sys

def remove_dark_background(image_path, threshold=100):
    """
    Remove fundo escuro de uma imagem.
    threshold: valor de 0-255, pixels abaixo deste valor serão considerados escuros
    """
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Se o pixel for escuro (R, G, B todos abaixo do threshold), torna transparente
        # Mas mantém pixels brancos e coloridos
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            new_data.append((255, 255, 255, 0))  # Transparente
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

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

def remove_dark_and_white_background(image_path, dark_threshold=100, white_threshold=240):
    """
    Remove fundo escuro E branco de uma imagem.
    Útil para favicon-escuro que pode ter áreas muito escuras ou muito claras no fundo.
    """
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b = item[0], item[1], item[2]
        # Se for muito escuro (fundo escuro) ou muito claro (fundo branco), torna transparente
        is_dark = r < dark_threshold and g < dark_threshold and b < dark_threshold
        is_white = r > white_threshold and g > white_threshold and b > white_threshold
        
        if is_dark or is_white:
            new_data.append((255, 255, 255, 0))  # Transparente
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    public_dir = os.path.join(project_root, "public")
    
    favicon_claro_path = os.path.join(public_dir, "favicon-claro.png")
    favicon_escuro_path = os.path.join(public_dir, "favicon-escuro.png")
    
    print("🖼️  Processando favicons...\n")
    
    # Processar favicon-claro: remover fundo escuro (mantém branco)
    if os.path.exists(favicon_claro_path):
        print("📝 Processando favicon-claro.png...")
        print("  Removendo fundo escuro (mantendo branco)...")
        favicon_claro_processed = remove_dark_background(favicon_claro_path, threshold=100)
        favicon_claro_processed.save(favicon_claro_path, "PNG", optimize=True)
        print(f"✓ favicon-claro.png processado e salvo\n")
    else:
        print(f"⚠️  Aviso: favicon-claro.png não encontrado em {favicon_claro_path}\n")
    
    # Processar favicon-escuro: remover apenas fundo branco (mantém fundo escuro e logo)
    if os.path.exists(favicon_escuro_path):
        print("📝 Processando favicon-escuro.png...")
        print("  Removendo apenas fundo branco (mantendo fundo escuro e logo)...")
        # Remove apenas fundo branco, mantendo o fundo escuro do quadrado
        favicon_escuro_processed = remove_white_background(favicon_escuro_path, threshold=240)
        favicon_escuro_processed.save(favicon_escuro_path, "PNG", optimize=True)
        print(f"✓ favicon-escuro.png processado e salvo\n")
    else:
        print(f"⚠️  Aviso: favicon-escuro.png não encontrado em {favicon_escuro_path}\n")
    
    print("✅ Processamento concluído!")

if __name__ == "__main__":
    main()

