const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const getIcon = (type?: string) => {
  if (type === 'eatery') return 'fas fa-utensils';
  if (type === 'attraction') return 'fas fa-landmark';
  if (type === 'attraction_product') return 'fas fa-route';
  return 'fas fa-map-marker-alt';
};

const getCardHtml = (attraction: any) => {
  const imageUrl = attraction?.imagelinks && attraction.imagelinks.length > 0
    ? attraction.imagelinks[0]
    : imageComingSoon;

  const hasLocation = !!(attraction && attraction.location && typeof attraction.location.lat !== 'undefined');
  const mapLink = hasLocation ? `https://www.google.com/maps?q=${attraction.location.lat},${attraction.location.lon}` : '';

  return `
    <div class="travel-card card-hover-grow flex-none snap-center">
      <img class="travel-card-image" src="${imageUrl}" alt="${attraction?.name || ''}" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
      <div class="travel-card-info-top">
        <div class="attraction-icon bg-gray-900 text-white">
          <i class="${getIcon(attraction?.type)}"></i>
        </div>
        <div class="attraction-rating flex items-center space-x-1">
          <span>${attraction?.rating ?? ''}</span>
          <i class="fas fa-star text-yellow-400"></i>
        </div>
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold flex items-center space-x-2">
          <span>${attraction?.name || ''}</span>
          ${hasLocation ? `<a href="${mapLink}" target="_blank" class="text-blue-300 hover:text-blue-500"><i class="fas fa-map-marker-alt"></i></a>` : ''}
        </h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          <p class="text-sm">${attraction?.description || 'No description available.'}</p>
          ${attraction?.link ? (() => {
            const raw = String(attraction.link || '').trim();
            const hasProtocol = /^https?:\/\//i.test(raw);
            const safeLink = hasProtocol ? raw : `https://${raw}`;
            return `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="text-blue-300 hover:underline text-sm font-medium mt-2 block">Visit Website</a>`;
          })() : ''}
        </div>
      </div>
    </div>
  `;
};

const renderAttractionsInPlace = (filteredData: any[]) => {
  const attractionsContainer = document.getElementById('attractions-container');
  if (attractionsContainer) {
    attractionsContainer.innerHTML = filteredData.map(getCardHtml).join('');
  }
};

const renderFiltersAndSorts = (container: HTMLElement, data: any[]) => {
  const typeAliases: Record<string, string> = {
    'eatery': 'Restaurants',
    'attraction': 'Destinations',
    'attraction_product': 'Tours'
  };
  const uniqueTypes = Array.from(new Set((data || []).map(item => item.type).filter(Boolean))) as string[];
  const typeOptionsHtml = uniqueTypes.map(type => `
    <label class="amenity-option flex items-center gap-2 text-gray-700 capitalize">
      <input type="checkbox" name="type-filter" value="${type}" class="form-checkbox h-4 w-4 text-blue-600 rounded">
      <span>${typeAliases[type] || type}</span>
    </label>
  `).join('');

  const filtersHtml = `
    <div class="p-4">
      <div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Filter by Type</h4>
        <div class="amenity-grid" id="type-filters">
          ${typeOptionsHtml}
        </div>
      </div>
      <div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Filter by Rating</h4>
        <div class="amenity-grid" id="rating-filters">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="4" class="form-radio h-4 w-4 text-blue-600">
            <span>4+ <i class="fas fa-star text-yellow-400"></i></span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="4.5" class="form-radio h-4 w-4 text-blue-600">
            <span>4.5+ <i class="fas fa-star text-yellow-400"></i></span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="5" class="form-radio h-4 w-4 text-blue-600">
            <span>5 <i class="fas fa-star text-yellow-400"></i></span>
          </label>
        </div>
      </div>
      <div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Sort</h4>
        <div class="amenity-grid" id="sort-options">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="rating-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Rating (High to Low)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="rating-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Rating (Low to High)</span>
          </label>
        </div>
      </div>
      <div class="flex justify-end">
        <button id="apply-filters-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">Apply Filters</button>
      </div>
    </div>
  `;
  container.innerHTML = filtersHtml;
};

const attachEventListeners = (chatMessages: HTMLElement, attractionData: any[]) => {
  const filterBtn = chatMessages.querySelector('.filter-btn') as HTMLElement | null;
  const modal = chatMessages.querySelector('.filter-modal') as HTMLElement | null;
  const closeBtn = chatMessages.querySelector('.close-modal') as HTMLElement | null;
  const applyBtn = chatMessages.querySelector('#apply-filters-btn') as HTMLElement | null;

  if (filterBtn && modal && closeBtn && applyBtn) {
    filterBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    applyBtn.addEventListener('click', () => {
      const selectedTypes = Array.from(modal.querySelectorAll('#type-filters input[type="checkbox"]:checked')).map((cb: any) => cb.value);
      const selectedRating = (modal.querySelector('#rating-filters input[type="radio"]:checked') as HTMLInputElement | null)?.value || '0';
      const sortOption = (modal.querySelector('#sort-options input[type="radio"]:checked') as HTMLInputElement | null)?.value || 'none';

      let filteredData = (attractionData || []).filter((item: any) => {
        const itemType = item?.type;
        const typeMatch = selectedTypes.length === 0 || (itemType && selectedTypes.includes(itemType));
        const ratingMatch = parseFloat(item?.rating) >= parseFloat(selectedRating);
        return typeMatch && ratingMatch;
      });

      if (sortOption === 'rating-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (sortOption === 'rating-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.rating) - parseFloat(b.rating));
      }

      renderAttractionsInPlace(filteredData);
      modal.classList.add('hidden');
    });
  }
};

export const renderAttractions = (data: any[], isMobile: boolean, chatMessages: HTMLElement) => {
  const mainHtml = `
    <h3 class="text-xl font-bold mb-2 text-gray-800 flex items-center justify-between">
      Popular Attractions
      <button class="filter-btn text-gray-600 hover:text-gray-900 transition-colors">
        <i class="fas fa-filter"></i>
      </button>
    </h3>
    <div id="attractions-container" class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
      ${(data || []).map(getCardHtml).join('')}
    </div>
    <div class="filter-modal absolute inset-0 modal-backdrop z-50 hidden">
      <div class="modal-panel w-full h-full p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full h-full overflow-hidden flex flex-col">
          <div class="modal-header sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white">
            <h3 class="text-lg font-semibold">Filters & Sorts</h3>
            <button class="close-modal text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
          </div>
          <div class="modal-body flex-1 overflow-y-auto px-4 py-4" id="filter-modal-content"></div>
        </div>
      </div>
    </div>
  `;

  const bubble = document.createElement('div');
  bubble.className = `flex justify-start my-4 ${isMobile ? '' : 'w-full'}`;
  bubble.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-md w-full relative">${mainHtml}</div>`;
  chatMessages.appendChild(bubble);

  const filterModalContent = bubble.querySelector('#filter-modal-content') as HTMLElement | null;
  if (filterModalContent) renderFiltersAndSorts(filterModalContent, data || []);
  attachEventListeners(bubble, data || []);
};
