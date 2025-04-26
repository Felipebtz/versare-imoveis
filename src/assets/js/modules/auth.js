/**
 * Módulo de autenticação
 */

// import { API_BASE_URL } from '../config/auth.js';
import { showAlert } from './ui.js';

// URL base da API
export const API_BASE_URL = '/api';

// Simular usuário para desenvolvimento
export function setupMockAuth() {
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
    // Para desenvolvimento, criar um usuário mock se não existir
    setupMockAuth();

    // Verificar se há um usuário no localStorage
    const isAuthenticated = !!localStorage.getItem('admin_user');

    if (!isAuthenticated) {
        window.location.href = 'login.html';
    }

    return isAuthenticated;
}

// Verificar se o usuário está logado (para versão assíncrona)
export async function isLoggedIn() {
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
    localStorage.setItem('admin_user', JSON.stringify(user));
}

// Fazer logout
export function logout() {
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
}

// Lidar com o login do usuário
export function handleLogin(event) {
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
        // Para desenvolvimento, aceitar qualquer usuário e senha
        console.warn('Usando login mockado para desenvolvimento');
        const mockUser = {
            id: 1,
            username: username,
            name: 'Administrador',
            role: 'admin',
            created_at: new Date().toISOString()
        };

        // Salvar usuário e redirecionar
        saveUser(mockUser);
        window.location.href = 'index.html';

        /* Em produção, usar este código:
        // Fazer requisição para a API
        fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Credenciais inválidas');
                }
                return response.json();
            })
            .then(data => {
                // Salvar usuário e redirecionar
                saveUser(data.user);
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Erro ao fazer login:', error);
                showAlert('Nome de usuário ou senha incorretos', 'error');
                
                // Reabilitar o botão
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Entrar';
                }
            });
        */
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showAlert('Nome de usuário ou senha incorretos', 'error');

        // Reabilitar o botão
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
}