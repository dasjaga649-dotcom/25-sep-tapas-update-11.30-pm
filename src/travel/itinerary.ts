const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
};

const safeText = (val: any) => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
};

const getCardHtml = (item: any) => {
  const imageUrl = (item?.imageLinks && item.imageLinks.length > 0 ? item.imageLinks[0] : (item?.imagelinks && item.imagelinks[0])) || imageComingSoon;
  const ratingHtml = item?.rating ? `<div class="attraction-rating flex items-center space-x-1"><i class="fas fa-star text-yellow-400"></i><span>${item.rating}</span></div>` : '';
  const priceHtml = item?.price ? `<div class="attraction-icon bg-gray-900 text-white flex items-center space-x-1"><span class="currency-symbol">₹</span><span>${item.price}</span></div>` : '';
  const name = safeText(item?.name);
  const description = safeText(item?.description);

  return `
    <div class="travel-card card-hover-grow flex-none snap-center">
      <img class="travel-card-image" src="${imageUrl}" alt="${name}" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
      <div class="travel-card-info-top">
        ${priceHtml}
        ${ratingHtml}
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold">${name}</h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          ${description ? `<p class="text-sm line-clamp-3">${description}</p>` : ''}
        </div>
      </div>
    </div>
  `;
};

const getActivityRowHtml = (activity: any) => {
  const imageUrl = (activity?.imageLinks && activity.imageLinks[0]) || (activity?.imagelinks && activity.imagelinks[0]) || imageComingSoon;
  const name = safeText(activity?.name);
  const description = safeText(activity?.description);
  const rating = safeText(activity?.rating);
  return `
    <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <img src="${imageUrl}" alt="${name}" class="w-12 h-12 rounded-md object-cover flex-shrink-0" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 truncate">${name}</h4>
          ${rating ? `<span class="ml-2 text-xs text-gray-700 flex items-center"><i class="fas fa-star text-yellow-400 mr-1"></i>${rating}</span>` : ''}
        </div>
        ${description ? `<p class="text-xs text-gray-500 line-clamp-2">${description}</p>` : ''}
      </div>
    </div>`;
};

