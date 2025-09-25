const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const safeText = (val: any) => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
};

const getAmenityIcon = (amenity: string) => {
  const iconMap: Record<string, string> = {
    "Hot tub": "fas fa-hot-tub",
    "Beach access": "fas fa-umbrella-beach",
    "Spa": "fas fa-spa",
    "Pool": "fas fa-swimming-pool",
    "Kid-friendly": "fas fa-child",
    "Casino": "fas fa-dice",
    "Restaurant": "fas fa-utensils",
    "Bar": "fas fa-cocktail",
    "Room service": "fas fa-bell",
    "Fitness center": "fas fa-dumbbell",
    "Outdoor pool": "fas fa-swimming-pool",
    "Free breakfast": "fas fa-coffee",
    "Air conditioning": "fas fa-fan",
    "Airport shuttle": "fas fa-shuttle-van",
    "Crib": "fas fa-baby-carriage",
    "Pet-friendly": "fas fa-dog",
    "Smoke-free": "fas fa-smoking-ban",
    "Washer": "fas fa-washer",
    "Wheelchair accessible": "fas fa-wheelchair",
    "Free Wi-Fi": "fas fa-wifi"
  };
  return iconMap[amenity] || 'fas fa-concierge-bell';
};

const getCardHtml = (hotel: any) => {
  const normalizeUrl = (u: any) => {
    const s = (u || '').toString().trim();
    if (!s) return '';
    if (/^(https?:|data:|blob:)/i.test(s)) return s;
    if (s.startsWith('//')) return 'https:' + s;
    return 'https://' + s;
  };
  const rawImage = (hotel?.imageLinks && hotel.imageLinks[0])
    || (hotel?.imagelinks && hotel.imagelinks[0])
    || (hotel?.image_links && hotel.image_links[0])
    || (hotel?.images && hotel.images[0])
    || (hotel?.photos && hotel.photos[0])
    || (hotel?.photoUrls && hotel.photoUrls[0])
    || (hotel?.thumbnail)
    || (hotel?.image && (hotel.image.url || hotel.image))
    || '';
  const imageUrl = rawImage ? normalizeUrl(rawImage) : imageComingSoon;

  const amenitiesHtml = !hotel?.amenities || hotel.amenities[0] == null ? [] : hotel.amenities.map((amenity: string) => `
    <span class="flex items-center space-x-2 text-xs text-gray-200">
      <i class="${getAmenityIcon(amenity)}"></i>
      <span>${amenity}</span>
    </span>
  `).join('');

  const price = safeText(hotel?.price);
  const rating = safeText(hotel?.rating);
  const name = safeText(hotel?.name);
  const websiteRaw = hotel?.link || hotel?.website || hotel?.url || '';
  let website = websiteRaw || '';
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
  const description = safeText(hotel?.description || hotel?.desc || hotel?.overview);

  const priceHtml = price ? `<div class="attraction-icon bg-gray-900 text-white flex items-center"><span class="currency-symbol">₹</span><span>${price}</span></div>` : '';
  const ratingHtml = rating ? `<div class="attraction-rating flex items-center space-x-1"><span>${rating}</span><i class="fas fa-star text-yellow-400"></i></div>` : '';

  // robust extraction of coordinates from possible backend shapes
  const lat = hotel?.location?.lat ?? hotel?.location?.latitude ?? hotel?.lat ?? hotel?.latitude;
  const lon = hotel?.location?.lon ?? hotel?.location?.longitude ?? hotel?.lon ?? hotel?.longitude ?? hotel?.location?.lng ?? hotel?.lng;
  const mapLink = (lat !== undefined && lon !== undefined && lat !== '' && lon !== '') ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : '';

  return `
    <div class="travel-card card-hover-grow flex-none snap-center">
      <img class="travel-card-image" src="${imageUrl}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
      <div class="travel-card-info-top">
        ${priceHtml}
        ${ratingHtml}
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold flex items-center space-x-2">
          <span>${name}</span>
        </h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          ${description ? `<p class="text-sm line-clamp-3 mb-3">${description}</p>` : ''}
          <div class="flex items-center justify-between mt-2">
            ${website ? `<a href="${website}" target="_blank" rel="noopener noreferrer" class="visit-website text-blue-300 hover:underline text-sm font-medium">Visit Website</a>` : `<span></span>`}
            ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="hotel-map-link ml-4" title="Open in Google Maps" aria-label="Open hotel in Google Maps"><i class="fas fa-map-marker-alt"></i></a>` : ''}
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            ${amenitiesHtml}
          </div>
        </div>
      </div>
    </div>
  `;
};

const renderHotelsInPlace = (filteredData: any[]) => {
  const hotelsContainer = document.getElementById('hotels-container');
  if (hotelsContainer) {
    hotelsContainer.innerHTML = filteredData.map(getCardHtml).join('');
  }
};

const renderFiltersAndSorts = (container: HTMLElement, data: any[]) => {
  const allAmenities = Array.from(new Set((data || []).flatMap(hotel => hotel?.amenities || []).filter(Boolean))).sort();
  const amenitiesOptionsHtml = (allAmenities as string[]).map(amenity => `
    <label class="amenity-option flex items-center gap-2 text-gray-700">
      <input type="checkbox" name="amenity" value="${amenity}" class="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500">
      <span class="text-sm">${amenity}</span>
    </label>
  `).join('');

  // determine min/max price from data
  const numericPrices = (data || []).map(h => parseFloat((h?.price || '').toString().replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
  const globalMin = numericPrices.length ? Math.min(...numericPrices) : 0;
  const globalMax = numericPrices.length ? Math.max(...numericPrices) : 1000;
  const MIN_VAL = Math.floor(globalMin);
  const MAX_VAL = Math.ceil(globalMax);

  const filtersHtml = `
    <div class="space-y-6">
      <div>
        <h4 class="text-base font-semibold mb-3">Filter by Amenities</h4>
        <div class="amenity-grid" id="amenity-filters">
          ${amenitiesOptionsHtml}
        </div>
      </div>
      <div>
        <h4 class="text-base font-semibold mb-3">Filter by Price</h4>
        <div class="slider-wrapper relative h-12">
          <div class="slider-track"></div>
          <div id="hotel-slider-range" class="slider-range"></div>

          <input id="hotel-min-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MIN_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="hotel-min-thumb" class="slider-thumb" style="left:0%;"></div>
          <div id="hotel-min-value-display" class="value-display">₹${MIN_VAL}</div>

          <input id="hotel-max-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MAX_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="hotel-max-thumb" class="slider-thumb" style="left:100%;"></div>
          <div id="hotel-max-value-display" class="value-display">₹${MAX_VAL}</div>
        </div>
        <div class="text-center font-medium text-sm text-gray-700 mt-2"><p id="hotel-current-range-text">₹${MIN_VAL} - ₹${MAX_VAL}</p></div>
      </div>
      <div>
        <h4 class="text-base font-semibold mb-3">Filter by Rating</h4>
        <div class="flex flex-wrap gap-4" id="rating-filters">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="4" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">4+ <i class="fas fa-star text-yellow-400"></i></span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="4.5" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">4.5+ <i class="fas fa-star text-yellow-400"></i></span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="rating-filter" value="5" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">5 <i class="fas fa-star text-yellow-400"></i></span>
          </label>
        </div>
      </div>
      <div>
        <h4 class="text-base font-semibold mb-3">Sort</h4>
        <div class="amenity-grid" id="sort-options">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="price-asc" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">Price (Low to High)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="price-desc" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">Price (High to Low)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="rating-desc" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">Rating (High to Low)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="sort-option" value="rating-asc" class="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm">Rating (Low to High)</span>
          </label>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = filtersHtml;
};

