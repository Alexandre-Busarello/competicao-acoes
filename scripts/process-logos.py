#!/usr/bin/env python3
"""
Script para processar os logos removendo fundos e adicionando padding uniforme.
Usa flood fill conservador a partir das bordas para preservar texto.
"""

from PIL import Image
import os
import sys
from collections import deque

def flood_fill_from_edges_conservative(img, threshold=5):
    """
    Remove fundo usando flood fill conservador a partir das bordas.
    threshold: tolerância de cor muito baixa para preservar texto
    """
    width, height = img.size
    img_array = img.load()
    
    # Criar máscara de pixels a remover (inicialmente todos False)
    to_remove = [[False for _ in range(height)] for _ in range(width)]
    
    # Função para verificar se dois pixels são muito similares (threshold baixo)
    def is_very_similar(p1, p2, threshold):
        if len(p1) < 3 or len(p2) < 3:
            return False
        r_diff = abs(p1[0] - p2[0])
        g_diff = abs(p1[1] - p2[1])
        b_diff = abs(p1[2] - p2[2])
        # Apenas considerar muito similar se diferença for muito pequena
        return r_diff <= threshold and g_diff <= threshold and b_diff <= threshold
    
    # Obter cor de referência das bordas (média das cores das bordas)
    border_colors = []
    for x in range(width):
        pixel_top = img_array[x, 0]
        if len(pixel_top) > 3 and pixel_top[3] > 0:  # Se não for transparente
            border_colors.append(pixel_top[:3])
        pixel_bottom = img_array[x, height-1]
        if len(pixel_bottom) > 3 and pixel_bottom[3] > 0:
            border_colors.append(pixel_bottom[:3])
    for y in range(height):
        pixel_left = img_array[0, y]
        if len(pixel_left) > 3 and pixel_left[3] > 0:
            border_colors.append(pixel_left[:3])
        pixel_right = img_array[width-1, y]
        if len(pixel_right) > 3 and pixel_right[3] > 0:
            border_colors.append(pixel_right[:3])
    
    if not border_colors:
        return img  # Se não houver cores nas bordas, retornar imagem original
    
    # Calcular cor média das bordas
    avg_r = sum(c[0] for c in border_colors) // len(border_colors)
    avg_g = sum(c[1] for c in border_colors) // len(border_colors)
    avg_b = sum(c[2] for c in border_colors) // len(border_colors)
    reference_color = (avg_r, avg_g, avg_b)
    
    # Flood fill conservador a partir das bordas
    queue = deque()
    visited = [[False for _ in range(height)] for _ in range(width)]
    
    # Adicionar apenas pixels das bordas que são muito similares à cor de referência
    for x in range(width):
        if not visited[x][0]:
            pixel = img_array[x, 0]
            if len(pixel) > 3 and pixel[3] > 0:
                pixel_color = pixel[:3]
                if is_very_similar(pixel_color, reference_color, threshold):
                    queue.append((x, 0))
        if not visited[x][height-1]:
            pixel = img_array[x, height-1]
            if len(pixel) > 3 and pixel[3] > 0:
                pixel_color = pixel[:3]
                if is_very_similar(pixel_color, reference_color, threshold):
                    queue.append((x, height-1))
    for y in range(height):
        if not visited[0][y]:
            pixel = img_array[0, y]
            if len(pixel) > 3 and pixel[3] > 0:
                pixel_color = pixel[:3]
                if is_very_similar(pixel_color, reference_color, threshold):
                    queue.append((0, y))
        if not visited[width-1][y]:
            pixel = img_array[width-1, y]
            if len(pixel) > 3 and pixel[3] > 0:
                pixel_color = pixel[:3]
                if is_very_similar(pixel_color, reference_color, threshold):
                    queue.append((width-1, y))
    
    # Executar flood fill conservador
    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        if visited[x][y]:
            continue
        
        pixel = img_array[x, y]
        if len(pixel) <= 3 or pixel[3] == 0:  # Se já for transparente, pular
            continue
        
        pixel_color = pixel[:3]
        # Só remover se for MUITO similar (threshold baixo preserva texto)
        if is_very_similar(pixel_color, reference_color, threshold):
            to_remove[x][y] = True
            visited[x][y] = True
            
            # Adicionar vizinhos apenas se também forem muito similares
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if not visited[nx][ny]:
                        neighbor_pixel = img_array[nx, ny]
                        if len(neighbor_pixel) > 3 and neighbor_pixel[3] > 0:
                            neighbor_color = neighbor_pixel[:3]
                            if is_very_similar(neighbor_color, reference_color, threshold):
                                queue.append((nx, ny))
    
    # Aplicar remoção
    new_data = []
    for y in range(height):
        for x in range(width):
            pixel = img_array[x, y]
            if to_remove[x][y]:
                new_data.append((255, 255, 255, 0))  # Transparente
            else:
                new_data.append(pixel)
    
    img.putdata(new_data)
    return img

