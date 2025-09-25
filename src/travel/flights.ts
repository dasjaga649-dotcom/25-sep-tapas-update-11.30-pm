const backgroundImage = "https://t3.ftcdn.net/jpg/02/91/60/90/360_F_291609042_wBT8QL5iSzK3cCGyUVNy4PZSsyhejG8V.jpg";
const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getCardHtml = (flight: any) => {
  const logo = flight?.airline_logo || flight?.carrier_logo || imageComingSoon;
  const airline = flight?.airline || flight?.carrier_name || flight?.carrier || '';
  const dep = new Date(flight?.departuredatetime || flight?.departureDateTime || flight?.departure_time || flight?.departure);
  const arr = new Date(flight?.arrivaldatetime || flight?.arrivalDateTime || flight?.arrival_time || flight?.arrival);
  const depTime = isNaN(dep.getTime()) ? '' : dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const arrTime = isNaN(arr.getTime()) ? '' : arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const depDate = isNaN(dep.getTime()) ? '' : dep.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
  const arrDate = isNaN(arr.getTime()) ? '' : arr.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
  const from = flight?.departureairportcode || flight?.from || flight?.source || '';
  const to = flight?.arrivalairportcode || flight?.to || flight?.destination || '';

  // duration - backend may send string minutes
  const durationMinutes = Number(flight?.totalduration ?? flight?.totalDuration ?? flight?.duration) || 0;
  const durationText = durationMinutes ? formatDuration(durationMinutes) : (flight?.duration || '');

  // stops / layovers
  const stopsVal = Array.isArray(flight?.layovers) ? flight.layovers.length : (typeof flight?.stops === 'number' ? flight.stops : (Array.isArray(flight?.segments) ? Math.max(0, flight.segments.length - 1) : 0));
  const stopsText = stopsVal === 0 ? 'Non-stop' : `${stopsVal} stop${stopsVal>1?'s':''}`;

  // price and currency formatting (convert USD to INR for display)
  const currency = (flight?.priceCurrency || flight?.pricecurrency || flight?.currency || '').toString().toUpperCase() || '';
  const rawPrice = Number((flight?.price ?? flight?.amount ?? 0));
  let priceDisplay = '';
  const USD_TO_INR = 83; // conservative fixed rate
  if (currency === 'INR') {
    priceDisplay = `₹ ${rawPrice.toLocaleString('en-IN')}`;
  } else if (currency === 'USD') {
    const inr = Math.round(rawPrice * USD_TO_INR);
    priceDisplay = `₹ ${inr.toLocaleString('en-IN')}`;
  } else if (currency) {
    priceDisplay = `${currency} ${rawPrice.toLocaleString('en-US')}`;
  } else {
    priceDisplay = rawPrice.toString();
  }

  const travelClass = flight?.travelclass || flight?.cabin || 'Economy';

  // only show a marker on the duration line when there are stops
  const markerHtml = stopsVal > 0 ? `<div class="absolute left-1/2 transform -translate-x-1/2 -top-2 flight-duration-marker"></div>` : '';

  return `
    <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3 sm:min-w-[160px]">
        <img src="${logo}" alt="${airline} logo" class="w-10 h-10 rounded object-contain bg-white" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='contain'"/>
        <div class="flex flex-col">
          <div class="font-semibold text-gray-800">${airline}</div>
          <span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full inline-block mt-1">${travelClass}</span>
        </div>
      </div>
      <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
        <div class="flex flex-col">
          <div class="text-xl sm:text-2xl font-bold leading-tight">${depTime}</div>
          <div class="text-xs text-gray-500">${from}</div>
          <div class="text-xs text-gray-500">${depDate}</div>
        </div>
        <div class="flex flex-col items-center justify-center">
          <div class="font-medium">${durationText}</div>
          <div class="w-24 my-2 relative">
            <div class="h-px bg-gray-300 w-full"></div>
            ${markerHtml}
          </div>
          <div class="text-xs text-gray-500">${stopsText}</div>
        </div>
        <div class="flex flex-col items-end sm:items-end">
          <div class="text-xl sm:text-2xl font-bold leading-tight">${arrTime}</div>
          <div class="text-xs text-gray-500">${to}</div>
          <div class="text-xs text-gray-500">${arrDate}</div>
        </div>
      </div>
      <div class="flex flex-col sm:items-end items-start gap-2 sm:min-w-[120px]">
        <div class="text-right w-full sm:w-auto">
          <div class="text-gray-900 font-semibold">${priceDisplay}</div>
        </div>
        <button class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm w-full sm:w-auto">Select Flight</button>
      </div>
    </div>
  `;
};

