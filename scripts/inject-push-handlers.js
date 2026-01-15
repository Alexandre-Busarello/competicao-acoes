const fs = require('fs');
const path = require('path');

/**
 * Script para injetar handlers de push no service worker gerado pelo next-pwa
 * Este script deve ser executado após o build do Next.js
 */

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const handlersPath = path.join(process.cwd(), 'public', 'sw-push-handlers.js');

function injectPushHandlers() {
  try {
    // Verificar se o service worker existe
    if (!fs.existsSync(swPath)) {
      console.log('⚠️ Service worker não encontrado. Execute o build primeiro.');
      return;
    }

    // Ler o service worker atual
    let swContent = fs.readFileSync(swPath, 'utf-8');

    // Verificar se já tem os handlers (para evitar duplicação)
    if (swContent.includes("importScripts('/sw-push-handlers.js')")) {
      console.log('✅ Handlers de push já estão injetados no service worker');
      return;
    }
    
    // Se tem importScripts() vazio, substituir diretamente
    if (swContent.includes('importScripts();')) {
      swContent = swContent.replace("importScripts();", "importScripts('/sw-push-handlers.js');");
      fs.writeFileSync(swPath, swContent, 'utf-8');
      console.log('✅ Handlers de push injetados no service worker (substituição de importScripts vazio)');
      return;
    }

    // Encontrar onde inserir o importScripts
    // O next-pwa gera código que termina com })); que fecha a função define
    // Precisamos inserir o importScripts DEPOIS do fechamento da função define
    // Procurar pelo padrão: ...),"GET")}); ou similar
    
    // Procurar pelo último })); que fecha a função define
    let insertIndex = swContent.lastIndexOf('});');
    
    if (insertIndex === -1) {
      // Tentar encontrar })); (com parênteses)
      insertIndex = swContent.lastIndexOf('}));');
    }
    
    if (insertIndex === -1) {
      console.log('⚠️ Não foi possível encontrar o fechamento da função define');
      return;
    }

    // Inserir importScripts DEPOIS do fechamento da função define
    // O insertIndex aponta para o início de }); ou }));
    // Precisamos inserir após o fechamento completo
    const closingPattern = swContent.substring(insertIndex, insertIndex + 4);
    const afterClosing = closingPattern === '}));' ? insertIndex + 4 : insertIndex + 3;
    
    const importScripts = "\nimportScripts('/sw-push-handlers.js');";
    const newSwContent = 
      swContent.slice(0, afterClosing) +
      importScripts +
      swContent.slice(afterClosing);

    // Escrever o service worker atualizado
    fs.writeFileSync(swPath, newSwContent, 'utf-8');
    console.log('✅ Handlers de push injetados no service worker com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao injetar handlers de push:', error);
    process.exit(1);
  }
}

injectPushHandlers();

