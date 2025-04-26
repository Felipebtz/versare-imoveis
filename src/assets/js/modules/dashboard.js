/**
 * Módulo para o dashboard administrativo
 */

import { API_BASE_URL } from './auth.js';

// Formatar data e hora
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Formatar valor em reais
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Carregar dados do dashboard
async function loadDashboardData() {
    console.log('Carregando dados do dashboard...');
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/admin/')) return;

    try {
        // Tentar carregar os dados das estatísticas
        const statsResponse = await fetch('/api/admin/dashboard-stats');
        if (!statsResponse.ok) {
            console.error('Resposta da API não foi OK:', statsResponse.status);
            throw new Error('Erro ao carregar estatísticas do dashboard');
        }

        const stats = await statsResponse.json();
        console.log('Estatísticas carregadas:', stats);

        // Atualizar contador de imóveis
        updatePropertyStats(stats);

        // Atualizar contador de mensagens
        updateMessageStats(stats);

        // Carregar imóveis recentes
        await loadRecentProperties();

        // Atualizar mensagens recentes
        updateRecentMessages(stats);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        handleDataLoadError();
    }
}

// Atualizar estatísticas de imóveis
function updatePropertyStats(stats) {
    console.log('Atualizando estatísticas de imóveis:', stats.totalProperties);

    // Total de imóveis
    const totalPropertiesElement = document.getElementById('total-properties');
    if (totalPropertiesElement) {
        totalPropertiesElement.textContent = stats.totalProperties || 0;

        // Atualizar a mensagem de status abaixo do contador
        const statusElement = totalPropertiesElement.parentElement.querySelector('.text-sm');
        if (statusElement) {
            if (stats.totalProperties > 0) {
                statusElement.textContent = 'Imóveis cadastrados';
                statusElement.className = 'text-sm text-gray-500';
            } else {
                statusElement.textContent = 'Nenhum imóvel cadastrado';
                statusElement.className = 'text-sm text-gray-500';
            }
        }
    }

    // Remover os cards desnecessários - estão duplicados e não fazem sentido
    const activePropertiesElement = document.getElementById('active-properties');
    const soldPropertiesElement = document.getElementById('sold-properties');

    if (activePropertiesElement) {
        const cardContainer = activePropertiesElement.closest('.bg-white.rounded-lg');
        if (cardContainer) {
            cardContainer.style.display = 'none';
        }
    }

    if (soldPropertiesElement) {
        const cardContainer = soldPropertiesElement.closest('.bg-white.rounded-lg');
        if (cardContainer) {
            cardContainer.style.display = 'none';
        }
    }
}

// Atualizar estatísticas de mensagens
function updateMessageStats(stats) {
    console.log('Atualizando estatísticas de mensagens:', stats.totalContacts, stats.totalWhatsappMessages);

    // Total de mensagens (contatos + WhatsApp)
    const totalContactsElement = document.getElementById('total-contacts');
    if (totalContactsElement) {
        const totalMessages = (stats.totalContacts || 0) + (stats.totalWhatsappMessages || 0);
        totalContactsElement.textContent = totalMessages;

        // Mensagens não lidas
        const newContactsElement = document.getElementById('new-contacts');
        if (newContactsElement) {
            const newMessages = (stats.newContacts || 0) + (stats.newWhatsappMessages || 0);
            newContactsElement.textContent = newMessages;

            // Atualizar o texto da mensagem de status
            const statusElement = newContactsElement.parentElement;
            if (statusElement) {
                statusElement.className = newMessages > 0 ? 'text-sm text-yellow-600' : 'text-sm text-gray-500';
            }
        }
    }
}