const attachEventListeners = (chatMessages: HTMLElement, hotelData: any[]) => {
  const filterBtn = chatMessages.querySelector('.filter-btn') as HTMLElement | null;
  const modal = chatMessages.querySelector('.filter-modal') as HTMLElement | null;
  const closeBtn = chatMessages.querySelector('.close-modal') as HTMLElement | null;
  const applyBtn = chatMessages.querySelector('#apply-filters-btn') as HTMLElement | null;

  if (filterBtn && modal && closeBtn && applyBtn) {
    filterBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // wire up price slider controls inside modal
    try {
      const minSlider = modal.querySelector('#hotel-min-slider') as HTMLInputElement | null;
      const maxSlider = modal.querySelector('#hotel-max-slider') as HTMLInputElement | null;
      const rangeEl = modal.querySelector('#hotel-slider-range') as HTMLElement | null;
      const minThumb = modal.querySelector('#hotel-min-thumb') as HTMLElement | null;
      const maxThumb = modal.querySelector('#hotel-max-thumb') as HTMLElement | null;
      const minValueDisplay = modal.querySelector('#hotel-min-value-display') as HTMLElement | null;
      const maxValueDisplay = modal.querySelector('#hotel-max-value-display') as HTMLElement | null;
      const currentRangeText = modal.querySelector('#hotel-current-range-text') as HTMLElement | null;

      if (minSlider && maxSlider && rangeEl && minThumb && maxThumb && minValueDisplay && maxValueDisplay && currentRangeText) {
        const MIN = parseFloat(minSlider.min);
        const MAX = parseFloat(minSlider.max);
        const update = () => {
          const minVal = Math.min(parseFloat(minSlider.value), parseFloat(maxSlider.value));
          const maxVal = Math.max(parseFloat(minSlider.value), parseFloat(maxSlider.value));
          const minPercent = ((minVal - MIN) / (MAX - MIN)) * 100;
          const maxPercent = ((maxVal - MIN) / (MAX - MIN)) * 100;
          rangeEl.style.left = `${minPercent}%`;
          rangeEl.style.width = `${maxPercent - minPercent}%`;
          minThumb.style.left = `${minPercent}%`;
          maxThumb.style.left = `${maxPercent}%`;
          minValueDisplay.textContent = `₹${minVal}`;
          minValueDisplay.style.left = `${minPercent}%`;
          maxValueDisplay.textContent = `₹${maxVal}`;
          maxValueDisplay.style.left = `${maxPercent}%`;
          currentRangeText.textContent = `₹${minVal} - ₹${maxVal}`;
        };
        minSlider.addEventListener('input', update);
        maxSlider.addEventListener('input', update);
        // initialize
        update();
      }
    } catch (e) { console.warn('Failed to init hotel slider', e); }

    applyBtn.addEventListener('click', () => {
      const selectedAmenities = Array.from(modal.querySelectorAll('#amenity-filters input[type="checkbox"]:checked')).map((cb: any) => cb.value);
      const selectedRating = (modal.querySelector('#rating-filters input[type="radio"]:checked') as HTMLInputElement | null)?.value || '0';
      const sortOption = (modal.querySelector('#sort-options input[type="radio"]:checked') as HTMLInputElement | null)?.value || 'none';

      let minPrice = 0, maxPrice = Infinity;
      const minEl = modal.querySelector('#hotel-min-slider') as HTMLInputElement | null;
      const maxEl = modal.querySelector('#hotel-max-slider') as HTMLInputElement | null;
      if (minEl) minPrice = parseFloat(minEl.value) || 0;
      if (maxEl) maxPrice = parseFloat(maxEl.value) || Infinity;

      let filteredData = (hotelData || []).filter((hotel: any) => {
        const hasAllAmenities = selectedAmenities.length === 0 || (hotel?.amenities && selectedAmenities.every(amenity => hotel.amenities.includes(amenity)));
        const hasMinRating = parseFloat(hotel?.rating) >= parseFloat(selectedRating);
        const priceNum = parseFloat((hotel?.price || '').toString().replace(/[^0-9.]/g, ''));
        const inPriceRange = !isNaN(priceNum) ? (priceNum >= minPrice && priceNum <= maxPrice) : false;
        return hasAllAmenities && hasMinRating && inPriceRange;
      });

      if (sortOption === 'price-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sortOption === 'price-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sortOption === 'rating-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (sortOption === 'rating-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.rating) - parseFloat(b.rating));
      }

      renderHotelsInPlace(filteredData);
      modal.classList.add('hidden');
    });
  }
};

export const renderHotels = (data: any[], isMobile: boolean, chatMessages: HTMLElement) => {
  const mainHtml = `
    <h3 class="text-xl font-bold mb-2 text-gray-800 flex items-center justify-between">
      Found Hotels
      <button class="filter-btn text-gray-600 hover:text-gray-900 transition-colors">
        <i class="fas fa-filter"></i>
      </button>
    </h3>
    <div id="hotels-container" class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
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
          <div class="modal-footer sticky bottom-0 px-4 py-3 border-t bg-white">
            <div class="flex justify-end">
              <button id="apply-filters-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">Apply Filters</button>
            </div>
          </div>
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
