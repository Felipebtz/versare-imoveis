/**
 * Módulo de gerenciamento de imóveis
 */

import { API_BASE_URL } from '../config/auth.js';
import { showAlert, formatPrice, formatPropertyType, updatePaginationInfo } from './ui.js';
import { uploadPropertyImages, uploadTempImages, getConfirmedImages, initImageUploaderWithConfirmation } from './image-uploader.js';
import { initVideoManager, saveVideos, loadExistingVideos } from './video-manager.js';

// Função de debounce para evitar múltiplas requisições
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Inicializar filtros e eventos
export function initializeFilters() {
  if (!window.location.pathname.includes('imoveis.html')) return;
  
  // Configurar eventos de filtro
  const searchInput = document.getElementById('search');
  const filterType = document.getElementById('filter_type');
  const filterStatus = document.getElementById('filter_status');
  const filterButton = document.querySelector('button[type="submit"]');
  
  // Aplicar debounce na busca
  const debouncedSearch = debounce(() => {
    window.currentPage = 1; // Resetar paginação ao buscar
    loadProperties();
  }, 500);
  
  // Evento de busca em tempo real
  if (searchInput) {
    searchInput.addEventListener('input', debouncedSearch);
  }
  
  // Eventos de filtro
  if (filterType) {
    filterType.addEventListener('change', () => {
      window.currentPage = 1;
      loadProperties();
    });
  }
  
  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      window.currentPage = 1;
      loadProperties();
    });
  }
  
  // Evento do botão de filtrar
  if (filterButton) {
    filterButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.currentPage = 1;
      loadProperties();
    });
  }
  
  // Configurar paginação
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (window.currentPage > 1) {
        window.currentPage--;
        loadProperties();
      }
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (window.currentPage < window.totalPages) {
        window.currentPage++;
        loadProperties();
      }
    });
  }
  
  // Carregar imóveis inicialmente
  loadProperties();
}