// Carregar os imóveis recentes
async function loadRecentProperties() {
    try {
        console.log('Carregando imóveis recentes...');

        // Buscar imóveis mais recentes
        const response = await fetch('/api/admin/properties');
        if (!response.ok) {
            console.error('Resposta da API não foi OK:', response.status);
            throw new Error('Erro ao buscar imóveis');
        }

        const properties = await response.json();
        console.log('Imóveis carregados:', properties);

        // Selecionar apenas os 5 mais recentes
        const recentProperties = properties.slice(0, 5);

        // Atualizar a tabela
        const tableBodyElement = document.getElementById('recent-properties');
        if (tableBodyElement) {
            if (recentProperties.length === 0) {
                tableBodyElement.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-gray-500">Nenhum imóvel cadastrado</td>
                    </tr>
                `;
            } else {
                tableBodyElement.innerHTML = '';

                recentProperties.forEach(property => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';

                    // Determinar a classe para o status
                    let statusClass = 'bg-gray-100 text-gray-800';
                    if (property.status === 'ativo') {
                        statusClass = 'bg-green-100 text-green-800';
                    } else if (property.status === 'inativo') {
                        statusClass = 'bg-gray-100 text-gray-800';
                    } else if (property.status === 'vendido') {
                        statusClass = 'bg-blue-100 text-blue-800';
                    }

                    row.innerHTML = `
                        <td class="px-4 py-3 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${property.code || 'N/A'}</div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="text-sm text-gray-900">${property.title || 'Sem título'}</div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="text-sm text-gray-900">${property.type || 'N/A'}</div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="text-sm text-gray-900">${property.neighborhood || 'N/A'}, ${property.city || 'N/A'}</div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="text-sm font-medium text-gray-900">${formatCurrency(property.price)}</div>
                        </td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                ${property.status || 'N/A'}
                            </span>
                        </td>
                    `;

                    tableBodyElement.appendChild(row);
                });
            }
        }

    } catch (error) {
        console.error('Erro ao carregar imóveis recentes:', error);

        const tableBodyElement = document.getElementById('recent-properties');
        if (tableBodyElement) {
            tableBodyElement.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-red-500">
                        Erro ao carregar imóveis. Tente novamente mais tarde.
                    </td>
                </tr>
            `;
        }
    }
}

// Atualizar mensagens recentes
function updateRecentMessages(stats) {
    console.log('Atualizando mensagens recentes...');

    const recentMessagesContainer = document.querySelector('.space-y-4');
    if (!recentMessagesContainer) return;

    try {
        // Combinar mensagens de WhatsApp e contatos
        const allMessages = [
            ...(stats.recentWhatsappMessages || []).map(msg => ({
                ...msg,
                type: 'whatsapp',
                email: '-',
                name: msg.name,
                message: msg.message,
                date: msg.created_at,
                status: msg.viewed ? 'lido' : 'não lido'
            })),
            ...(stats.recentContacts || []).map(contact => ({
                ...contact,
                type: 'contact',
                name: contact.name,
                email: contact.email,
                message: contact.message,
                date: contact.created_at,
                status: contact.status === 'novo' ? 'não lido' : 'em andamento'
            }))
        ];

        console.log('Mensagens processadas:', allMessages);

        // Ordenar por data, mais recentes primeiro
        allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limitar a 5 mensagens
        const recentMessages = allMessages.slice(0, 5);

        // Limpar conteúdo atual
        recentMessagesContainer.innerHTML = '';

        // Se não houver mensagens
        if (recentMessages.length === 0) {
            recentMessagesContainer.innerHTML = '<div class="p-4 text-center text-gray-500">Nenhuma mensagem recente encontrada.</div>';
            return;
        }

        // Adicionar mensagens
        recentMessages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'p-4 border border-[#E0DEF7] rounded-lg';

            const statusClass = message.status === 'não lido' || message.status === 'novo' ?
                'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800';

            const typeIcon = message.type === 'whatsapp' ?
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 inline-block mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>';

            messageElement.innerHTML = `
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-gray-800">${message.name} ${typeIcon}</h4>
                    <p class="text-xs text-gray-500">${message.email} • ${formatDateTime(message.date)}</p>
                  </div>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                    ${message.status === 'não lido' || message.status === 'novo' ? 'Não lida' : 'Em andamento'}
                  </span>
                </div>
                <p class="mt-2 text-sm text-gray-700">${message.message ? message.message.substring(0, 100) + (message.message.length > 100 ? '...' : '') : 'Sem mensagem'}</p>
                <div class="mt-3 flex justify-end">
                  <a href="${message.type === 'whatsapp' ? 'whatsapp-messages.html?id=' + message.id : 'contatos.html?id=' + message.id}" 
                     class="text-sm text-[#142a3d] font-medium hover:underline">
                    Ver mensagem completa
                  </a>
                </div>
            `;

            recentMessagesContainer.appendChild(messageElement);
        });
    } catch (error) {
        console.error('Erro ao processar mensagens recentes:', error);
        recentMessagesContainer.innerHTML = '<div class="p-4 text-center text-red-500">Erro ao carregar mensagens. Tente novamente mais tarde.</div>';
    }
}