def remove_dark_background_smart(image_path):
    """
    Remove fundo escuro usando flood fill conservador.
    Threshold baixo (5) preserva texto.
    """
    img = Image.open(image_path).convert("RGBA")
    return flood_fill_from_edges_conservative(img, threshold=5)

def remove_white_background_smart(image_path):
    """
    Remove fundo branco usando flood fill conservador.
    Threshold baixo (5) preserva texto.
    """
    img = Image.open(image_path).convert("RGBA")
    return flood_fill_from_edges_conservative(img, threshold=5)

def add_uniform_padding(img, padding_percent=10):
    """
    Adiciona padding uniforme em todos os lados da imagem.
    padding_percent: porcentagem do tamanho da imagem para o padding (padrão 10%)
    """
    width, height = img.size
    
    # Calcular padding baseado na menor dimensão para manter proporção
    min_dimension = min(width, height)
    padding = int(min_dimension * padding_percent / 100)
    
    # Criar nova imagem com padding
    new_width = width + (padding * 2)
    new_height = height + (padding * 2)
    
    new_img = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 0))
    
    # Colar imagem original no centro
    new_img.paste(img, (padding, padding), img)
    
    return new_img

def process_logo(input_path, output_path, remove_bg_func, add_padding=True):
    """
    Processa um logo: remove fundo e adiciona padding uniforme.
    """
    if not os.path.exists(input_path):
        print(f"⚠️  Aviso: {os.path.basename(input_path)} não encontrado")
        return False
    
    print(f"📝 Processando {os.path.basename(input_path)}...")
    
    # Remover fundo
    img_no_bg = remove_bg_func(input_path)
    
    # Adicionar padding uniforme se solicitado
    if add_padding:
        img_final = add_uniform_padding(img_no_bg, padding_percent=10)
    else:
        img_final = img_no_bg
    
    # Salvar
    img_final.save(output_path, "PNG", optimize=True)
    print(f"✓ {os.path.basename(output_path)} processado e salvo")
    
    return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    public_dir = os.path.join(project_root, "public")
    
    print("🖼️  Processando logos com detecção conservadora de fundo...")
    print("   (Preservando texto com threshold baixo)\n")
    
    # Logos com texto - remover fundo escuro (claro) ou branco (escuro)
    process_logo(
        os.path.join(public_dir, "holdareana-logo-texto-claro.png"),
        os.path.join(public_dir, "holdareana-logo-texto-claro.png"),
        remove_dark_background_smart,
        add_padding=True
    )
    
    process_logo(
        os.path.join(public_dir, "holdareana-logo-texto-escuro.png"),
        os.path.join(public_dir, "holdareana-logo-texto-escuro.png"),
        remove_white_background_smart,
        add_padding=True
    )
    
    print()
    
    # Logos sem texto - remover fundo escuro (claro) ou branco (escuro)
    process_logo(
        os.path.join(public_dir, "holdarena-logo-semfundo-claro.png"),
        os.path.join(public_dir, "holdarena-logo-semfundo-claro.png"),
        remove_dark_background_smart,
        add_padding=True
    )
    
    process_logo(
        os.path.join(public_dir, "holdarena-logo-semfundo-escuro.png"),
        os.path.join(public_dir, "holdarena-logo-semfundo-escuro.png"),
        remove_white_background_smart,
        add_padding=True
    )
    
    print("\n✅ Processamento concluído!")
    print("\n💡 Dica: Se o texto ainda estiver sendo removido, você pode:")
    print("   1. Ajustar o threshold no código (linha com threshold=5)")
    print("   2. Usar uma ferramenta manual como GIMP ou Photoshop")
    print("   3. Usar rembg (pip install rembg) para remoção mais precisa")

if __name__ == "__main__":
    main()
