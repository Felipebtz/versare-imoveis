// Cadastro em Massa de Imóveis
// Este módulo cuida da lógica da página de cadastro-massa-imoveis.html

import { API_BASE_URL } from '../config/auth.js';
import { showAlert } from './ui.js';

const massTbody = document.getElementById('mass-tbody');
const addRowBtn = document.getElementById('add-row-btn');
const jsonModalBtn = document.getElementById('json-modal-btn');
const jsonModal = document.getElementById('json-modal');
const jsonInput = document.getElementById('json-input');
const jsonCancel = document.getElementById('json-cancel');
const jsonApply = document.getElementById('json-apply');
const massForm = document.getElementById('massForm');

// Campos do imóvel (os mesmos do novo-imovel)
const propertyFields = [
  'title', 'code', 'type', 'status', 'property_type', 'price', 'neighborhood', 'city', 'address', 'postal_code',
  'area', 'bedrooms', 'bathrooms', 'parking_spaces', 'suites', 'furnished', 'amenities', 'description', 'images', 'videos', 'featured'
];

// Comodidades disponíveis
const amenitiesList = [
  'piscina', 'academia', 'playground', 'churrasqueira', 'seguranca', 'spa', 'jardim', 'elevador'
];

// Adiciona uma nova linha (imóvel)
function addRow(data = {}) {
  const row = document.createElement('tr');
  row.className = 'border-b';
  row.innerHTML = `
    <td><input type="text" name="title" class="p-2 border rounded w-40" value="${data.title || ''}"></td>
    <td><input type="text" name="code" class="p-2 border rounded w-24" value="${data.code || ''}"></td>
    <td>
      <select name="type" class="p-2 border rounded">
        <option value="">Tipo</option>
        <option value="venda" ${data.type==='venda'?'selected':''}>Venda</option>
        <option value="aluguel" ${data.type==='aluguel'?'selected':''}>Aluguel</option>
        <option value="lancamento" ${data.type==='lancamento'?'selected':''}>Lançamento</option>
      </select>
    </td>
    <td>
      <select name="status" class="p-2 border rounded">
        <option value="ativo" ${data.status==='ativo'?'selected':''}>Ativo</option>
        <option value="inativo" ${data.status==='inativo'?'selected':''}>Inativo</option>
        <option value="vendido" ${data.status==='vendido'?'selected':''}>Vendido/Alugado</option>
      </select>
    </td>
    <td>
      <select name="property_type" class="p-2 border rounded">
        <option value="">Tipo</option>
        <option value="apartamento" ${data.property_type==='apartamento'?'selected':''}>Apartamento</option>
        <option value="casa" ${data.property_type==='casa'?'selected':''}>Casa</option>
        <option value="cobertura" ${data.property_type==='cobertura'?'selected':''}>Cobertura</option>
        <option value="sala-comercial" ${data.property_type==='sala-comercial'?'selected':''}>Sala Comercial</option>
        <option value="terreno" ${data.property_type==='terreno'?'selected':''}>Terreno/Lote</option>
        <option value="galpao" ${data.property_type==='galpao'?'selected':''}>Galpão</option>
      </select>
    </td>
    <td><input type="number" name="price" class="p-2 border rounded w-28" value="${data.price || ''}" min="0"></td>
    <td><input type="text" name="neighborhood" class="p-2 border rounded w-32" value="${data.neighborhood || ''}"></td>
    <td><input type="text" name="city" class="p-2 border rounded w-32" value="${data.city || ''}"></td>
    <td><input type="text" name="address" class="p-2 border rounded w-40" value="${data.address || ''}"></td>
    <td><input type="text" name="postal_code" class="p-2 border rounded w-24" value="${data.postal_code || ''}"></td>
    <td><input type="number" name="area" class="p-2 border rounded w-20" value="${data.area || ''}" min="0"></td>
    <td><input type="number" name="bedrooms" class="p-2 border rounded w-16" value="${data.bedrooms || ''}" min="0"></td>
    <td><input type="number" name="bathrooms" class="p-2 border rounded w-16" value="${data.bathrooms || ''}" min="0"></td>
    <td><input type="number" name="parking_spaces" class="p-2 border rounded w-16" value="${data.parking_spaces || ''}" min="0"></td>
    <td><input type="number" name="suites" class="p-2 border rounded w-16" value="${data.suites || ''}" min="0"></td>
    <td>
      <select name="furnished" class="p-2 border rounded">
        <option value="nao" ${data.furnished==='nao'?'selected':''}>Não</option>
        <option value="sim" ${data.furnished==='sim'?'selected':''}>Sim</option>
        <option value="parcial" ${data.furnished==='parcial'?'selected':''}>Parcialmente</option>
      </select>
    </td>
    <td>
      <div class="flex flex-col gap-1">
        ${amenitiesList.map(a => `<label class="flex items-center"><input type="checkbox" name="amenities" value="${a}" ${data.amenities && data.amenities.includes(a)?'checked':''}> ${a.charAt(0).toUpperCase()+a.slice(1)}</label>`).join('')}
      </div>
    </td>
    <td><textarea name="description" class="p-2 border rounded w-40">${data.description || ''}</textarea></td>
    <td>
      <input type="file" name="images" multiple accept="image/png,image/jpeg,image/jpg" class="block w-40">
      <div class="text-xs text-gray-500">PNG/JPG até 5MB</div>
    </td>
    <td>
      <textarea name="videos" class="p-2 border rounded w-40" placeholder='["https://youtube.com/..."]'>${data.videos ? JSON.stringify(data.videos) : ''}</textarea>
    </td>
    <td class="text-center"><input type="checkbox" name="featured" ${data.featured ? 'checked' : ''}></td>
    <td class="text-center"><button type="button" class="remove-row-btn text-red-600 font-bold">X</button></td>
  `;
  // Remover linha
  row.querySelector('.remove-row-btn').onclick = () => row.remove();
  massTbody.appendChild(row);
}

