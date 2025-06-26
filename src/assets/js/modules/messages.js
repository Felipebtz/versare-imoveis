// Módulo para gerenciar mensagens/contatos no painel admin

const API_BASE_URL = '/api/admin';

/**
 * Carrega todas as mensagens/contatos do backend
 * @returns {Promise<Array>} Lista de mensagens
 */
export async function fetchMessages() {
    const response = await fetch(`${API_BASE_URL}/contacts`);
    if (!response.ok) throw new Error('Erro ao buscar mensagens');
    return response.json();
}

/**
 * Renderiza a lista de mensagens em um container
 * @param {Array} messages Lista de mensagens
 * @param {HTMLElement} container Elemento onde exibir a lista
 * @param {Function} onSelect Função chamada ao clicar em uma mensagem
 */
export function renderMessagesList(messages, container, onSelect) {
    container.innerHTML = '';
    if (!messages.length) {
        container.innerHTML = '<p class="text-gray-500">Nenhuma mensagem encontrada.</p>';
        return;
    }
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'p-4 border-b hover:bg-gray-50 cursor-pointer';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <strong>${msg.nome}</strong> <span class="text-xs text-gray-500">${msg.email}</span>
                </div>
                <span class="text-xs text-gray-500">${new Date(msg.data_envio).toLocaleString('pt-BR')}</span>
            </div>
            <div class="text-sm text-gray-700 mt-1 line-clamp-1">${msg.mensagem.slice(0, 60)}...</div>
        `;
        div.onclick = () => onSelect(msg);
        container.appendChild(div);
    });
}

/**
 * Renderiza os detalhes de uma mensagem
 * @param {Object} msg Mensagem
 * @param {HTMLElement} container Elemento onde exibir os detalhes
 */
export function renderMessageDetails(msg, container) {
    container.innerHTML = `
        <h2 class="text-lg font-bold mb-2">${msg.nome} &lt;${msg.email}&gt;</h2>
        <p class="text-sm text-gray-500 mb-2">Enviado em: ${new Date(msg.data_envio).toLocaleString('pt-BR')}</p>
        <p class="mb-4"><strong>Telefone:</strong> ${msg.telefone || '-'}</p>
        <p class="mb-4"><strong>Mensagem:</strong><br>${msg.mensagem}</p>
        <p class="mb-4"><strong>Imóvel relacionado:</strong> ${msg.imovel_id || '-'}</p>
    `;
} 