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

    // Ler os handlers de push
    if (!fs.existsSync(handlersPath)) {
      console.log('⚠️ Arquivo sw-push-handlers.js não encontrado');
      return;
    }

    const handlersContent = fs.readFileSync(handlersPath, 'utf-8');

    // Encontrar onde inserir o importScripts (antes do final do arquivo)
    // O next-pwa gera código que termina com })); ou });
    // Vamos inserir antes do sourceMappingURL ou antes do último });
    let insertIndex = swContent.lastIndexOf('//# sourceMappingURL');
    
    if (insertIndex === -1) {
      // Se não tem source map, inserir antes do último });
      insertIndex = swContent.lastIndexOf('});');
    }
    
    if (insertIndex === -1) {
      // Tentar antes do último });
      insertIndex = swContent.lastIndexOf('}));');
    }
    
    if (insertIndex === -1) {
      console.log('⚠️ Não foi possível encontrar o ponto de inserção no service worker');
      return;
    }

    // Inserir importScripts e handlers antes do ponto encontrado
    const importScripts = "importScripts('/sw-push-handlers.js');\n";
    const newSwContent = 
      swContent.slice(0, insertIndex) +
      importScripts +
      handlersContent +
      '\n' +
      swContent.slice(insertIndex);

    // Escrever o service worker atualizado
    fs.writeFileSync(swPath, newSwContent, 'utf-8');
    console.log('✅ Handlers de push injetados no service worker com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao injetar handlers de push:', error);
    process.exit(1);
  }
}

injectPushHandlers();

