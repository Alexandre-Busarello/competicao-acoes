const fs = require('fs');
const path = require('path');

/**
 * Script que monitora o sw.js e injeta handlers automaticamente
 * Deve ser executado em paralelo com o dev server
 */

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const handlersPath = path.join(process.cwd(), 'public', 'sw-push-handlers.js');

function injectHandlers() {
  try {
    if (!fs.existsSync(swPath)) {
      return;
    }

    let swContent = fs.readFileSync(swPath, 'utf-8');

    // Verificar se já tem os handlers
    if (swContent.includes("importScripts('/sw-push-handlers.js')")) {
      return; // Já está injetado
    }

    // Se tem importScripts() vazio, substituir
    if (swContent.includes('importScripts();')) {
      swContent = swContent.replace("importScripts();", "importScripts('/sw-push-handlers.js');");
      fs.writeFileSync(swPath, swContent, 'utf-8');
      console.log('✅ [Watch] Handlers de push injetados no service worker');
    }
  } catch (error) {
    console.error('❌ [Watch] Erro ao injetar handlers:', error.message);
  }
}

// Injetar imediatamente
injectHandlers();

// Monitorar mudanças no arquivo
let lastModified = fs.existsSync(swPath) ? fs.statSync(swPath).mtimeMs : 0;

setInterval(() => {
  try {
    if (fs.existsSync(swPath)) {
      const stats = fs.statSync(swPath);
      if (stats.mtimeMs > lastModified) {
        lastModified = stats.mtimeMs;
        console.log('📝 [Watch] sw.js modificado, injetando handlers...');
        injectHandlers();
      }
    }
  } catch (error) {
    // Ignorar erros de leitura
  }
}, 1000); // Verificar a cada segundo

console.log('👀 [Watch] Monitorando sw.js para injetar handlers automaticamente...');

