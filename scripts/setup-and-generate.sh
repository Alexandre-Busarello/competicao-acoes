#!/bin/bash
# Script para instalar dependências e gerar ícones e splash screens

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Instalando dependências Python..."
pip3 install -r "$SCRIPT_DIR/requirements.txt"

echo ""
echo "🎨 Gerando ícones PWA..."
python3 "$SCRIPT_DIR/generate-pwa-icons.py"

echo ""
echo "📱 Gerando splash screens..."
python3 "$SCRIPT_DIR/generate-splash-screens.py"

echo ""
echo "✅ Concluído! Todos os ícones e splash screens foram gerados."

