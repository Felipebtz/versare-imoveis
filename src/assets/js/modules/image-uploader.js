/**
 * Módulo para gerenciar o upload de imagens para imóveis
 * Este módulo suporta pré-visualização e upload de múltiplas imagens
 */

import { API_BASE_URL } from '../config/auth.js';
import { showAlert } from './ui.js';

// Variável global para armazenar as imagens confirmadas
let confirmedImages = [];

/**
 * Inicializa o uploader de imagens com integração ao botão de confirmação
 * @param {String} inputId - ID do input de arquivo
 * @param {String} previewId - ID do container de pré-visualização
 * @param {String} confirmBtnId - ID do botão de confirmação
 * @param {String} saveBtnId - ID do botão de salvar imóvel
 */
function initImageUploaderWithConfirmation(inputId = 'property-images', previewId = 'image-preview', confirmBtnId = 'confirm-upload-btn', saveBtnId = 'save-property-btn') {
  const imageInput = document.getElementById(inputId);
  const imagePreview = document.getElementById(previewId);
  const confirmBtn = document.getElementById(confirmBtnId);
  const saveBtn = document.getElementById(saveBtnId);

  if (!imageInput || !imagePreview || !confirmBtn || !saveBtn) {
    console.error('Elementos do uploader não encontrados');
    return;
  }

  // Desabilitar botões inicialmente
  confirmBtn.disabled = true;
  saveBtn.disabled = true;
  confirmedImages = [];

  imageInput.addEventListener('change', (event) => {
    handleImageSelection(event);
    // Habilita o botão de confirmar upload se houver arquivos
    confirmBtn.disabled = !(imageInput.files && imageInput.files.length > 0);
    saveBtn.disabled = true;
    confirmedImages = [];
  });

  confirmBtn.addEventListener('click', () => {
    console.log('[DEPURAÇÃO] Usuário clicou em "Adicionar as imagens". Iniciando upload das imagens...');
    confirmBtn.disabled = true;
    saveBtn.disabled = true;
    uploadTempImages(inputId)
      .then(result => {
        if (result.success && result.images.length > 0) {
          confirmedImages = result.images;
          showAlert('Imagens adicionadas com sucesso! Agora você pode salvar o imóvel.', 'success');
          saveBtn.disabled = false;
          console.log('[DEPURAÇÃO] Upload de imagens concluído com sucesso. Imagens enviadas:', result.images);
        } else {
          showAlert('Nenhuma imagem foi enviada.', 'error');
          confirmedImages = [];
          saveBtn.disabled = true;
          console.log('[DEPURAÇÃO] Nenhuma imagem foi enviada no upload.');
        }
      })
      .catch((err) => {
        showAlert('Erro ao enviar imagens.', 'error');
        confirmedImages = [];
        saveBtn.disabled = true;
        console.log('[DEPURAÇÃO] Erro ao enviar imagens:', err);
      });
  });
}

/**
 * Inicializa o uploader de imagens
 * @param {String} inputId - ID do input de arquivo
 * @param {String} previewId - ID do container de pré-visualização
 */
function initImageUploader(inputId = 'property-images', previewId = 'image-preview') {
  console.log('Inicializando uploader de imagens');
  const imageInput = document.getElementById(inputId);
  const imagePreview = document.getElementById(previewId);
  if (!imageInput || !imagePreview) {
    console.error(`Elementos não encontrados: input=${!!imageInput}, preview=${!!imagePreview}`);
    return;
  }
  // Inicializar listeners
  imageInput.addEventListener('change', handleImageSelection);
}

/**
 * Manipula a seleção de imagens
 * @param {Event} event - Evento de mudança do input
 */
function handleImageSelection(event) {
  const imageInput = event.target;
  const imagePreview = document.getElementById('image-preview');
  const files = Array.from(imageInput.files);
  const maxFiles = 30;
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const maxTotalSize = 30 * 1024 * 1024; // 30MB

  if (files.length > maxFiles) {
    showAlert(`Você pode enviar no máximo ${maxFiles} imagens por imóvel.`, 'error');
    imageInput.value = '';
    imagePreview.innerHTML = '';
    return;
  }

  let totalSize = 0;
  let hasError = false;
  imagePreview.innerHTML = '';

  files.forEach(file => {
    totalSize += file.size;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      showAlert('Formato de arquivo inválido. Apenas PNG e JPG são permitidos.', 'error');
      hasError = true;
      return;
    }
    if (file.size > maxFileSize) {
      showAlert(`Arquivo muito grande: ${file.name}. O tamanho máximo é 5MB por imagem.`, 'error');
      hasError = true;
      return;
    }
    createImagePreview(file, imagePreview);
  });

  if (totalSize > maxTotalSize) {
    showAlert(`O tamanho total das imagens não pode ultrapassar 30MB.`, 'error');
    imageInput.value = '';
    imagePreview.innerHTML = '';
    return;
  }

  if (hasError) {
    imageInput.value = '';
    imagePreview.innerHTML = '';
    return;
  }
}

/**
 * Cria a pré-visualização de uma imagem
 * @param {File} file - Arquivo de imagem
 * @param {HTMLElement} container - Container para a pré-visualização
 */