const renderFlightsInPlace = (filteredData: any[]) => {
  const flightsContainer = document.getElementById('flights-container');
  if (flightsContainer) {
    flightsContainer.innerHTML = filteredData.map(getCardHtml).join('');
  }
};

const renderFiltersAndSorts = (container: HTMLElement, data: any[]) => {
  const allAirlines = Array.from(new Set((data || []).map(flight => flight?.airline).filter(Boolean))).sort();
  // compute per-airline minimum price to show as starting price
  const airlineMinMap: Record<string, number> = {};
  allAirlines.forEach(al => {
    const prices = (data || []).filter(f => f?.airline === al).map(f => parseFloat((f?.price || '').toString().replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
    airlineMinMap[al] = prices.length ? Math.floor(Math.min(...prices)) : 0;
  });

  const airlineOptionsHtml = allAirlines.map(airline => `
    <label class="amenity-option flex items-center gap-2 text-gray-700">
      <input type="checkbox" name="airline-filter" value="${airline}" class="form-checkbox h-4 w-4 text-blue-600 rounded">
      <span class="flex-1">${airline}</span>
      <input type="number" class="airline-start-price ml-2 w-20 p-1 border rounded text-sm" data-airline="${airline}" value="${airlineMinMap[airline]}" min="0">
    </label>
  `).join('');

  // determine min/max price from data
  const numericPrices = (data || []).map(h => parseFloat((h?.price || '').toString().replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
  const globalMin = numericPrices.length ? Math.min(...numericPrices) : 0;
  const globalMax = numericPrices.length ? Math.max(...numericPrices) : 1000;
  const MIN_VAL = Math.floor(globalMin);
  const MAX_VAL = Math.ceil(globalMax);

  const filtersHtml = `
    <div class="p-4 space-y-4">
      <div>
        <h4 class="text-lg font-bold mb-2">Filter by Airline</h4>
        <div class="amenity-grid mt-1 max-h-32 overflow-y-auto" id="airline-filters">
          ${airlineOptionsHtml}
        </div>
      </div>
      <div>
        <h4 class="text-lg font-bold mb-2">Filter by Price</h4>
        <div class="slider-wrapper relative h-12">
          <div class="slider-track"></div>
          <div id="flight-slider-range" class="slider-range"></div>

          <input id="flight-min-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MIN_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="flight-min-thumb" class="slider-thumb" style="left:0%;"></div>
          <div id="flight-min-value-display" class="value-display">₹${MIN_VAL}</div>

          <input id="flight-max-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MAX_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="flight-max-thumb" class="slider-thumb" style="left:100%;"></div>
          <div id="flight-max-value-display" class="value-display">₹${MAX_VAL}</div>
        </div>
        <div class="text-center font-medium text-sm text-gray-700 mt-2"><p id="flight-current-range-text">₹${MIN_VAL} - ₹${MAX_VAL}</p></div>
      </div>
      <div>
        <h4 class="text-lg font-bold mb-2">Sort by:</h4>
        <div class="amenity-grid" id="flight-sorts">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="price-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Price (Low to High)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="price-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Price (High to Low)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="duration-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Duration (Shortest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="duration-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Duration (Longest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="departure-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Departure (Earliest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="departure-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Departure (Latest)</span>
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

const attachEventListeners = (chatMessages: HTMLElement, flightData: any[]) => {
  const filterBtn = chatMessages.querySelector('.filter-btn') as HTMLElement | null;
  const modal = chatMessages.querySelector('.filter-modal') as HTMLElement | null;
  const closeBtn = chatMessages.querySelector('.close-modal') as HTMLElement | null;
  const applyBtn = chatMessages.querySelector('#apply-filters-btn') as HTMLElement | null;

  if (filterBtn && modal && closeBtn && applyBtn) {
    filterBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // wire up flight price slider
    try {
      const minSlider = modal.querySelector('#flight-min-slider') as HTMLInputElement | null;
      const maxSlider = modal.querySelector('#flight-max-slider') as HTMLInputElement | null;
      const rangeEl = modal.querySelector('#flight-slider-range') as HTMLElement | null;
      const minThumb = modal.querySelector('#flight-min-thumb') as HTMLElement | null;
      const maxThumb = modal.querySelector('#flight-max-thumb') as HTMLElement | null;
      const minValueDisplay = modal.querySelector('#flight-min-value-display') as HTMLElement | null;
      const maxValueDisplay = modal.querySelector('#flight-max-value-display') as HTMLElement | null;
      const currentRangeText = modal.querySelector('#flight-current-range-text') as HTMLElement | null;

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
        update();
      }
    } catch (e) { console.warn('Failed to init flight slider', e); }

    applyBtn.addEventListener('click', () => {
      const selectedAirlines = Array.from(modal.querySelectorAll('#airline-filters input[type="checkbox"]:checked')).map((cb: any) => cb.value);
      const sortOption = (modal.querySelector('#flight-sorts input[type="radio"]:checked') as HTMLInputElement | null)?.value || 'none';

      let minPrice = 0, maxPrice = Infinity;
      const minEl = modal.querySelector('#flight-min-slider') as HTMLInputElement | null;
      const maxEl = modal.querySelector('#flight-max-slider') as HTMLInputElement | null;
      if (minEl) minPrice = parseFloat(minEl.value) || 0;
      if (maxEl) maxPrice = parseFloat(maxEl.value) || Infinity;

      // collect per-airline starting prices (if user edited them)
      const airlineStartInputs = Array.from(modal.querySelectorAll('.airline-start-price')) as HTMLInputElement[];
      const airlineStartMap: Record<string, number> = {};
      airlineStartInputs.forEach(inp => {
        const key = inp.getAttribute('data-airline');
        if (!key) return;
        const v = parseFloat(inp.value);
        if (!isNaN(v)) airlineStartMap[key] = v;
      });

      let filteredData = (flightData || []).filter((flight: any) => {
        const flightAirline = flight?.airline;
        const priceNum = parseFloat((flight?.price || '').toString().replace(/[^0-9.]/g, ''));
        const airlineMin = (flightAirline && airlineStartMap[flightAirline] != null) ? airlineStartMap[flightAirline] : minPrice;
        const inPriceRange = !isNaN(priceNum) ? (priceNum >= airlineMin && priceNum <= maxPrice) : false;
        const airlineMatch = selectedAirlines.length === 0 || (flightAirline && selectedAirlines.includes(flightAirline));
        return airlineMatch && inPriceRange;
      });

      if (sortOption === 'price-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sortOption === 'price-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sortOption === 'duration-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.totalduration) - parseFloat(b.totalduration));
      } else if (sortOption === 'duration-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.totalduration) - parseFloat(a.totalduration));
      } else if (sortOption === 'departure-asc') {
        filteredData.sort((a: any, b: any) => new Date(a.departuredatetime as any as string).getTime() - new Date(b.departuredatetime as any as string).getTime());
      } else if (sortOption === 'departure-desc') {
        filteredData.sort((a: any, b: any) => new Date(b.departuredatetime as any as string).getTime() - new Date(a.departuredatetime as any as string).getTime());
      }

      renderFlightsInPlace(filteredData);
      modal.classList.add('hidden');
    });
  }
};

export const renderFlights = (data: any[], isMobile: boolean, chatMessages: HTMLElement) => {
  const count = (data || []).length;
  const mainHtml = `
    <div class="flex items-center justify-between mb-3">
      <div class="text-gray-600 text-sm">${count ? `Showing ${count} of ${count} flights` : 'No flights found'}</div>
      <button class="filter-btn text-gray-600 hover:text-gray-900 transition-colors" title="Filters & Sorts">
        <i class="fas fa-filter"></i>
      </button>
    </div>
    <div id="flights-container" class="space-y-3">
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