// Carregar lista de imóveis
export function loadProperties() {
  if (!window.location.pathname.includes('imoveis.html')) return;
  
  const tableBody = document.querySelector('.property-list');
  const filterButton = document.querySelector('button[type="submit"]');
  
  if (!tableBody) return;
  
  // Obter dados de filtro
  const search = document.getElementById('search')?.value || '';
  const filterType = document.getElementById('filter_type')?.value || '';
  const filterStatus = document.getElementById('filter_status')?.value || '';
  
  // Obter dados de paginação
  const currentPage = window.currentPage || 1;
  const itemsPerPage = window.itemsPerPage || 10;
  
  // Construir query string
  let queryParams = `page=${currentPage}&limit=${itemsPerPage}`;
  if (search) queryParams += `&search=${encodeURIComponent(search)}`;
  if (filterType) queryParams += `&type=${encodeURIComponent(filterType)}`;
  if (filterStatus) queryParams += `&status=${encodeURIComponent(filterStatus)}`;
  
  // Atualizar UI para estado de carregamento
  tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Carregando imóveis...</td></tr>';
  if (filterButton) {
    filterButton.disabled = true;
    filterButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Filtrando...
    `;
  }
  
  // Desabilitar inputs durante a busca
  const inputs = document.querySelectorAll('#search, #filter_type, #filter_status');
  inputs.forEach(input => input.disabled = true);
  
  // Fazer requisição para a API
  fetch(`${API_BASE_URL}/admin/properties?${queryParams}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar imóveis');
      }
      return response.json();
    })
    .then(data => {
      const properties = data.properties || data;
      const totalItems = data.total || properties.length;
      const totalPages = data.totalPages || Math.ceil(totalItems / itemsPerPage);
      
      // Atualizar variáveis de paginação
      window.totalItems = totalItems;
      window.totalPages = totalPages;
      
      // Atualizar botões de paginação
      const prevButton = document.getElementById('prev-page');
      const nextButton = document.getElementById('next-page');
      
      if (prevButton) {
        prevButton.disabled = currentPage <= 1;
      }
      
      if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
      }
      
      if (properties.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-8">
              <div class="flex flex-col items-center justify-center text-gray-500">
                <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Nenhum imóvel encontrado</p>
                <p class="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            </td>
          </tr>
        `;
        
        // Atualizar informações de paginação
        updatePaginationInfo(0, 0, 0);
        
        return;
      }
      
      // Calcular intervalo de exibição
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(start + properties.length - 1, totalItems);
      
      // Atualizar informações de paginação
      updatePaginationInfo(start, end, totalItems);
      
      // Limpar a tabela
      tableBody.innerHTML = '';
      
      // Adicionar cada propriedade à tabela
      properties.forEach(property => {
        const row = document.createElement('tr');
        
        // Formatar status para exibição
        let statusClass = '';
        let statusText = property.status;
        
        switch (property.status) {
          case 'ativo':
            statusClass = 'bg-green-100 text-green-800';
            statusText = 'Ativo';
            break;
          case 'inativo':
            statusClass = 'bg-gray-100 text-gray-800';
            statusText = 'Inativo';
            break;
          case 'vendido':
            statusClass = 'bg-yellow-100 text-yellow-800';
            statusText = 'Vendido/Alugado';
            break;
        }
        
        // Formatar preço para exibição
        let formattedPrice = '';
        if (property.type === 'aluguel') {
          formattedPrice = `R$ ${formatPrice(property.price)}/mês`;
        } else if (property.type === 'lancamento') {
          formattedPrice = `A partir de R$ ${formatPrice(property.price)}`;
        } else {
          formattedPrice = `R$ ${formatPrice(property.price)}`;
        }
        
        row.innerHTML = `
          <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${property.code}</td>
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${property.title}</td>
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${formatPropertyType(property.type)}</td>
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${property.neighborhood} - ${property.city}</td>
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${formattedPrice}</td>
          <td class="px-4 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span>
          </td>
          <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
            <a href="editar-imovel.html?id=${property.id}" class="text-[#142a3d] hover:text-indigo-800 mr-3">Editar</a>
            <a href="javascript:void(0)" class="text-red-600 hover:text-red-800 delete-property" data-id="${property.id}">Remover</a>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Adicionar eventos para botões de exclusão
      document.querySelectorAll('.delete-property').forEach(button => {
        button.addEventListener('click', function() {
          const propertyId = this.getAttribute('data-id');
          deleteProperty(propertyId);
        });
      });
    })
    .catch(error => {
      console.error('Erro ao carregar imóveis:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8">
            <div class="flex flex-col items-center justify-center text-red-500">
              <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-lg font-medium">Erro ao carregar imóveis</p>
              <p class="text-sm">${error.message}</p>
            </div>
          </td>
        </tr>
      `;
      
      // Atualizar informações de paginação
      updatePaginationInfo(0, 0, 0);
    })
    .finally(() => {
      // Restaurar UI após carregamento
      if (filterButton) {
        filterButton.disabled = false;
        filterButton.innerHTML = 'Filtrar';
      }
      
      // Reabilitar inputs
      inputs.forEach(input => input.disabled = false);
    });
}

// Função para excluir um imóvel
function deleteProperty(propertyId) {
  if (!confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  // Fazer requisição para a API
  fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao excluir imóvel');
      }
      return response.json();
    })
    .then(data => {
      showAlert('Imóvel excluído com sucesso', 'success');
      
      // Recarregar a lista de imóveis
      loadProperties();
    })
    .catch(error => {
      console.error('Erro ao excluir imóvel:', error);
      showAlert('Erro ao excluir imóvel: ' + error.message, 'error');
    });
}

/**
 * Verifica se já existe um imóvel com o código informado
 * @param {string} code
 * @returns {Promise<boolean>}
 */
async function checkCodeExists(code) {
  if (!code) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/admin/properties`);
    if (!response.ok) return false;
    const properties = await response.json();
    return properties.some(p => String(p.code).toLowerCase() === String(code).toLowerCase());
  } catch (e) {
    return false;
  }
}

// Função utilitária para delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para mostrar/atualizar o modal de progresso
function showProgressModal(status, percent, done = false) {
  const modal = document.getElementById('progress-modal');
  const bar = document.getElementById('progress-bar');
  const statusText = document.getElementById('progress-status');
  const closeBtn = document.getElementById('close-progress-btn');
  if (!modal || !bar || !statusText) return;
  modal.classList.remove('hidden');
  bar.style.width = percent + '%';
  statusText.textContent = status;
  if (done) {
    closeBtn.classList.remove('hidden');
    closeBtn.onclick = () => modal.classList.add('hidden');
  } else {
    closeBtn.classList.add('hidden');
  }
}