function createImagePreview(file, container) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const div = document.createElement('div');
    div.className = 'relative border rounded-lg overflow-hidden group';
    div.dataset.filename = file.name;
    
    div.innerHTML = `
      <img src="${e.target.result}" alt="Preview" class="w-full h-24 object-cover">
      <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button type="button" class="p-1 bg-red-600 rounded-full text-white remove-image">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
    
    container.appendChild(div);
    
    // Adicionar evento para remover a imagem
    div.querySelector('.remove-image').addEventListener('click', function() {
      div.remove();
    });
  };
  
  reader.readAsDataURL(file);
}

/**
 * Faz upload das imagens para um imóvel específico
 * @param {String} propertyId - ID do imóvel
 * @param {String} inputId - ID do input de arquivo
 * @returns {Promise} Promise com o resultado do upload
 */
function uploadPropertyImages(propertyId, inputId = 'property-images') {
  return new Promise((resolve, reject) => {
    const imageInput = document.getElementById(inputId);
    
    if (!imageInput || imageInput.files.length === 0) {
      // Nenhuma imagem selecionada, consideramos como sucesso
      resolve({ success: true, message: 'Nenhuma imagem para upload' });
      return;
    }
    
    console.log(`Iniciando upload de ${imageInput.files.length} imagens para o imóvel ${propertyId}`);
    
    const formData = new FormData();
    
    // Adicionar todas as imagens ao FormData
    Array.from(imageInput.files).forEach(file => {
      formData.append('images', file);
    });
    
    // Enviar para a API
    fetch(`${API_BASE_URL}/admin/properties/${propertyId}/images`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao fazer upload das imagens');
        }
        return response.json();
      })
      .then(data => {
        console.log('Upload de imagens concluído com sucesso:', data);
        resolve(data);
      })
      .catch(error => {
        console.error('Erro no upload de imagens:', error);
        reject(error);
      });
  });
}

/**
 * Carrega imagens existentes de um imóvel para pré-visualização
 * @param {String} propertyId - ID do imóvel
 * @param {String} previewId - ID do container de pré-visualização
 */
function loadExistingImages(propertyId, previewId = 'image-preview') {
  const imagePreview = document.getElementById(previewId);
  
  if (!imagePreview) {
    console.error('Container de pré-visualização não encontrado');
    return;
  }
  
  // Limpar pré-visualizações existentes
  imagePreview.innerHTML = '';
  
  fetch(`${API_BASE_URL}/admin/properties/${propertyId}/images`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar imagens do imóvel');
      }
      return response.json();
    })
    .then(data => {
      if (data.images && data.images.length > 0) {
        data.images.forEach(image => {
          const div = document.createElement('div');
          div.className = 'relative border rounded-lg overflow-hidden group';
          div.dataset.imageId = image.id;
          
          div.innerHTML = `
            <img src="${image.url}" alt="Imagem do imóvel" class="w-full h-24 object-cover">
            <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button type="button" class="p-1 bg-red-600 rounded-full text-white delete-image" data-image-id="${image.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              ${image.is_main ? '<span class="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Principal</span>' : ''}
            </div>
          `;
          
          imagePreview.appendChild(div);
          
          // Adicionar evento para remover a imagem
          div.querySelector('.delete-image').addEventListener('click', function() {
            deletePropertyImage(propertyId, image.id, div);
          });
        });
      } else {
        console.log('Nenhuma imagem encontrada para este imóvel');
      }
    })
    .catch(error => {
      console.error('Erro ao carregar imagens:', error);
      showAlert('Erro ao carregar imagens do imóvel', 'error');
    });
}

/**
 * Exclui uma imagem do imóvel
 * @param {String} propertyId - ID do imóvel
 * @param {String} imageId - ID da imagem
 * @param {HTMLElement} element - Elemento DOM a ser removido após sucesso
 */
function deletePropertyImage(propertyId, imageId, element) {
  if (!confirm('Tem certeza que deseja excluir esta imagem?')) {
    return;
  }
  
  fetch(`${API_BASE_URL}/admin/properties/${propertyId}/images/${imageId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao excluir imagem');
      }
      return response.json();
    })
    .then(data => {
      console.log('Imagem excluída com sucesso:', data);
      
      // Remover elemento da UI
      if (element) {
        element.remove();
      }
      
      showAlert('Imagem excluída com sucesso', 'success');
    })
    .catch(error => {
      console.error('Erro ao excluir imagem:', error);
      showAlert('Erro ao excluir imagem', 'error');
    });
}

/**
 * Faz upload das imagens temporárias antes do cadastro do imóvel
 * @param {String} inputId - ID do input de arquivo
 * @returns {Promise} Promise com as URLs das imagens
 */
export function uploadTempImages(inputId = 'property-images') {
  return new Promise((resolve, reject) => {
    const imageInput = document.getElementById(inputId);
    if (!imageInput || imageInput.files.length === 0) {
      resolve({ success: true, images: [] });
      return;
    }
    const formData = new FormData();
    Array.from(imageInput.files).forEach(file => {
      formData.append('images', file);
    });
    fetch(`/api/admin/properties/images/temp`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao fazer upload das imagens');
        }
        return response.json();
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
  });
}

/**
 * Retorna as imagens confirmadas para cadastro
 */
export function getConfirmedImages() {
  return confirmedImages;
}

// Exportar funções
export {
  initImageUploader,
  uploadPropertyImages,
  loadExistingImages,
  deletePropertyImage,
  initImageUploaderWithConfirmation
}; 