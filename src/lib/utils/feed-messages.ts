/**
 * Gerador de mensagens variadas e animadas para posts automáticos do feed
 * Voltado para o público de investidores com trocadilhos e linguagem descontraída
 */

interface TransactionData {
  ticker: string;
  type: 'compra' | 'venda' | 'buy' | 'sell';
  quantity: number;
  price: number;
}

/**
 * Mensagens para compras
 */
const buyMessages = [
  // Trocadilhos e piadas
  (data: TransactionData) => `💰 Acabei de comprar **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Vamos ver se essa aposta vai render!`,
  (data: TransactionData) => `📈 Entrada em **${data.ticker}**: **${data.quantity} ações** a **R$ ${data.price.toFixed(2)}**. O mercado vai sentir falta desse dinheiro na minha conta! 😄`,
  (data: TransactionData) => `🚀 **${data.quantity} ${data.ticker}** adicionadas ao portfólio por **R$ ${data.price.toFixed(2)}** cada. Esperando que essa seja uma decisão *"lucrativa"*!`,
  (data: TransactionData) => `💎 Compra realizada: **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Diamante ou areia? Só o tempo dirá!`,
  (data: TransactionData) => `🎯 Mirando em **${data.ticker}**: **${data.quantity} ações** compradas a **R$ ${data.price.toFixed(2)}**. Torcendo para não ter *"errado o alvo"*!`,
  (data: TransactionData) => `⚡ Entrada relâmpago em **${data.ticker}**! **${data.quantity} ações** a **R$ ${data.price.toFixed(2)}**. Que venham os ganhos!`,
  (data: TransactionData) => `🎲 Aposta feita: **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Esperando que a sorte esteja do meu lado!`,
  (data: TransactionData) => `🔥 Acabei de *"queimar"* **R$ ${(data.quantity * data.price).toFixed(2)}** em **${data.ticker}**. Mas espero que seja um *"investimento quente"*!`,
  (data: TransactionData) => `📊 Mais **${data.quantity} ${data.ticker}** no portfólio a **R$ ${data.price.toFixed(2)}**. Vamos ver se essa posição vai *"subir"* no ranking!`,
  (data: TransactionData) => `💼 Negócio fechado: **${data.quantity} ${data.ticker}** por **R$ ${data.price.toFixed(2)}** cada. Que seja um bom *"negócio"*!`,
  (data: TransactionData) => `🎪 Entrada no circo do mercado: **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Esperando que não seja um *"show de horrores"*!`,
  (data: TransactionData) => `🏆 Compra estratégica de **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Torcendo para essa ser uma *"jogada de mestre"*!`,
  (data: TransactionData) => `🌟 Investindo em **${data.ticker}**: **${data.quantity} ações** a **R$ ${data.price.toFixed(2)}**. Que seja uma *"estrela"* no meu portfólio!`,
  (data: TransactionData) => `🎨 Pintando o portfólio com **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Esperando que seja uma *"obra de arte"*!`,
  (data: TransactionData) => `🎵 Adicionando **${data.quantity} ${data.ticker}** ao *"playlist"* do portfólio por **R$ ${data.price.toFixed(2)}**. Que seja um *"hit"*!`,
];

/**
 * Mensagens para vendas
 */
const sellMessages = [
  // Trocadilhos e piadas
  (data: TransactionData) => `💸 Realizei lucro (ou prejuízo?) vendendo **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Vamos ver se foi uma boa saída!`,
  (data: TransactionData) => `📉 Saída de **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Esperando que tenha sido no *"momento certo"*!`,
  (data: TransactionData) => `🎯 Venda realizada: **${data.quantity} ${data.ticker}** por **R$ ${data.price.toFixed(2)}** cada. Que o lucro esteja comigo!`,
  (data: TransactionData) => `💰 Convertendo **${data.quantity} ${data.ticker}** em dinheiro a **R$ ${data.price.toFixed(2)}**. Esperando que tenha sido uma boa *"conversão"*!`,
  (data: TransactionData) => `🚪 Saindo de **${data.ticker}**: **${data.quantity} ações** vendidas a **R$ ${data.price.toFixed(2)}**. Que seja uma *"saída estratégica"*!`,
  (data: TransactionData) => `🎪 Fechando posição em **${data.ticker}**: **${data.quantity} ações** a **R$ ${data.price.toFixed(2)}**. Esperando que não seja um *"final trágico"*!`,
  (data: TransactionData) => `📊 Realizando **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Vamos ver se essa foi uma *"realização"* lucrativa!`,
  (data: TransactionData) => `💼 Negócio encerrado: **${data.quantity} ${data.ticker}** vendidas por **R$ ${data.price.toFixed(2)}**. Que tenha sido um bom *"fechamento"*!`,
  (data: TransactionData) => `⚡ Saída rápida de **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Esperando que tenha sido no *"timing perfeito"*!`,
  (data: TransactionData) => `🎲 Aposta encerrada: **${data.quantity} ${data.ticker}** vendidas a **R$ ${data.price.toFixed(2)}**. Vamos ver o resultado!`,
  (data: TransactionData) => `🔥 Realizando **${data.quantity} ${data.ticker}** a **R$ ${data.price.toFixed(2)}**. Que seja um *"realize"* positivo!`,
  (data: TransactionData) => `🌟 Fechando posição em **${data.ticker}**: **${data.quantity} ações** a **R$ ${data.price.toFixed(2)}**. Esperando que tenha sido uma *"estrela"*!`,
  (data: TransactionData) => `🎯 Venda estratégica de **${data.quantity} ${data.ticker}** por **R$ ${data.price.toFixed(2)}**. Torcendo para ter *"acertado"* o timing!`,
  (data: TransactionData) => `💎 Convertendo **${data.quantity} ${data.ticker}** em dinheiro a **R$ ${data.price.toFixed(2)}**. Esperando que tenha sido um *"diamante"*!`,
  (data: TransactionData) => `🎵 Removendo **${data.quantity} ${data.ticker}** do *"playlist"* do portfólio por **R$ ${data.price.toFixed(2)}**. Que tenha sido um *"hit"*!`,
];

/**
 * Gera uma mensagem aleatória baseada no tipo de transação
 */
export function generateFeedMessage(transaction: TransactionData): string {
  const normalizedType = transaction.type.toLowerCase();
  const isBuy = normalizedType === 'compra' || normalizedType === 'buy';
  
  const messages = isBuy ? buyMessages : sellMessages;
  
  // Seleciona mensagem aleatória baseada no ticker e quantidade para consistência
  // Usa uma combinação simples para gerar um índice pseudo-aleatório mas consistente
  const seed = transaction.ticker.charCodeAt(0) + transaction.quantity + Math.floor(transaction.price);
  const index = seed % messages.length;
  
  return messages[index](transaction);
}

