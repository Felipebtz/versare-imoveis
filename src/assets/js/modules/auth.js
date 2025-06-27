/**
 * Módulo de autenticação
 */

// import { API_BASE_URL } from '../config/auth.js';
import { showAlert } from './ui.js';

// URL base da API
export const API_BASE_URL = '/api';

// Simular usuário para desenvolvimento
export function setupMockAuth() {
    console.log('[auth] setupMockAuth chamada');
    // Se não há usuário no localStorage, criar um mock para desenvolvimento
    if (!localStorage.getItem('admin_user')) {
        console.warn('Criando usuário mock para desenvolvimento');
        const mockUser = {
            id: 1,
            username: 'admin',
            name: 'Administrador',
            role: 'admin',
            created_at: new Date().toISOString()
        };
        localStorage.setItem('admin_user', JSON.stringify(mockUser));
    }
}

// Função para verificar autenticação
export function checkAuth() {
    console.log('[auth] checkAuth chamada');
    // Remover a criação automática de usuário mock
    // setupMockAuth(); // REMOVIDO

    // Verificar se há um usuário no localStorage
    const isAuthenticated = !!localStorage.getItem('admin_user');

    if (!isAuthenticated) {
        window.location.href = 'login.html';
    }

    return isAuthenticated;
}

// Verificar se o usuário está logado (para versão assíncrona)
export async function isLoggedIn() {
    console.log('[auth] isLoggedIn chamada');
    try {
        // Para desenvolvimento, criar um usuário mock se não existir
        setupMockAuth();

        // Verificar se há dados do usuário no localStorage
        const userData = localStorage.getItem('admin_user');
        if (!userData) return false;

        // Para desenvolvimento/demonstração, retornar true se houver dados no localStorage
        // Em produção, validar o token com o servidor
        return true;

        /* Implementação completa com validação no servidor:
        const user = JSON.parse(userData);
        
        // Validar o token no servidor
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (!response.ok) return false;
        return true;
        */
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
}

// Obter usuário logado do localStorage
export function getLoggedUser() {
    console.log('[auth] getLoggedUser chamada');
    const userData = localStorage.getItem('admin_user');
    if (!userData) return null;

    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error('Erro ao ler dados do usuário:', error);
        return null;
    }
}

// Salvar usuário no localStorage
export function saveUser(user) {
    console.log('[auth] saveUser chamada', user);
    localStorage.setItem('admin_user', JSON.stringify(user));
}

// Fazer logout
export function logout() {
    console.log('[auth] logout chamada');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
}

// Usuário e senha fixos para autenticação
const ADMIN_CREDENTIALS = {
    username: 'versare-imoveis',
    password: 'versa8765'
};

// Lidar com o login do usuário
export function handleLogin(event) {
    console.log('[auth] handleLogin chamada');
    event.preventDefault();

    const form = event.target;
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    if (!username || !password) {
        showAlert('Preencha o nome de usuário e senha', 'error');
        return;
    }

    // Desabilitar o botão de login
    const loginButton = form.querySelector('button[type="submit"]');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';
    }

    try {
        // Verificar usuário e senha fixos
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            console.log('[auth] Login bem-sucedido');
            const user = {
                id: 1,
                username: username,
                name: 'Administrador',
                role: 'admin',
                created_at: new Date().toISOString()
            };
            saveUser(user);
            window.location.href = 'index.html';
        } else {
            console.warn('[auth] Login falhou: usuário ou senha incorretos');
            showAlert('Nome de usuário ou senha incorretos', 'error');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Entrar';
            }
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showAlert('Erro ao fazer login', 'error');
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
}