// Lidar com erros no carregamento de dados
function handleDataLoadError() {
    // Em caso de erro, definir valores padrão
    const totalElement = document.getElementById('total-properties');
    const totalContactsElement = document.getElementById('total-contacts');
    const newContactsElement = document.getElementById('new-contacts');

    if (totalElement) totalElement.textContent = '0';
    if (totalContactsElement) totalContactsElement.textContent = '0';
    if (newContactsElement) newContactsElement.textContent = '0';

    // Mostrar mensagem de erro nas mensagens recentes
    const recentMessagesContainer = document.querySelector('.space-y-4');
    if (recentMessagesContainer) {
        recentMessagesContainer.innerHTML = '<div class="p-4 text-center text-red-500">Erro ao carregar mensagens. Tente novamente mais tarde.</div>';
    }

    // Mostrar mensagem de erro na tabela de imóveis
    const recentPropertiesTable = document.getElementById('recent-properties');
    if (recentPropertiesTable) {
        recentPropertiesTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-red-500">
                    Erro ao carregar imóveis. Tente novamente mais tarde.
                </td>
            </tr>
        `;
    }
}

// Mock de dados para testes quando a API não retorna dados
function setupMockData() {
    // Montar objeto para simular a API
    const mockStats = {
        totalProperties: 8,
        totalContacts: 12,
        totalWhatsappMessages: 25,
        newContacts: 4,
        newWhatsappMessages: 7,
        recentContacts: [{
                id: 1,
                name: 'Carlos Silva',
                email: 'carlos@exemplo.com',
                message: 'Gostaria de obter mais informações sobre o apartamento no centro.',
                created_at: '2023-10-15T14:30:00',
                status: 'novo'
            },
            {
                id: 2,
                name: 'Ana Oliveira',
                email: 'ana@exemplo.com',
                message: 'Tenho interesse em marcar uma visita para este final de semana.',
                created_at: '2023-10-14T09:15:00',
                status: 'em andamento'
            }
        ],
        recentWhatsappMessages: [{
                id: 1,
                name: 'João Pereira',
                message: 'Olá, vi o anúncio do imóvel na Vila Mariana. Ainda está disponível?',
                created_at: '2023-10-15T15:45:00',
                viewed: false
            },
            {
                id: 2,
                name: 'Maria Costa',
                message: 'Bom dia, qual o valor do condomínio do apartamento?',
                created_at: '2023-10-15T10:20:00',
                viewed: true
            }
        ]
    };

    // Mock para API de imóveis recentes
    window.fetch = async(url) => {
        console.log('Mock fetch chamado para:', url);

        if (url === '/api/admin/dashboard-stats') {
            return {
                ok: true,
                json: async() => mockStats
            };
        }

        if (url === '/api/admin/properties') {
            return {
                ok: true,
                json: async() => [{
                        id: 1,
                        code: 'AP001',
                        title: 'Apartamento em Moema',
                        type: 'Apartamento',
                        neighborhood: 'Moema',
                        city: 'São Paulo',
                        price: 850000,
                        status: 'ativo',
                        created_at: '2023-10-10T14:30:00'
                    },
                    {
                        id: 2,
                        code: 'CA002',
                        title: 'Casa em Alphaville',
                        type: 'Casa',
                        neighborhood: 'Alphaville',
                        city: 'Barueri',
                        price: 1250000,
                        status: 'ativo',
                        created_at: '2023-10-09T11:15:00'
                    },
                    {
                        id: 3,
                        code: 'AP003',
                        title: 'Apartamento no Centro',
                        type: 'Apartamento',
                        neighborhood: 'Centro',
                        city: 'São Paulo',
                        price: 550000,
                        status: 'vendido',
                        created_at: '2023-10-08T16:45:00'
                    },
                    {
                        id: 4,
                        code: 'TE004',
                        title: 'Terreno em Cotia',
                        type: 'Terreno',
                        neighborhood: 'Granja Viana',
                        city: 'Cotia',
                        price: 450000,
                        status: 'ativo',
                        created_at: '2023-10-07T09:30:00'
                    },
                    {
                        id: 5,
                        code: 'AP005',
                        title: 'Apartamento na Vila Mariana',
                        type: 'Apartamento',
                        neighborhood: 'Vila Mariana',
                        city: 'São Paulo',
                        price: 720000,
                        status: 'ativo',
                        created_at: '2023-10-05T14:20:00'
                    }
                ]
            };
        }

        // Para qualquer outra URL, retornar erro
        return {
            ok: false,
            status: 404,
            statusText: 'Not Found'
        };
    };
}

// Verificar se o servidor está disponível e, se não estiver, usar dados mockados
async function checkServerAndLoadData() {
    console.log('Verificando disponibilidade do servidor e carregando dados...');

    try {
        // Definir um timeout para a requisição
        const timeoutDuration = 3000; // 3 segundos

        // Criar um Promise de timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao acessar a API')), timeoutDuration);
        });

        // Tentar acessar a API com timeout
        const fetchPromise = fetch('/api/admin/dashboard-stats');

        // Corrida entre o fetch e o timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            console.warn('Servidor respondeu com erro:', response.status);
            throw new Error(`API retornou status ${response.status}`);
        }

        // Se chegou aqui, a API está funcionando
        console.log('API está respondendo corretamente, usando dados reais');
        await loadDashboardData();

    } catch (error) {
        console.error('Erro ao acessar a API:', error);
        console.warn('Servidor não está respondendo, usando dados mockados para demonstração');

        // Configurar os mocks para desenvolvimento/demonstração
        setupMockData();

        // Carregar os dados mockados
        await loadDashboardData();
    }
}

// Exportar funções
export { loadDashboardData, checkServerAndLoadData };