const renderOverview = (data: any) => {
  const overview = data?.overview || {};
  const { title, summary, stats = {} } = overview as any;

  const statsBoxes: string[] = [];
  const addBox = (value: any, label: string) => {
    const v = safeText(value);
    if (v !== '') {
      statsBoxes.push(`
        <div class="flex-1 min-w-[120px] bg-gray-100 p-3 rounded-lg">
          <h5 class="text-xl font-bold">${v}</h5>
          <p class="text-xs text-gray-500">${label}</p>
        </div>
      `);
    }
  };

  if (typeof stats.durationInDays === 'number' && isFinite(stats.durationInDays)) {
    addBox(stats.durationInDays, 'Days');
  } else if (safeText(stats.durationInDays)) {
    addBox(safeText(stats.durationInDays), 'Days');
  }

  if (typeof stats.placesVisited === 'number' && isFinite(stats.placesVisited)) {
    addBox(stats.placesVisited, 'Places Visited');
  } else if (safeText(stats.placesVisited)) {
    addBox(safeText(stats.placesVisited), 'Places Visited');
  }

  const checkIn = formatDate(stats.checkInDate);
  if (checkIn) addBox(checkIn, 'Check-in');
  const checkOut = formatDate(stats.checkOutDate);
  if (checkOut) addBox(checkOut, 'Check-out');

  const dailyPlan = Array.isArray(data?.dailyPlan) ? data.dailyPlan : [];
  const dailyPlanList = dailyPlan.map((day: any) => {
    const count = (day.activities || []).length;
    const activitiesHtml = (day.activities || []).map(getActivityRowHtml).join('');
    const contentId = `qs-content-${safeText(day.day)}`;
    return `
      <div class="bg-base-200 rounded-lg border border-gray-200">
        <button type="button" class="qs-toggle w-full flex items-center justify-between text-left py-3 px-4" data-target="${contentId}">
          <span class="text-lg font-semibold">Day ${safeText(day.day)}: ${safeText(day.title)}</span>
          <span class="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">${count} activities <i class="fas fa-chevron-down ml-2 text-gray-400"></i></span>
        </button>
        <div id="${contentId}" class="qs-content hidden px-4 pb-4 space-y-2">
          ${activitiesHtml}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-800">${safeText(title)}</h2>
      ${safeText(summary) ? `<p class="text-sm text-gray-600 mb-4">${safeText(summary)}</p>` : ''}
      ${statsBoxes.length ? `<div class="flex flex-wrap gap-4 text-center mb-6">${statsBoxes.join('')}</div>` : ''}
      ${dailyPlan.length ? `
        <h3 class="text-xl font-bold mb-2 text-gray-800">Quick Daily Summary</h3>
        <div class="space-y-2">
          ${dailyPlanList}
        </div>` : ''}
    </div>
  `;
};

const renderDailyPlan = (dailyPlan: any[]) => {
  const days = Array.isArray(dailyPlan) ? dailyPlan : [];
  const dailyCards = days.map(day => `
    <div class="p-6 border-b border-gray-200 last:border-b-0">
      <h3 class="text-lg font-bold mb-2 text-gray-800">Day ${safeText(day.day)}: ${safeText(day.title)}</h3>
      <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
        ${(day.activities || []).map(getCardHtml).join('')}
      </div>
    </div>
  `).join('');
  return `<div class="p-4 space-y-4">${dailyCards}</div>`;
};

const getItineraryAttractionIcon = (type?: string) => {
  if (type === 'eatery') return 'fas fa-utensils';
  if (type === 'attraction') return 'fas fa-landmark';
  if (type === 'attraction_product') return 'fas fa-route';
  return 'fas fa-map-marker-alt';
};

const getExploreAttractionCardHtml = (item: any) => {
  const imageUrl = (item?.imageLinks && item.imageLinks.length > 0 ? item.imageLinks[0] : (item?.imagelinks && item.imagelinks[0])) || imageComingSoon;
  const name = safeText(item?.name);
  const description = safeText(item?.description || item?.overview);
  const rating = safeText(item?.rating);
  const websiteRaw = item?.link || item?.website || item?.url || '';
  let website = websiteRaw || '';
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
  const lat = item?.location?.lat ?? item?.location?.latitude ?? item?.lat ?? item?.latitude;
  const lon = item?.location?.lon ?? item?.location?.longitude ?? item?.lon ?? item?.longitude ?? item?.location?.lng ?? item?.lng;
  const mapLink = (lat !== undefined && lon !== undefined && lat !== '' && lon !== '') ? `https://www.google.com/maps?q=${lat},${lon}` : '';
  const ratingHtml = rating ? `<div class="attraction-rating flex items-center space-x-1"><span>${rating}</span><i class="fas fa-star text-yellow-400"></i></div>` : '';
  const typeIcon = getItineraryAttractionIcon(item?.type);

  return `
    <div class="travel-card card-hover-grow flex-none snap-center">
      <img class="travel-card-image" src="${imageUrl}" alt="${name}" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
      <div class="travel-card-info-top">
        <div class="attraction-icon bg-gray-900 text-white">
          <i class="${typeIcon}"></i>
        </div>
        ${ratingHtml}
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold flex items-center space-x-2">
          <span>${name}</span>
          ${mapLink ? `<a href="${mapLink}" target="_blank" class="text-blue-300 hover:text-blue-500" aria-label="Open in Google Maps"><i class="fas fa-map-marker-alt"></i></a>` : ''}
        </h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          ${description ? `<p class="text-sm">${description}</p>` : ''}
          ${website ? `<a href="${website}" target="_blank" rel="noopener noreferrer" class="text-blue-300 hover:underline text-sm font-medium mt-2 block">Visit Website</a>` : ''}
        </div>
      </div>
    </div>
  `;
};

const renderExploreMore = (exploreMoreData: any[]) => {
  const cards = (exploreMoreData || []).map(getExploreAttractionCardHtml).join('');
  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Explore More</h3>
      <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
        ${cards}
      </div>
    </div>
  `;
};

const backgroundImage = "https://t3.ftcdn.net/jpg/02/91/60/90/360_F_291609042_wBT8QL5iSzK3cCGyUVNy4PZSsyhejG8V.jpg";
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getFlightCardHtml = (flight: any) => {
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

  const durationMinutes = Number(flight?.totalduration ?? flight?.totalDuration ?? flight?.duration) || 0;
  const durationText = durationMinutes ? formatDuration(durationMinutes) : (flight?.duration || '');

  const stopsVal = Array.isArray(flight?.layovers) ? flight.layovers.length : (typeof flight?.stops === 'number' ? flight.stops : (Array.isArray(flight?.segments) ? Math.max(0, flight.segments.length - 1) : 0));
  const stopsText = stopsVal === 0 ? 'Non-stop' : `${stopsVal} stop${stopsVal > 1 ? 's' : ''}`;
  const markerHtml = stopsVal > 0 ? `<div class="absolute left-1/2 transform -translate-x-1/2 -top-2 flight-duration-marker"></div>` : '';

  const currency = (flight?.priceCurrency || flight?.pricecurrency || flight?.currency || '').toString().toUpperCase() || '';
  const rawPrice = Number((flight?.price ?? flight?.amount ?? 0));
  let priceDisplay = '';
  // convert USD prices to INR for display; use a fixed conservative rate
  const USD_TO_INR = 83; // update this rate if needed
  if (currency === 'INR') {
    priceDisplay = `₹ ${rawPrice.toLocaleString('en-IN')}`;
  } else if (currency === 'USD') {
    const inr = Math.round(rawPrice * USD_TO_INR);
    priceDisplay = `₹ ${inr.toLocaleString('en-IN')}`;
  } else if (currency) {
    // default: show currency code and amount
    priceDisplay = `${currency} ${rawPrice.toLocaleString('en-US')}`;
  } else {
    priceDisplay = rawPrice.toString();
  }

  const travelClass = flight?.travelclass || flight?.cabin || 'Economy';

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

const renderFlightsSection = (flightSuggestions: any) => {
  const toArray = (v: any): any[] => Array.isArray(v) ? v : [];
  const sections: { title: string; items: any[] }[] = [];

  if (!flightSuggestions) {
    return `
      <div class="p-6">
        <h3 class="text-xl font-bold mb-4 text-gray-800">Flight Suggestions</h3>
        <div class="text-gray-500">No flights available.</div>
      </div>
    `;
  }

  if (Array.isArray(flightSuggestions)) {
    sections.push({ title: 'All Flights', items: flightSuggestions });
  } else if (typeof flightSuggestions === 'object') {
    if (flightSuggestions.cheapest) sections.push({ title: 'Cheapest', items: toArray(flightSuggestions.cheapest) });
    if (flightSuggestions.shortestDuration) sections.push({ title: 'Shortest Duration', items: toArray(flightSuggestions.shortestDuration) });
    if (flightSuggestions.all) sections.push({ title: 'All Options', items: toArray(flightSuggestions.all) });
    if (flightSuggestions.results) sections.push({ title: 'Results', items: toArray(flightSuggestions.results) });
    if (sections.length === 0) {
      // Fallback: flatten unknown keys into one section
      const combined: any[] = [];
      Object.keys(flightSuggestions).forEach(k => { const v = (flightSuggestions as any)[k]; if (Array.isArray(v)) combined.push(...v); });
      sections.push({ title: 'Flights', items: combined });
    }
  }

  const sectionHtml = sections.map(sec => {
    // Deduplicate within THIS section only
    const seen = new Set<string>();
    const list = sec.items.filter((f: any) => {
      const key = `${f?.departuredatetime || f?.departure || ''}||${f?.arrivaldatetime || f?.arrival || ''}||${f?.airline || ''}||${f?.price || ''}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    });
    const cards = list.map(getFlightCardHtml).join('');
    if (!cards) return '';
    return `
      <div class="space-y-3">
        <h4 class="font-bold text-gray-700 mb-2">${sec.title}</h4>
        ${cards}
      </div>
    `;
  }).join('');

  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Flight Suggestions</h3>
      <div class="space-y-6">
        ${sectionHtml}
      </div>
    </div>
  `;
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

const renderHotelsSection = (hotelRecommendations: any) => {
  const cheapestHotels = hotelRecommendations?.cheapest || [];
  const highestRatedHotels = hotelRecommendations?.highestRated || [];

  const hotelCard = (hotel: any) => {
    const imageUrl = (hotel?.imageLinks && hotel.imageLinks.length > 0 ? hotel.imageLinks[0] : (hotel?.imagelinks && hotel.imagelinks[0])) || imageComingSoon;
    const price = safeText(hotel?.price);
    const rating = safeText(hotel?.rating);
    const name = safeText(hotel?.name);
    const websiteRaw = hotel?.link || hotel?.website || hotel?.url || '';
    let website = websiteRaw || '';
    if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
    const description = safeText(hotel?.description || hotel?.desc || hotel?.overview);
    const lat = hotel?.location?.lat ?? hotel?.location?.latitude ?? hotel?.lat ?? hotel?.latitude;
    const lon = hotel?.location?.lon ?? hotel?.location?.longitude ?? hotel?.lon ?? hotel?.longitude ?? hotel?.location?.lng ?? hotel?.lng;
    const mapLink = (lat !== undefined && lon !== undefined && lat !== '' && lon !== '') ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : '';
    const amenitiesHtml = !hotel?.amenities || hotel.amenities[0] == null ? [] : hotel.amenities.map((amenity: string) => `
      <span class="flex items-center space-x-2 text-xs text-gray-200">
        <i class="${getAmenityIcon(amenity)}"></i>
        <span>${amenity}</span>
      </span>
    `).join('');
    const priceHtml = price ? `<div class="attraction-icon bg-gray-900 text-white flex items-center"><span class="currency-symbol">₹</span><span>${price}</span></div>` : '';
    const ratingHtml = rating ? `<div class="attraction-rating flex items-center space-x-1"><span>${rating}</span><i class="fas fa-star text-yellow-400"></i></div>` : '';

    return `
      <div class="travel-card card-hover-grow flex-none snap-center">
        <img class="travel-card-image" src="${imageUrl}" alt="${name}" onerror="this.onerror=null;this.src='${imageComingSoon}'; this.style.objectFit='cover'">
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

  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Hotel Recommendations</h3>
      <div class="space-y-6">
        <div>
          <h4 class="font-bold text-gray-700 mb-2">Cheapest Options</h4>
          <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
            ${cheapestHotels.map(hotelCard).join('')}
          </div>
        </div>
        <div>
          <h4 class="font-bold text-gray-700 mb-2">Highest Rated</h4>
          <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
            ${highestRatedHotels.map(hotelCard).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
};