// Função principal de cadastro/edição em etapas
async function handlePropertyForm(event) {
  event.preventDefault();
  const form = event.target;
  const isEditing = form.getAttribute('data-editing') === 'true';
  const propertyId = form.getAttribute('data-property-id');
  console.log('[DEPURAÇÃO] Iniciando envio do formulário de imóvel. Edição:', isEditing);

  // Obter dados do formulário
  let priceValue = form.querySelector('#price')?.value;
  if (priceValue === undefined || priceValue === null || priceValue === '' || isNaN(Number(priceValue))) {
    showAlert('O campo preço é obrigatório e deve ser um número.', 'error');
    console.log('[DEPURAÇÃO] Falha: campo preço inválido');
    return;
  }
  priceValue = String(Number(priceValue));
  const formData = {
    code: form.querySelector('#code')?.value,
    title: form.querySelector('#title')?.value,
    type: form.querySelector('#type')?.value,
    property_type: form.querySelector('#property_type')?.value,
    price: priceValue,
    status: form.querySelector('#status')?.value,
    neighborhood: form.querySelector('#neighborhood')?.value,
    city: form.querySelector('#city')?.value,
    address: form.querySelector('#address')?.value,
    postal_code: form.querySelector('#postal_code')?.value,
    area: form.querySelector('#area')?.value,
    bedrooms: form.querySelector('#bedrooms')?.value,
    bathrooms: form.querySelector('#bathrooms')?.value,
    parking_spaces: form.querySelector('#parking_spaces')?.value,
    suites: form.querySelector('#suites')?.value,
    furnished: form.querySelector('#furnished')?.value,
    description: form.querySelector('#description')?.value,
    featured: form.querySelector('#featured')?.checked ? 1 : 0
  };
  // Obter comodidades selecionadas
  const amenities = [];
  form.querySelectorAll('input[type="checkbox"][name^="amenity_"]:checked').forEach(checkbox => {
    amenities.push(checkbox.value);
  });
  formData.amenities = amenities;

  // Validar campos obrigatórios
  if (!formData.title || !formData.type || !formData.property_type || !formData.price || 
      !formData.status || !formData.neighborhood || !formData.city) {
    showAlert('Preencha todos os campos obrigatórios', 'error');
    console.log('[DEPURAÇÃO] Falha: campos obrigatórios não preenchidos');
    return;
  }

  // NOVO: Verificar código duplicado antes de enviar (apenas para cadastro)
  if (!isEditing) {
    const codeExists = await checkCodeExists(formData.code);
    if (codeExists) {
      showAlert('Já existe um imóvel com este código. Escolha outro código.', 'error');
      console.log('[DEPURAÇÃO] Falha: já existe imóvel com este código (checado no frontend)');
      return;
    }
  }

  // NOVO: Só permitir cadastro/edição se houver imagens confirmadas
  const confirmedImages = getConfirmedImages();
  if ((!confirmedImages || confirmedImages.length === 0)) {
    showAlert('Adicione e confirme as imagens antes de salvar o imóvel.', 'error');
    console.log('[DEPURAÇÃO] Falha: nenhuma imagem confirmada para o imóvel');
    return;
  }

  // Desabilitar o botão de envio
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';
  }

  // --- ETAPA 1: Enviar dados principais do imóvel ---
  showProgressModal(isEditing ? 'Enviando dados da edição...' : 'Enviando dados do imóvel...', 5);
  let propertyIdCreated = propertyId;
  try {
    let response;
    if (!isEditing) {
      response = await fetch(`${API_BASE_URL}/admin/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images: [] })
      });
      if (!response.ok) throw new Error('Erro ao cadastrar imóvel');
      const data = await response.json();
      propertyIdCreated = data.id;
      console.log('[DEPURAÇÃO] Imóvel cadastrado, ID:', propertyIdCreated);
    } else {
      // Atualização de imóvel (sem imagens)
      response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Erro ao atualizar imóvel');
      console.log('[DEPURAÇÃO] Imóvel atualizado:', propertyId);
    }
  } catch (err) {
    showProgressModal('Erro ao salvar imóvel: ' + err.message, 0, true);
    showAlert('Erro ao salvar imóvel: ' + err.message, 'error');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = isEditing ? 'Atualizar Imóvel' : 'Adicionar Imóvel';
    }
    return;
  }

  // --- ETAPA 2: Associar imagens já enviadas ao imóvel ---
  showProgressModal('Associando imagens ao imóvel...', 10);
  try {
    const resAssoc = await fetch(`${API_BASE_URL}/admin/properties/${propertyIdCreated}/associate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: confirmedImages })
    });
    if (!resAssoc.ok) throw new Error('Falha ao associar imagens ao imóvel');
    showProgressModal('Imagens associadas ao imóvel!', 90);
    console.log('[DEPURAÇÃO] Imagens associadas ao imóvel via API:', confirmedImages);
    await sleep(600);
  } catch (err) {
    showProgressModal('Erro ao associar imagens: ' + err.message, 90, true);
    showAlert('Erro ao associar imagens ao imóvel: ' + err.message, 'error');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = isEditing ? 'Atualizar Imóvel' : 'Adicionar Imóvel';
    }
    return;
  }

  // --- ETAPA FINAL: Sucesso ---
  // Buscar imagens associadas ao imóvel para depuração
  try {
    const resImgs = await fetch(`${API_BASE_URL}/admin/properties/${propertyIdCreated}/images`);
    if (resImgs.ok) {
      const imgs = await resImgs.json();
      console.log('[DEPURAÇÃO] Imagens associadas ao imóvel após upload:', imgs.images);
      if (!imgs.images || imgs.images.length === 0) {
        showAlert('Atenção: Nenhuma imagem foi associada ao imóvel. Verifique o upload!', 'warning');
      }
    }
  } catch (e) {
    console.log('[DEPURAÇÃO] Falha ao buscar imagens associadas ao imóvel:', e);
  }
  showProgressModal(isEditing ? 'Edição finalizada com sucesso!' : 'Cadastro finalizado com sucesso!', 100, true);
  showAlert(isEditing ? 'Imóvel e imagens atualizados com sucesso!' : 'Imóvel e imagens adicionados com sucesso!', 'success');
  setTimeout(() => {
    window.location.href = 'imoveis.html';
  }, 1500);
}

