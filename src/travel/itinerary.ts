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

  // PDF generation (using jsPDF via CDN)
  const loadJsPDF = (): Promise<any> => new Promise((resolve, reject) => {
    const w = window as any;
    if (w.jspdf && w.jspdf.jsPDF) return resolve(w.jspdf.jsPDF);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.async = true;
    s.onload = () => resolve((window as any).jspdf.jsPDF);
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  });

  const clean = (v: any) => String(v ?? '').replace(/[‘’‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/\u200B/g, '').trim();
  const formatINR = (v: any) => {
    const num = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
    return isNaN(num) ? clean(v) : `₹ ${num.toLocaleString('en-IN')}`;
  };

  const toDataURL = (url: string): Promise<string> => new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          const maxW = 240; const ratio = Math.min(1, maxW / img.width);
          c.width = Math.max(1, Math.floor(img.width * ratio));
          c.height = Math.max(1, Math.floor(img.height * ratio));
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        } catch { resolve(''); }
      };
      img.onerror = () => resolve('');
      img.src = url;
    } catch { resolve(''); }
  });

  const addTextBlock = (doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight = 16) => {
    const lines = doc.splitTextToSize(clean(text), maxWidth);
    lines.forEach((line: string) => { doc.text(line, x, y); y += lineHeight; });
    return y;
  };

  const addHeading = (doc: any, text: string, x: number, y: number, size = 16, color: [number,number,number] = [30,64,175]) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(size); doc.setFont(undefined, 'bold'); doc.text(clean(text), x, y);
    doc.setTextColor(33, 37, 41); doc.setFontSize(11); doc.setFont(undefined, 'normal');
    return y + 12;
  };

  const divider = (doc: any, y: number, margin: number, maxWidth: number) => {
    doc.setDrawColor(229,231,235); doc.line(margin, y, margin + maxWidth, y); return y + 12;
  };

  const ensureSpace = (doc: any, y: number, margin: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - margin) { doc.addPage(); return margin; }
    return y;
  };

  const decoratePages = (doc: any, title: string) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // Header with gradient-like effect
      doc.setFillColor(59, 130, 246); doc.rect(0, 0, w, 50, 'F');
      doc.setFillColor(99, 102, 241); doc.rect(0, 0, w, 30, 'F');

      doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text(clean(title || 'Travel Itinerary'), 40, 22);

      // Footer
      doc.setDrawColor(229,231,235); doc.line(40, h - 40, w - 40, h - 40);
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont(undefined, 'normal');
      doc.text(`Page ${i} of ${pageCount}`, w - 40, h - 25, { align: 'right' });
      doc.text('Generated by Tapas Travel AI', 40, h - 25);
    }
  };

  const genPdf = async () => {
    try {
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'normal'); doc.setTextColor(33,37,41); doc.setFontSize(11);
      const margin = 40; let y = margin + 40; const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

      // Title page design
      const w = doc.internal.pageSize.getWidth();
      const ov = itineraryData?.overview || {};
      const mainTitle = clean(ov?.title || 'Travel Itinerary');
      const destination = clean(ov?.destination || '');

      // Hero section with background
      doc.setFillColor(239, 246, 255); doc.rect(0, 60, w, 200, 'F');

      y = 120;
      doc.setTextColor(30,64,175); doc.setFontSize(28); doc.setFont(undefined, 'bold');
      const titleLines = doc.splitTextToSize(mainTitle, maxWidth - 80);
      titleLines.forEach((line: string) => { doc.text(line, margin + 40, y, { align: 'center', maxWidth: maxWidth - 80 }); y += 35; });

      if (destination) {
        doc.setTextColor(59,130,246); doc.setFontSize(18);
        y = addTextBlock(doc, destination, margin + 40, y + 10, maxWidth - 80);
      }

      const statsCover = ov.stats || {};
      const ci = statsCover.checkInDate ? formatDate(statsCover.checkInDate) : '';
      const co = statsCover.checkOutDate ? formatDate(statsCover.checkOutDate) : '';
      if (ci || co) {
        doc.setTextColor(17,24,39); doc.setFontSize(12);
        const datesLine = `${ci ? 'Check-in: ' + ci : ''}${(ci && co) ? '   ' : ''}${co ? 'Check-out: ' + co : ''}`;
        y = addTextBlock(doc, datesLine, margin + 40, y + 6, maxWidth - 80, 16);
      }
      if (ov.summary) {
        doc.setTextColor(55,65,81); doc.setFontSize(12);
        y = addTextBlock(doc, String(ov.summary), margin + 40, y + 10, maxWidth - 80, 16);
      }

      y = 300;

      // Overview section
      y = addHeading(doc, 'Overview', margin, y, 22, [17,24,39]);
      if (ov.summary) {
        doc.setFillColor(248,250,252); doc.rect(margin - 10, y - 5, maxWidth + 20, 80, 'F');
        y = addTextBlock(doc, String(ov.summary), margin + 10, y + 15, maxWidth - 20, 18); y += 20;
      }
      const stats = ov.stats || {};
      const statBoxes: Array<{label: string, value: string}> = [];
      if (stats.durationInDays) statBoxes.push({label: 'Duration', value: `${clean(stats.durationInDays)} Days`});
      if (stats.placesVisited) statBoxes.push({label: 'Places', value: `${clean(stats.placesVisited)} Locations`});
      if (stats.checkInDate) statBoxes.push({label: 'Check-in', value: formatDate(stats.checkInDate)});
      if (stats.checkOutDate) statBoxes.push({label: 'Check-out', value: formatDate(stats.checkOutDate)});

      if (statBoxes.length) {
        const boxW = (maxWidth - (statBoxes.length - 1) * 15) / statBoxes.length;
        statBoxes.forEach((box, i) => {
          const x = margin + i * (boxW + 15);
          doc.setFillColor(59,130,246); doc.rect(x, y, boxW, 60, 'F');
          doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont(undefined, 'bold');
          doc.text(box.value, x + boxW/2, y + 25, { align: 'center' });
          doc.setFontSize(10); doc.setFont(undefined, 'normal');
          doc.text(box.label, x + boxW/2, y + 45, { align: 'center' });
        });
        y += 80;
      }
      doc.setTextColor(33,37,41);
      y = divider(doc, y, margin, maxWidth);

      // Quick Daily Summary (no activities list here)
      const dp = Array.isArray(itineraryData?.dailyPlan) ? itineraryData.dailyPlan : [];
      if (dp.length) {
        y = addHeading(doc, 'Quick Daily Summary', margin, y, 16);
        for (const day of dp) {
          y = ensureSpace(doc, y, margin);
          const count = (day?.activities || []).length;
          y = addTextBlock(doc, `• Day ${clean(day?.day)}: ${clean(day?.title)} — ${count} activities`, margin, y, maxWidth);
        }
        y += 10; y = divider(doc, y, margin, maxWidth);
      }

      // Daily Plan with activities and photos
      if (dp.length) {
        y = addHeading(doc, 'Daily Plan', margin, y, 20);
        for (const day of dp) {
          y = ensureSpace(doc, y, margin);
          y = addHeading(doc, `Day ${clean(day?.day)}: ${clean(day?.title)}`, margin, y, 15, [17,24,39]);
          for (const act of (day?.activities || [])) {
            y = ensureSpace(doc, y, margin);

            // Activity card background
            doc.setFillColor(250,251,252); doc.rect(margin - 5, y - 8, maxWidth + 10, 90, 'F');
            doc.setDrawColor(229,231,235); doc.rect(margin - 5, y - 8, maxWidth + 10, 90);

            const left = margin + 5; const imgW = 96; const imgH = 72; let usedLeft = left;
            const imgUrl = (act?.imageLinks && act.imageLinks[0]) || (act?.imagelinks && act.imagelinks[0]) || '';
            if (imgUrl) {
              const dataUrl = await toDataURL(imgUrl);
              if (dataUrl) {
                doc.addImage(dataUrl, 'JPEG', left, y, imgW, imgH);
                usedLeft = left + imgW + 15;
              }
            }

            const name = clean(act?.name);
            const desc = clean(act?.description);
            const rating = clean(act?.rating);

            // Activity name with rating
            doc.setTextColor(17,24,39); doc.setFont(undefined, 'bold'); doc.setFontSize(12);
            y = addTextBlock(doc, name, usedLeft, y + 12, maxWidth - (usedLeft - margin) - 10);

            if (rating) {
              doc.setTextColor(245,158,11); doc.setFontSize(10);
              doc.text(`⭐ ${rating}`, usedLeft, y + 5);
              y += 12;
            }

            // Description
            doc.setTextColor(75,85,99); doc.setFont(undefined, 'normal'); doc.setFontSize(10);
            y = addTextBlock(doc, desc, usedLeft, y, maxWidth - (usedLeft - margin) - 10, 14);
            y += 20;
          }
          y += 4;
        }
        y = divider(doc, y, margin, maxWidth);
      }

      // Explore More
      const em = Array.isArray(itineraryData?.exploreMore) ? itineraryData.exploreMore : [];
      if (em.length) {
        y = addHeading(doc, 'Explore More', margin, y, 20);
        for (const item of em) {
          y = ensureSpace(doc, y, margin);
          const imgUrl = (item?.imageLinks && item.imageLinks[0]) || (item?.imagelinks && item.imagelinks[0]) || '';
          if (imgUrl) {
            const dataUrl = await toDataURL(imgUrl);
            if (dataUrl) { doc.addImage(dataUrl, 'JPEG', margin, y, 120, 86); }
          }
          const name = clean(item?.name); const desc = clean(item?.description || item?.overview);
          const startX = imgUrl ? margin + 130 : margin; y = addTextBlock(doc, name, startX, y + 10, maxWidth - (startX - margin));
          y = addTextBlock(doc, desc, startX, y, maxWidth - (startX - margin)); y += 12;
        }
        y = divider(doc, y, margin, maxWidth);
      }

      // Hotels
      const hotels = itineraryData?.hotelRecommendations || {};
      const cheapest = hotels?.cheapest || []; const highest = hotels?.highestRated || [];
      if (cheapest.length || highest.length) {
        y = addHeading(doc, 'Hotels', margin, y, 20);
        y = addHeading(doc, 'Hotel Recommendations', margin, y, 16);
        if (cheapest.length) {
          y = addHeading(doc, 'Cheapest Options', margin, y, 13);
          for (const h of cheapest) {
            y = ensureSpace(doc, y, margin);
            const imgUrl = (h?.imageLinks && h.imageLinks[0]) || (h?.imagelinks && h.imagelinks[0]) || '';
            if (imgUrl) { const dataUrl = await toDataURL(imgUrl); if (dataUrl) doc.addImage(dataUrl, 'JPEG', margin, y, 120, 86); }
            const name = clean(h?.name);
           const detailsLine = `${clean(h?.rating) ? 'Rating: ' + clean(h?.rating) + '   ' : ''}${h?.price != null ? 'Price: ' + formatINR(h?.price) : ''}`;
           const amenities = Array.isArray(h?.amenities) ? h.amenities.map((a: any) => clean(a)).filter(Boolean).slice(0, 6).join(', ') : '';
           const startX = imgUrl ? margin + 130 : margin; y = addTextBlock(doc, name, startX, y + 12, maxWidth - (startX - margin));
           y = addTextBlock(doc, detailsLine, startX, y, maxWidth - (startX - margin));
           if (amenities) { y = addTextBlock(doc, `Amenities: ${amenities}`, startX, y, maxWidth - (startX - margin)); }
           y += 12;
          }
          y += 6;
        }
        if (highest.length) {
          y = addHeading(doc, 'Highest Rated', margin, y, 13);
          for (const h of highest) {
            y = ensureSpace(doc, y, margin);
            const imgUrl = (h?.imageLinks && h.imageLinks[0]) || (h?.imagelinks && h.imagelinks[0]) || '';
            if (imgUrl) { const dataUrl = await toDataURL(imgUrl); if (dataUrl) doc.addImage(dataUrl, 'JPEG', margin, y, 120, 86); }
            const name = clean(h?.name);
           const detailsLine = `${clean(h?.rating) ? 'Rating: ' + clean(h?.rating) + '   ' : ''}${h?.price != null ? 'Price: ' + formatINR(h?.price) : ''}`;
           const amenities = Array.isArray(h?.amenities) ? h.amenities.map((a: any) => clean(a)).filter(Boolean).slice(0, 6).join(', ') : '';
           const startX = imgUrl ? margin + 130 : margin; y = addTextBlock(doc, name, startX, y + 12, maxWidth - (startX - margin));
           y = addTextBlock(doc, detailsLine, startX, y, maxWidth - (startX - margin));
           if (amenities) { y = addTextBlock(doc, `Amenities: ${amenities}`, startX, y, maxWidth - (startX - margin)); }
           y += 12;
          }
        }
        y = divider(doc, y, margin, maxWidth);
      }

      // Flights
      const flights = itineraryData?.flightSuggestions || {};
      const cheapestF = flights?.cheapest || []; const shortest = flights?.shortestDuration || [];
      if ((cheapestF && cheapestF.length) || (shortest && shortest.length)) {
        y = addHeading(doc, 'Flights', margin, y, 20);
        y = addHeading(doc, 'Flight Suggestions', margin, y, 16);
        const flightLine = (f: any) => {
          const airline = clean(f?.airline || f?.carrier_name || f?.carrier || '');
          const from = clean(f?.from || f?.departureairportcode || '');
          const to = clean(f?.to || f?.arrivalairportcode || '');
          const price = f?.price != null ? formatINR(f?.price) : clean(f?.amount || '');
          const dep = new Date(f?.departuredatetime || f?.departureDateTime || f?.departure_time || f?.departure);
          const arr = new Date(f?.arrivaldatetime || f?.arrivalDateTime || f?.arrival_time || f?.arrival);
          const t = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const depT = t(dep); const arrT = t(arr);
          let dur = '';
          const minutes = parseFloat(String(f?.totalduration || f?.totalDuration || f?.duration || ''));
          if (!isNaN(minutes)) { const h = Math.floor(minutes/60); const m = Math.round(minutes%60); dur = `${h}h ${m}m`; }
          const timeSeg = depT && arrT ? `${depT}–${arrT}${dur?`  (${dur})`:''}` : (dur || '');
          return `${airline}   ${from} → ${to}   ${timeSeg}   ${price}`;
        };
        if (cheapestF.length) {
          y = addHeading(doc, 'Cheapest', margin, y, 13);
          for (const f of cheapestF) {
            y = ensureSpace(doc, y, margin);
            const logo = f?.airline_logo || f?.carrier_logo || '';
            if (logo) { const dataUrl = await toDataURL(logo); if (dataUrl) doc.addImage(dataUrl, 'JPEG', margin, y, 42, 42); }
            const startX = logo ? margin + 52 : margin;
            y = addTextBlock(doc, flightLine(f), startX, y + 16, maxWidth - (startX - margin)); y += 8;
          }
          y += 4;
        }
        if (shortest.length) {
          y = addHeading(doc, 'Shortest Duration', margin, y, 13);
          for (const f of shortest) {
            y = ensureSpace(doc, y, margin);
            const logo = f?.airline_logo || f?.carrier_logo || '';
            if (logo) { const dataUrl = await toDataURL(logo); if (dataUrl) doc.addImage(dataUrl, 'JPEG', margin, y, 42, 42); }
            const startX = logo ? margin + 52 : margin;
            y = addTextBlock(doc, flightLine(f), startX, y + 16, maxWidth - (startX - margin)); y += 8;
          }
        }
      }

      decoratePages(doc, clean(ov?.title || ''));
      doc.save('itinerary.pdf');
    } catch (e) {
      console.error('PDF generation failed', e);
    }
  };

  const pdfBtn = bubble.querySelector(`#${uid}-pdf-btn`);
  pdfBtn?.addEventListener('click', genPdf);

};