export const renderItinerary = (itineraryData: any, isMobile: boolean, chatMessages: HTMLElement) => {
  const sections: { id: string; title: string; content: string }[] = [
    { id: 'overview-page', title: 'Overview', content: renderOverview(itineraryData) },
    { id: 'daily-plan-page', title: 'Daily Plan', content: renderDailyPlan(itineraryData?.dailyPlan || []) },
    ...(itineraryData?.exploreMore ? [{ id: 'explore-more-page', title: 'Explore More', content: renderExploreMore(itineraryData.exploreMore) }] : []),
    ...(itineraryData?.hotelRecommendations ? [{ id: 'hotels-page', title: 'Hotels', content: renderHotelsSection(itineraryData.hotelRecommendations) }] : []),
    ...(itineraryData?.flightSuggestions ? [{ id: 'flights-page', title: 'Flights', content: renderFlightsSection(itineraryData.flightSuggestions) }] : [])
  ];

  const tabsHtml = sections.map((section, index) => `
    <button class="tab-button ${index === 0 ? 'tab-active' : ''}" data-target="${section.id}">
      ${section.title}
    </button>
  `).join('');

  const pagesHtml = sections.map((section, index) => `
    <div id="${section.id}" class="itinerary-page ${index === 0 ? 'page-active' : ''}">
      ${section.content}
    </div>
  `).join('');

  const uid = 'itin-' + Math.random().toString(36).slice(2);
  const mainHtml = `
    <div class="itinerary-tabs-container" id="${uid}">
      <div class="tabs-header">
        <div class="tabs-list">${tabsHtml}</div>
        <button class="pdf-download-btn" id="${uid}-pdf-btn" title="Download itinerary PDF" aria-label="Download itinerary PDF">
          <i class="fas fa-file-download"></i>
          <span class="hidden sm:inline">Download PDF</span>
        </button>
      </div>
      <div class="tabs-content">
        ${pagesHtml}
      </div>
    </div>
  `;

  const bubble = document.createElement('div');
  bubble.className = `flex justify-start my-4 ${isMobile ? '' : 'w-full'}`;
  bubble.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-md w-full">${mainHtml}</div>`;
  chatMessages.appendChild(bubble);

  const tabButtons = bubble.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const button = btn as HTMLElement;
      const targetId = button.getAttribute('data-target');
      if (!targetId) return;
      tabButtons.forEach(b => b.classList.remove('tab-active'));
      const allPages = bubble.querySelectorAll('.itinerary-page');
      allPages.forEach(page => page.classList.remove('page-active'));
      button.classList.add('tab-active');
      const page = bubble.querySelector(`#${targetId}`);
      if (page) page.classList.add('page-active');
    });
  });

  const setupSummaryToggles = () => {
    const toggles = bubble.querySelectorAll('.qs-toggle');
    toggles.forEach(btn => {
      const button = btn as HTMLElement;
      const targetId = button.getAttribute('data-target');
      if (!targetId) return;
      const panel = bubble.querySelector(`#${targetId}`) as HTMLElement | null;
      if (!panel) return;
      button.addEventListener('click', () => {
        const isHidden = panel.classList.contains('hidden');
        if (isHidden) {
          panel.classList.remove('hidden');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = '0px';
          panel.classList.add('hidden');
        }
      });
    });
  };
  setupSummaryToggles();

  // PDF generation using html2pdf (captures the itinerary content DOM)
  const downloadItineraryPdf = async () => {
    try {
      const w: any = window as any;
      if (!w.html2pdf) throw new Error('html2pdf not available');

      const container = bubble.querySelector('.itinerary-tabs-container') as HTMLElement | null;
      if (!container) return;

      // Clone printable content and reveal all pages for export
      const printable = container.cloneNode(true) as HTMLElement;
      printable.querySelectorAll('.itinerary-page').forEach(el => { (el as HTMLElement).classList.add('page-active'); (el as HTMLElement).style.display = 'block'; });
      // Remove any PDF buttons inside the clone
      printable.querySelectorAll('.pdf-download-btn').forEach(el => el.remove());

      // Prepare wrapper with a simple header
      const wrapper = document.createElement('div');
      wrapper.style.background = '#ffffff';
      wrapper.style.padding = '24pt';
      wrapper.style.maxWidth = '900px';
      wrapper.style.margin = '0 auto';
      wrapper.innerHTML = `
        <style>
          .pt-header{display:flex;align-items:center;gap:12pt;margin-bottom:12pt}
          .pt-title{font-size:16pt;font-weight:700;color:#111827;margin:0}
          .pt-meta{font-size:9pt;color:#6b7280;margin:2pt 0 0}
          .pt-logo{height:28pt;width:auto}
          .tabs-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:8pt;border-bottom:1px solid #e5e7eb;margin-bottom:10pt}
        </style>
        <div class="pt-header">
          <img class="pt-logo" src="https://cdn.builder.io/api/v1/image/assets%2F82c0001c5b3640cb80e6ddfae3607779%2Fc6120727ebef4118a2235d13cbf9dfcb?format=webp&width=400" crossorigin="anonymous" />
          <div>
            <h1 class="pt-title">Tapas – Itinerary</h1>
            <p class="pt-meta">Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      // Add dynamic trip title if present
      try {
        const tripTitle = (itineraryData?.overview?.title || itineraryData?.title || '').toString();
        if (tripTitle) {
          const h = document.createElement('h2');
          h.textContent = tripTitle;
          h.style.fontSize = '14pt'; h.style.fontWeight = '700'; h.style.color = '#111827'; h.style.margin = '6pt 0 8pt';
          wrapper.appendChild(h);
        }
      } catch {}

      // Ensure images export correctly
      printable.querySelectorAll('img').forEach(img => {
        (img as HTMLImageElement).setAttribute('crossorigin','anonymous');
        (img as HTMLImageElement).style.maxWidth = '100%';
      });

      wrapper.appendChild(printable);
      document.body.appendChild(wrapper);

      const opt = {
        margin: [20, 15, 20, 15],
        filename: 'itinerary.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      } as any;

      await w.html2pdf().from(wrapper).set(opt).save();
      document.body.removeChild(wrapper);
    } catch (e) {
      console.error('Itinerary PDF generation failed', e);
      alert('Unable to generate itinerary PDF automatically in this browser.');
    }
  };

  const pdfBtn = bubble.querySelector(`#${uid}-pdf-btn`);
  pdfBtn?.addEventListener('click', downloadItineraryPdf);

};