// Adiciona linha vazia ao carregar
addRow();

addRowBtn.onclick = () => addRow();

// Modal JSON
jsonModalBtn.onclick = () => jsonModal.classList.remove('hidden');
jsonCancel.onclick = () => jsonModal.classList.add('hidden');
jsonApply.onclick = () => {
  try {
    const arr = JSON.parse(jsonInput.value);
    if (!Array.isArray(arr)) throw new Error('JSON deve ser um array');
    massTbody.innerHTML = '';
    arr.forEach(obj => addRow(obj));
    jsonModal.classList.add('hidden');
  } catch (e) {
    alert('JSON inválido: ' + e.message);
  }
};

// Modal de preview melhorado
let previewData = [];
let previewIndex = 0;

function showPreviewModal(imoveis) {
  let modal = document.getElementById('preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
    document.body.appendChild(modal);
  }
  function renderPreview(idx) {
    const imovel = imoveis[idx];
    // Nomes dos arquivos de imagem
    let imageNames = [];
    if (imovel._imagesInput && imovel._imagesInput.files.length > 0) {
      imageNames = Array.from(imovel._imagesInput.files).map(f => f.name);
    }
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto relative">
        <h2 class="text-xl font-bold mb-4">Pré-visualização do imóvel ${idx+1} de ${imoveis.length}</h2>
        <div class="mb-2 font-semibold text-lg">${imovel.title || ''} <span class="text-gray-500">(${imovel.code || ''})</span></div>
        <div class="mb-4 flex flex-wrap gap-2 text-sm">
          <span class="bg-gray-100 rounded px-2 py-1">Bairro: ${imovel.neighborhood || ''}</span>
          <span class="bg-gray-100 rounded px-2 py-1">Cidade: ${imovel.city || ''}</span>
          <span class="bg-gray-100 rounded px-2 py-1">Tipo: ${imovel.property_type || ''}</span>
          <span class="bg-gray-100 rounded px-2 py-1">Preço: R$ ${imovel.price || ''}</span>
        </div>
        <div class="mb-4">
          <span class="font-semibold">Arquivos de imagem selecionados:</span>
          <ul class="list-disc ml-6 text-xs mt-1">
            ${imageNames.length ? imageNames.map(n => `<li>${n}</li>`).join('') : '<li class="text-gray-400">Nenhum arquivo selecionado</li>'}
          </ul>
        </div>
        <div class="mb-4">
          <span class="font-semibold">JSON completo:</span>
          <pre class="text-xs bg-gray-100 rounded p-2 overflow-x-auto"><code>${syntaxHighlight(JSON.stringify(imovel, null, 2))}</code></pre>
        </div>
        <div class="flex justify-between items-center mt-6 gap-4">
          <button id="preview-cancel" class="btn btn-secondary">Cancelar</button>
          <div class="flex gap-2">
            <button id="preview-prev" class="btn btn-secondary" ${idx === 0 ? 'disabled' : ''}>&larr; Anterior</button>
            <button id="preview-next" class="btn btn-secondary" ${idx === imoveis.length-1 ? 'disabled' : ''}>Próximo &rarr;</button>
          </div>
          <button id="preview-confirm" class="btn btn-primary bg-[#142a3d] text-white">Confirmar e Enviar</button>
        </div>
        <div id="preview-loading" class="hidden absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-[#142a3d] border-b-4 border-gray-200"></div>
        </div>
      </div>
    `;
    // Eventos
    modal.querySelector('#preview-cancel').onclick = () => {
      modal.classList.add('hidden');
      previewData = [];
    };
    modal.querySelector('#preview-prev').onclick = () => {
      if (previewIndex > 0) {
        previewIndex--;
        renderPreview(previewIndex);
      }
    };
    modal.querySelector('#preview-next').onclick = () => {
      if (previewIndex < imoveis.length-1) {
        previewIndex++;
        renderPreview(previewIndex);
      }
    };
    modal.querySelector('#preview-confirm').onclick = async () => {
      modal.querySelector('#preview-loading').classList.remove('hidden');
      await sendBatch(imoveis);
      modal.classList.add('hidden');
    };
  }
  previewIndex = 0;
  renderPreview(previewIndex);
}

// Função para destaque de sintaxe JSON
function syntaxHighlight(json) {
  if (!json) return '';
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-blue-700';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-purple-700';
      } else {
        cls = 'text-green-700';
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-red-700';
    } else if (/null/.test(match)) {
      cls = 'text-gray-500';
    } else {
      cls = 'text-orange-700';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

async function sendBatch(imoveis) {
  let success = 0, fail = 0;
  for (const data of imoveis) {
    // Upload de imagens
    let images = data.images || [];
    if (data._imagesInput && data._imagesInput.files.length > 0) {
      const formData = new FormData();
      Array.from(data._imagesInput.files).forEach(file => formData.append('images', file));
      try {
        const res = await fetch(`${API_BASE_URL}/admin/properties/images/temp`, {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (result.success && result.images) {
          images = result.images;
        }
      } catch (err) {
        showAlert('Erro ao enviar imagens de um imóvel', 'error');
        fail++;
        continue;
      }
    }
    data.images = images;
    delete data._imagesInput;
    // Envio do imóvel
    try {
      const res = await fetch(`${API_BASE_URL}/admin/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Erro ao cadastrar imóvel');
      success++;
    } catch (err) {
      fail++;
    }
  }
  showAlert(`${success} imóveis cadastrados com sucesso, ${fail} falharam.`, fail ? 'warning' : 'success');
  if (success) setTimeout(() => window.location.href = 'imoveis.html', 2000);
}

// Substituir massForm.onsubmit
massForm.onsubmit = async (e) => {
  e.preventDefault();
  const rows = Array.from(massTbody.querySelectorAll('tr'));
  if (rows.length === 0) return showAlert('Adicione pelo menos um imóvel.', 'error');
  const imoveis = [];
  for (const row of rows) {
    const data = {};
    propertyFields.forEach(field => {
      if (field === 'amenities') {
        data.amenities = Array.from(row.querySelectorAll('input[name="amenities"]:checked')).map(i => i.value);
      } else if (field === 'images') {
        // Imagens tratadas abaixo
        data._imagesInput = row.querySelector('input[type="file"][name="images"]');
      } else if (field === 'videos') {
        try {
          data.videos = JSON.parse(row.querySelector('textarea[name="videos"]').value || '[]');
        } catch {
          data.videos = [];
        }
      } else if (field === 'featured') {
        data.featured = row.querySelector('input[name="featured"]').checked ? 1 : 0;
      } else {
        const el = row.querySelector(`[name="${field}"]`);
        data[field] = el ? el.value : '';
      }
    });
    imoveis.push(data);
  }
  previewData = imoveis;
  showPreviewModal(imoveis);
}; 