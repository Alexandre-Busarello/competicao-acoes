import * as webpush from 'web-push';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para gerar chaves VAPID para notificações push
 * 
 * Uso: tsx scripts/generate-vapid-keys.ts
 * 
 * Isso gerará um par de chaves pública/privada VAPID e mostrará
 * as variáveis de ambiente que devem ser adicionadas ao .env
 */

function generateVapidKeys() {
  console.log('🔑 Gerando chaves VAPID...\n');

  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('✅ Chaves geradas com sucesso!\n');
  console.log('📋 Adicione as seguintes variáveis ao seu arquivo .env:\n');
  console.log('─'.repeat(60));
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:admin@holdarena.com`);
  console.log('─'.repeat(60));
  console.log('\n💡 Nota: Atualize o VAPID_SUBJECT com o email ou URL do seu serviço');
  console.log('   Exemplo: mailto:seu-email@exemplo.com ou https://seu-dominio.com\n');

  // Tentar ler .env.example e atualizar
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envExample = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Remover linhas antigas de VAPID se existirem
    envExample = envExample.replace(/^VAPID_.*$/gm, '');
    
    // Adicionar novas linhas
    envExample += '\n# VAPID Keys for Push Notifications\n';
    envExample += `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`;
    envExample += `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
    envExample += `VAPID_SUBJECT=mailto:admin@holdarena.com\n`;
    
    fs.writeFileSync(envExamplePath, envExample);
    console.log('✅ Arquivo .env.example atualizado!');
  }

  return vapidKeys;
}

// Executar se chamado diretamente
if (require.main === module) {
  try {
    generateVapidKeys();
  } catch (error) {
    console.error('❌ Erro ao gerar chaves VAPID:', error);
    process.exit(1);
  }
}

export { generateVapidKeys };

