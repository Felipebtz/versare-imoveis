/**
 * Arquivo principal para a área administrativa
 */

import { isLoggedIn, logout } from './modules/auth.js';
import { loadDashboardData, checkServerAndLoadData } from './modules/dashboard.js';
import './modules/messages.js';
import './modules/properties.js';

// Verificar autenticação do usuário para páginas administrativas
document.addEventListener('DOMContentLoaded', async() => {
    try {
        // Verificar se o usuário está logado
        const authenticated = await isLoggedIn();

        if (!authenticated) {
            // Se não estiver autenticado e não estiver na página de login, redirecionar
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
                return; // Parar execução para não carregar o dashboard
            }
        } else {
            // Se estiver autenticado e estiver na página de login, redirecionar para dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
                return;
            }
        }

        // Configurar evento de logout
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async(e) => {
                e.preventDefault();
                await logout();
                window.location.href = 'login.html';
            });
        }

        // Carregar dados do dashboard se estiver na página inicial
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/admin/')) {
            await checkServerAndLoadData();
        }

    } catch (error) {
        console.error('Erro ao inicializar área administrativa:', error);
    }
});