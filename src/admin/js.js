import { checkServerAndLoadData } from '../assets/js/modules/dashboard.js';

document.addEventListener('DOMContentLoaded', async() => {
    console.log('DOM carregado!');
    try {
        await checkServerAndLoadData();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
});