// Carregar detalhes de um imóvel para edição
function loadPropertyForEditing() {
  if (!window.location.pathname.includes('editar-imovel.html')) return;
  
  // Obter o ID do imóvel da URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  
  if (!propertyId) {
    window.location.href = 'imoveis.html';
    return;
  }
  
  const form = document.querySelector('form');
  
  if (!form) return;
  
  // Marcar o formulário como edição
  form.setAttribute('data-editing', 'true');
  form.setAttribute('data-property-id', propertyId);
  
  // Inicializar o gerenciador de vídeos
  initVideoManager();
  
  // Carregar vídeos existentes
  loadExistingVideos(propertyId);
  
  // Carregar dados do imóvel
  fetch(`${API_BASE_URL}/properties/${propertyId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Imóvel não encontrado');
      }
      return response.json();
    })
    .then(property => {
      // Preencher os campos do formulário
      form.querySelector('#code').value = property.code;
      form.querySelector('#code').disabled = true; // Código não editável
      form.querySelector('#title').value = property.title;
      form.querySelector('#type').value = property.type;
      form.querySelector('#property_type').value = property.property_type;
      form.querySelector('#price').value = property.price;
      form.querySelector('#status').value = property.status;
      form.querySelector('#neighborhood').value = property.neighborhood;
      form.querySelector('#city').value = property.city;
      form.querySelector('#address').value = property.address || '';
      form.querySelector('#postal_code').value = property.postal_code || '';
      form.querySelector('#area').value = property.area || '';
      form.querySelector('#bedrooms').value = property.bedrooms || '';
      form.querySelector('#bathrooms').value = property.bathrooms || '';
      form.querySelector('#parking_spaces').value = property.parking_spaces || '';
      form.querySelector('#suites').value = property.suites || '';
      form.querySelector('#furnished').value = property.furnished || 'não';
      form.querySelector('#description').value = property.description || '';
      form.querySelector('#featured').checked = property.featured === 1;
      
      // Marcar as comodidades
      if (property.amenities && property.amenities.length > 0) {
        property.amenities.forEach(amenity => {
          const checkbox = form.querySelector(`input[type="checkbox"][value="${amenity}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
      
      // Atualizar título da página
      document.querySelector('h1').textContent = 'Editar Imóvel';
      document.querySelector('button[type="submit"]').textContent = 'Atualizar Imóvel';
    })
    .catch(error => {
      console.error('Erro ao carregar imóvel para edição:', error);
      showAlert('Erro ao carregar imóvel para edição', 'error');
      
      // Redirecionar para a lista após um breve delay
      setTimeout(() => {
        window.location.href = 'imoveis.html';
      }, 1500);
    });
}

// Função para inicializar o formulário de novo imóvel
export function initNewPropertyForm() {
  if (!window.location.pathname.includes('novo-imovel.html')) return;
  
  console.log('Inicializando formulário de novo imóvel');
  
  // Inicializar o gerenciador de vídeos com todos os parâmetros necessários
  initVideoManager('video-preview', 'video-url', 'video-title', 'add-video-btn');
  console.log('Gerenciador de vídeos inicializado');
  
  // Verificar se a variável global de vídeos está acessível
  setTimeout(() => {
    console.log('Status dos vídeos pendentes:', window.pendingVideos);
  }, 1000);
  
  // Registrar evento de envio do formulário
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handlePropertyForm);
  }
}

// Exportar funções
export {
  // loadProperties,
  deleteProperty,
  handlePropertyForm,
  loadPropertyForEditing
}; 