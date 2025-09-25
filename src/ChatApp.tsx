import React, { useEffect, useState, useRef } from 'react';
import './index.css';
import { renderFlights } from './travel/flights';
import { renderHotels } from './travel/hotels';
import { renderAttractions } from './travel/attractions';
import { renderItinerary } from './travel/itinerary';

// OverflowMenu component implemented with React state and accessibility
type OverflowMenuProps = {
  restartConversation: () => void;
};

const OverflowMenu: React.FC<OverflowMenuProps> = ({ restartConversation }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Keep aria-expanded attribute in sync on the button
  useEffect(() => {
    if (buttonRef.current) buttonRef.current.setAttribute('aria-expanded', String(open));
  }, [open]);

  return (
    <>
      <button
        id="overflow-button"
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="chat-header-button p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="overflow-menu"
        title="More options"
      >
        <i className="fas fa-ellipsis-v text-sm" />
      </button>

      <div
        id="overflow-menu"
        ref={menuRef}
        role="menu"
        aria-label="Chat options"
        className={`${open ? 'block' : 'hidden'} absolute right-0 top-11 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-30`}
      >
        <button onClick={() => { setOpen(false); restartConversation(); }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Restart conversation</button>
      </div>
    </>
  );
};

const ChatApp: React.FC = () => {

  useEffect(() => {
    const wAny = window as any;
    if (wAny.__tapasInitDone) { return; }
    wAny.__tapasInitDone = true;
    const chatContainer = document.getElementById('chat-container') as HTMLElement | null;
    const introSection = document.getElementById('intro-section') as HTMLElement | null;
    const toggleButton = document.getElementById('toggle-view') as HTMLElement | null;
    const chatMessages = document.getElementById('chat-messages') as HTMLElement | null;
    const chatForm = document.getElementById('chat-form') as HTMLFormElement | null;
    const userPromptInput = document.getElementById('user-prompt') as HTMLInputElement | null;

    // snapshot the initial chat HTML so restart can restore welcome + quick actions
    const initialChatHtml = chatMessages ? chatMessages.innerHTML : '';

    let isDesktopView = false;
    let sessionId = localStorage.getItem('tapasSessionId');
    if (!sessionId) {
      sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tapasSessionId', sessionId);
    }

    const showModal = (text: string) => {
      const mt = document.getElementById('modal-text');
      const modal = document.getElementById('modal');
      if (mt && modal) {
        mt.innerText = text;
        modal.classList.remove('hidden');
      }
    };

    const addWelcomeMessage = () => {
      if (!chatMessages) return;
      // Avoid adding duplicate welcome message if static or previously added
      const existing = chatMessages.querySelector('.welcome-message') || Array.from(chatMessages.querySelectorAll('div')).find(d => d.textContent && d.textContent.trim().includes('Hello! How can I help you plan your next trip'));
      if (existing) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-start welcome-message';
      wrapper.innerHTML = `
        <div class="bg-white p-3 rounded-2xl shadow-sm max-w-[80%]">
          <p class="text-gray-800 text-sm">Hello! How can I help you plan your next trip today?</p>
        </div>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const restartConversation = () => {
      if (!chatMessages) return;
      // Restore initial chat HTML (welcome message + quick actions) and clear any dynamic messages
      chatMessages.innerHTML = initialChatHtml || '';
      sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tapasSessionId', sessionId);
      // Ensure welcome message exists
      addWelcomeMessage();
      try { const fn = (window as any).__attachQuickReplies; if (typeof fn === 'function') fn(); } catch { }
      if (userPromptInput) userPromptInput.value = '';
    };
    try { (window as any).restartConversation = restartConversation; } catch (e) { /* ignore */ }

    const clearChat = () => {
      if (!chatMessages) return;
      chatMessages.innerHTML = '';
      addWelcomeMessage();
      if (userPromptInput) userPromptInput.value = '';
    };

    try { (window as any).clearChat = clearChat; } catch (e) { /* ignore */ }




    const markdownToHtml = (markdown: string) => {
      const w: any = window as any;

      const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const renderNonTable = (text: string) => {
        if (w.marked && typeof w.marked.parse === 'function') {
          try { return w.marked.parse(text); } catch { }
        }
        return escapeHtml(text).replace(/\n/g, '<br/>');
      };

      const isAlignLine = (line: string) => {
        const t = line.trim();
        if (!t.includes('-')) return false;
        const re = /^(\|\s*)?:?-{3,}:?(\s*\|\s*:?-{3,}:?)+(\s*\|)?$/;
        return re.test(t);
      };

      const splitRow = (row: string) => {
        let r = row.trim();
        if (r.startsWith('|')) r = r.slice(1);
        if (r.endsWith('|')) r = r.slice(0, -1);
        return r.split('|').map((c) => c.trim());
      };

      const parseAlignment = (line: string) => {
        const raw = splitRow(line);
        return raw.map((seg) => {
          const s = seg.trim();
          const left = /^:?-{3,}:?$/.test(s) && s.startsWith(':');
          const right = /^:?-{3,}:?$/.test(s) && s.endsWith(':');
          if (left && right) return 'align-center';
          if (right) return 'align-right';
          return 'align-left';
        });
      };

      const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
      const htmlParts: string[] = [];
      let i = 0;
      let paraBuffer: string[] = [];

      const flushPara = () => {
        if (paraBuffer.length) {
          const content = renderNonTable(paraBuffer.join('\n'));
          htmlParts.push(`<div>${content}</div>`);
          paraBuffer = [];
        }
      };

      let sawTable = false;
      while (i < lines.length) {
        const headerLine = lines[i];
        const nextLine = lines[i + 1] ?? '';
        const looksLikeRow = /\|/.test(headerLine);
        if (looksLikeRow && isAlignLine(nextLine)) {
          sawTable = true;
          flushPara();
          const headers = splitRow(headerLine).map(escapeHtml);
          const aligns = parseAlignment(nextLine);
          const colCount = Math.max(headers.length, aligns.length);

          let j = i + 2;
          const bodyRows: string[][] = [];
          while (j < lines.length) {
            const row = lines[j];
            if (!/\|/.test(row)) break;
            bodyRows.push(splitRow(row).map(escapeHtml));
            j++;
          }

          const ths = headers.map((h, idx) => `<th class="${aligns[idx] || 'align-left'}">${h}</th>`).join('');
          const rowsHtml = bodyRows
            .map((cells) => {
              const tds = new Array(colCount).fill('').map((_, idx) => {
                const v = (cells[idx] ?? '').trim();
                return `<td class="${aligns[idx] || 'align-left'}">${v}</td>`;
              }).join('');
              return `<tr>${tds}</tr>`;
            })
            .join('');

          htmlParts.push(
            `<div class="md-table-wrapper"><table class="md-table"><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`
          );

          i = j;
          continue;
        }
        paraBuffer.push(headerLine);
        i++;
      }
      flushPara();

      if (!sawTable && w.marked && typeof w.marked.parse === 'function') {
        try { return w.marked.parse(markdown); } catch { }
      }
      return htmlParts.join('\n');
    };

    const htmlEscape = (val: any) => String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const renderGenericTable = (headers: any[], rows: any[][]) => {
      if (!chatMessages) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'flex justify-start';
      const card = document.createElement('div');
      card.className = 'bg-white text-gray-800 p-3 rounded-2xl shadow-md max-w-[80%] markdown-body';
      const ths = headers.map((h) => `<th class=\"align-left\">${htmlEscape(h)}</th>`).join('');
      const body = rows.map((r) => {
        const cells = headers.map((_, idx) => `<td class=\"align-left\">${htmlEscape(r[idx] ?? '')}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      card.innerHTML = `<div class=\"md-table-wrapper\"><table class=\"md-table\"><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table></div>`;
      wrapper.appendChild(card);
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const createMessageBubble = (text: string, isUser: boolean) => {
      if (!chatMessages) return;
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
      const messageDiv = document.createElement('div');
      if (isUser) {
        messageDiv.className = 'bg-blue-500 text-white p-3 rounded-2xl shadow-md max-w-[80%]';
        messageDiv.textContent = text;
      } else {
        messageDiv.className = 'bg-white text-gray-800 p-3 rounded-2xl shadow-md max-w-[80%] markdown-body';
        messageDiv.innerHTML = markdownToHtml(text);
      }
      bubbleDiv.appendChild(messageDiv);
      chatMessages.appendChild(bubbleDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const createLoadingIndicator = () => {
      if (!chatMessages) return null as unknown as HTMLElement;
      const loaderDiv = document.createElement('div');
      loaderDiv.className = 'chat-loader-row flex items-start';
      // reserve space for the gif animation so layout doesn't jump
      loaderDiv.innerHTML = `
        <div class="chat-loader-wrapper">
          <img class="chat-loader-image" src="https://cdn.builder.io/o/assets%2F6f93519000c74ba084c4626024227ad2%2Ff83c3507982c402ca39ea41163f1b897?alt=media&token=5afa3666-cc67-4932-aebc-b625d1beb44b&apiKey=6f93519000c74ba084c4626024227ad2" alt="loading" />
        </div>
      `;
      chatMessages.appendChild(loaderDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      return loaderDiv;
    };

    const processMessage = (jsonResponse: string) => {
      const data = JSON.parse(jsonResponse);
      const placeholderRegex = /\[(flightData|hotelData|attractionsData|itineraryData)\]/g;
      const text = typeof data.text === 'string' ? data.text : '';
      const cleanedText = text ? text.replace(placeholderRegex, '').trim() : '';
      if (cleanedText) createMessageBubble(cleanedText, false);

      // Render table if backend provided structured tabular data
      try {
        const pickTable = (d: any) => {
          const pick = (o: any) => {
            if (!o || typeof o !== 'object') return null;
            const headers = o.headers || o.columns || o.cols;
            const rows = o.rows || o.data || o.values;
            if (Array.isArray(headers) && Array.isArray(rows)) return { headers, rows };
            return null;
          };
          return pick(d?.table) || pick(d?.tabular) || pick(d?.tableData) || pick(d?.grid) ||
            (Array.isArray(d?.rows) && (Array.isArray(d?.headers) || Array.isArray(d?.columns)) ? { headers: d.headers || d.columns, rows: d.rows } : null) ||
            (Array.isArray(d?.data) && Array.isArray(d?.columns) ? { headers: d.columns, rows: d.data } : null);
        };
        const tbl = pickTable(data);
        if (tbl) { renderGenericTable(tbl.headers, tbl.rows); }
      } catch { }


      if ((data.dbData || data.itineraryData) && chatMessages) {
        if (text.includes('[flightData]') && data.dbData) {
          renderFlights(data.dbData, !isDesktopView, chatMessages);
        } else if (text.includes('[hotelData]') && data.dbData) {
          renderHotels(data.dbData, !isDesktopView, chatMessages);
        } else if (text.includes('[attractionsData]') && data.dbData) {
          renderAttractions(data.dbData, !isDesktopView, chatMessages);
        } else if (data.itineraryData) {
          renderItinerary(data.itineraryData, !isDesktopView, chatMessages);
        } else if ((data as any).itenaryData) {
          renderItinerary((data as any).itenaryData, !isDesktopView, chatMessages);
        }
      }
    };


    if (chatForm && userPromptInput && chatMessages) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userPrompt = userPromptInput.value.trim();
        if (userPrompt === '') return;
        createMessageBubble(userPrompt, true);
        userPromptInput.value = '';
        const loader = createLoadingIndicator();
        const sendBtn = document.querySelector('.send-button') as HTMLButtonElement | null;
        if (sendBtn) { sendBtn.classList.add('loading'); sendBtn.setAttribute('aria-busy', 'true'); sendBtn.disabled = true; }
        try {
          const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userPrompt })
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const responseData = await response.json();
          loader.remove();
          setBackendOnline(true);
          processMessage(JSON.stringify(responseData));
        } catch (error) {
          console.error('API call failed:', error);
          loader.remove();
          setBackendOnline(false);
          createMessageBubble('Oops! Something went wrong. Please try again later.', false);
        } finally {
          if (sendBtn) { sendBtn.classList.remove('loading'); sendBtn.removeAttribute('aria-busy'); sendBtn.disabled = false; }
        }
      });

      // Ensure one-time global lightbox overlay exists
      const ensureLightbox = () => {
        if (document.getElementById('tapas-lightbox')) return;
        const overlay = document.createElement('section');
        overlay.id = 'tapas-lightbox';
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
          <div class="lightbox-backdrop"></div>
          <div class="lightbox-content relative">
            <img id="tapas-lightbox-img" class="lightbox-img" alt="Preview" />
            <button id="tapas-lightbox-close" class="lightbox-close-btn" aria-label="Close preview"><span class="text-xl leading-none">×</span></button>
          </div>`;
        document.body.appendChild(overlay);

        const close = () => {
          overlay.classList.remove('open');
          setTimeout(() => { const img = document.getElementById('tapas-lightbox-img') as HTMLImageElement | null; if (img) img.src = ''; }, 200);
        };
        const closeBtn = overlay.querySelector('#tapas-lightbox-close') as HTMLElement | null;
        if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); close(); });
        overlay.addEventListener('click', (e) => {
          const content = overlay.querySelector('.lightbox-content') as HTMLElement | null;
          if (content && !content.contains(e.target as Node)) close();
        });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) { e.preventDefault(); close(); } });
        (window as any).__tapasOpenLightbox = (url: string, alt: string) => {
          const img = document.getElementById('tapas-lightbox-img') as HTMLImageElement | null;
          if (img) { img.src = url || ''; img.alt = alt || 'Preview'; }
          overlay.classList.add('open');
        };
      };
      ensureLightbox();

      // Delegate clicks inside chat messages to handle external links reliably and card previews
      const delegatedClickHandler = (evt: MouseEvent) => {
        try {
          const target = evt.target as HTMLElement | null;
          if (!target) return;
          // Find nearest anchor element from the click target
          const anchor = (target.closest && (target.closest('a') as HTMLAnchorElement | null)) || null;
          if (anchor && anchor.href) {
            const href = anchor.getAttribute('href') || '';
            const isExternal = /^https?:\/\//i.test(href);
            const inAttractions = !!anchor.closest('#attractions-container');
            const inHotels = !!anchor.closest('#hotels-container');
            if (isExternal || inAttractions || inHotels) {
              evt.preventDefault();
              window.open(href, '_blank', 'noopener,noreferrer');
              return;
            }
          }

          // Lightbox: click on hotel/attraction card (not on links) opens image
          const card = target.closest && (target.closest('.travel-card.card-hover-grow') as HTMLElement | null);
          if (card) {
            const img = card.querySelector('.travel-card-image') as HTMLImageElement | null;
            if (img && (window as any).__tapasOpenLightbox) {
              evt.preventDefault();
              (window as any).__tapasOpenLightbox(img.src, img.alt || 'Preview');
              return;
            }
          }
        } catch (err) {
          // ignore
        }
      };
      chatMessages.addEventListener('click', delegatedClickHandler);
    }

    if (toggleButton && chatContainer && introSection && chatMessages) {
      toggleButton.addEventListener('click', () => {
        if (window.innerWidth < 768 && !isDesktopView) {
          showModal('The desktop view is available on larger screens.');
          return;
        }
        isDesktopView = !isDesktopView;
        if (isDesktopView) {
          chatContainer.classList.add('desktop-view', 'chat-centered');
          chatContainer.classList.remove('phone-view', 'chat-right-align');
          introSection.classList.add('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-mobile-alt text-sm"></i>';
        } else {
          chatContainer.classList.remove('desktop-view', 'chat-centered');
          chatContainer.classList.add('phone-view', 'chat-right-align');
          introSection.classList.remove('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
        }
        const messages = Array.from(chatMessages.children);
        chatMessages.innerHTML = '';
        messages.forEach(msg => chatMessages.appendChild(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }

    const onLoad = () => {
      const canInitView = !!(chatContainer && introSection && toggleButton);
      if (canInitView) {
        if (window.innerWidth >= 768) {
          chatContainer.classList.add('transition-width');
          introSection.classList.add('transition-all');
          isDesktopView = false;
          chatContainer.classList.add('phone-view', 'chat-right-align');
          chatContainer.classList.remove('desktop-view', 'chat-centered');
          introSection.classList.remove('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
        } else {
          isDesktopView = false;
          chatContainer.classList.add('phone-view');
          introSection.classList.add('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
        }
      }

      const createInlineFlightForm = () => {
        if (!chatMessages) return;
        chatMessages.querySelectorAll('.inline-flight-form-row, .inline-hotel-form-row, .inline-attraction-form-row').forEach(n => (n as HTMLElement).remove());
        const uid = String(Date.now());
        const row = document.createElement('div');
        row.className = 'inline-flight-form-row flex items-start w-full';
        row.innerHTML = `
          <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-[90%] w-full border border-gray-200">
            <h3 class="text-2xl font-bold mb-4 text-center text-gray-800">Find Your Flight</h3>
            <form class="flight-form space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input type="text" id="source-${uid}" name="source" value="JFK" placeholder="Source" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                  <div id="source-suggestions-${uid}" class="autocomplete-list hidden"></div>
                  <div id="source-popular-${uid}" class="popular-cities-list hidden"></div>
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input type="text" id="destination-${uid}" name="destination" value="LAX" placeholder="Destination" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                  <div id="destination-suggestions-${uid}" class="autocomplete-list hidden"></div>
                  <div id="destination-popular-${uid}" class="popular-cities-list hidden"></div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                  <div id="date-picker-input-${uid}" class="mt-1 flex items-center justify-between cursor-pointer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    <span id="display-date-${uid}" class="text-gray-700"></span>
                    <i class="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input type="hidden" id="departureDate-${uid}" name="departureDate" />

                  <div id="date-picker-modal-${uid}" class="absolute z-10 mt-2 left-0 right-0 p-4 bg-yellow-400 rounded-2xl shadow-lg transition-all duration-300 scale-95 opacity-0 pointer-events-none origin-top">
                    <div class="flex justify-center mb-2"><div class="h-1 w-10 bg-yellow-600 rounded-full"></div></div>
                    <div id="calendar-view-${uid}" class="transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto">
                      <div class="flex justify-between items-center text-sm font-medium text-yellow-800 mb-2">
                        <span class="w-1/3 text-center">Day</span>
                        <span class="w-1/3 text-center">Month</span>
                        <span class="w-1/3 text-center">Year</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 h-48 overflow-hidden relative">
                        <div id="selection-highlight-${uid}" class="absolute h-10 w-full bg-yellow-600 rounded-full transition-transform duration-200 ease-in-out pointer-events-none z-0"></div>
                        <ul id="day-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="month-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="year-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                      </div>
                    </div>
                    <div id="final-date-view-${uid}" class="absolute inset-0 flex flex-col justify-center items-center text-center opacity-0 pointer-events-none transition-opacity duration-300">
                      <p class="text-4xl font-bold text-yellow-800" id="final-date-display-${uid}"></p>
                      <button type="button" id="change-date-button-${uid}" class="mt-4 px-6 py-2 bg-yellow-600 text-yellow-900 font-semibold rounded-full text-sm">Change Date</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                  <input type="number" id="adults-${uid}" name="adults" value="1" min="1" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                </div>
              </div>

              <div class="pt-2 flex flex-col sm:flex-row-reverse justify-end items-center gap-4 relative z-20">
                <button type="submit" id="search-button-${uid}" class="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">Search Flights</button>
                <button type="button" id="cancel-button-${uid}" class="w-full sm:w-auto px-8 py-3 text-gray-700 bg-gray-200 font-semibold rounded-xl shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition">Cancel</button>
              </div>
              <div id="message-box-${uid}" class="mt-2 p-3 text-center rounded-xl transition-opacity duration-300 opacity-0 hidden"></div>
            </form>
          </div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Helpers and constants
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const getAirportApiUrl = () => {
          const winBase = (window as any).__API_BASE__;
          const base = (winBase || '').toString().trim();
          if (base) return `${base.replace(/\/$/, '')}/tools/searchAirport`;
          return 'http://localhost:8000/tools/searchAirport';
        };
        const AIRPORT_API_URL = getAirportApiUrl();
        const FLIGHTS_API_URL = 'http://localhost:8000/tools/fetchFlights';

        const qs = (sel: string) => row.querySelector(sel) as HTMLElement | null;
        const qsi = (sel: string) => row.querySelector(sel) as HTMLInputElement | null;

        const dateInput = qs(`#date-picker-input-${uid}`);
        const dateModal = qs(`#date-picker-modal-${uid}`) as HTMLElement | null;
        const hiddenDateInput = qsi(`#departureDate-${uid}`);
        const displayDateSpan = qs(`#display-date-${uid}`) as HTMLElement | null;
        const dayList = qs(`#day-list-${uid}`) as HTMLElement | null;
        const monthList = qs(`#month-list-${uid}`) as HTMLElement | null;
        const yearList = qs(`#year-list-${uid}`) as HTMLElement | null;
        const calendarView = qs(`#calendar-view-${uid}`);
        const finalDateView = qs(`#final-date-view-${uid}`);
        const finalDateDisplay = qs(`#final-date-display-${uid}`) as HTMLElement | null;
        const changeDateButton = qs(`#change-date-button-${uid}`);
        const sourceInput = qsi(`#source-${uid}`)!;
        const sourceSuggestions = qs(`#source-suggestions-${uid}`)!;
        const sourcePopular = qs(`#source-popular-${uid}`)!;
        const destinationInput = qsi(`#destination-${uid}`)!;
        const destinationSuggestions = qs(`#destination-suggestions-${uid}`)!;
        const destinationPopular = qs(`#destination-popular-${uid}`)!;
        const buttonRow = row.querySelector('.pt-2.flex.flex-col.sm\\:flex-row-reverse.justify-end.items-center.gap-4') as HTMLElement | null;

        let selectedDay: number, selectedMonth: number, selectedYear: number;
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        selectedDay = currentDay; selectedMonth = currentMonth; selectedYear = currentYear;

        const selectionHighlight = qs(`#selection-highlight-${uid}`) as HTMLElement | null;
        const calendarGrid = dateModal ? (dateModal.querySelector('.grid') as HTMLElement | null) : null;

        const updateDateFields = () => {
          if (!hiddenDateInput || !displayDateSpan) return;
          const monthFormatted = String(selectedMonth + 1).padStart(2, '0');
          const dayFormatted = String(selectedDay).padStart(2, '0');
          const dateString = `${selectedYear}-${monthFormatted}-${dayFormatted}`;
          hiddenDateInput.value = dateString;
          displayDateSpan.textContent = dateString;
        };

        const populateDayList = (year: number, month: number) => {
          if (!dayList) return;
          dayList.innerHTML = '';
          const numDays = new Date(year, month + 1, 0).getDate();
          const startDay = (year === currentYear && month === currentMonth) ? currentDay : 1;
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; dayList.appendChild(e); }
          for (let i = startDay; i <= numDays; i++) { const li = document.createElement('li'); li.textContent = String(i); li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); dayList.appendChild(li); }
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; dayList.appendChild(e); }
        };
        const populateMonthList = (year: number) => {
          if (!monthList) return;
          monthList.innerHTML = '';
          const startMonth = (year === currentYear) ? currentMonth : 0;
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; monthList.appendChild(e); }
          for (let i = startMonth; i < monthNames.length; i++) { const li = document.createElement('li'); li.textContent = monthNames[i]; li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); monthList.appendChild(li); }
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; monthList.appendChild(e); }
        };
        const populateYearList = () => {
          if (!yearList) return;
          yearList.innerHTML = '';
          const endYear = currentYear + 10;
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; yearList.appendChild(e); }
          for (let i = currentYear; i <= endYear; i++) { const li = document.createElement('li'); li.textContent = String(i); li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); yearList.appendChild(li); }
          for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; yearList.appendChild(e); }
        };

        const updateHighlightPosition = () => {
          if (!selectionHighlight || !calendarGrid || !dayList) return;
          const selectedDayEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null;
          if (selectedDayEl) {
            const gridRect = calendarGrid.getBoundingClientRect();
            const dayRect = selectedDayEl.getBoundingClientRect();
            const topPosition = dayRect.top - gridRect.top;
            selectionHighlight.style.transform = `translateY(${topPosition}px)`;
          }
        };

        const updateSelectedClasses = () => {
          if (!dayList || !monthList || !yearList) return;
          dayList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
          monthList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
          yearList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
          const dEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; if (dEl) dEl.classList.add('selected-text');
          const mEl = monthList.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; if (mEl) mEl.classList.add('selected-text');
          const yEl = yearList.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; if (yEl) yEl.classList.add('selected-text');
        };

        const scrollToSelected = () => {
          const dEl = dayList?.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; dEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const mEl = monthList?.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; mEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const yEl = yearList?.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; yEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        const handleScroll = (list: HTMLElement & { scrollTimeout?: any }, setter: (v: number) => void) => {
          clearTimeout(list.scrollTimeout);
          list.scrollTimeout = setTimeout(() => {
            const listItems = Array.from(list.children) as HTMLElement[];
            const validItems = listItems.filter((li) => (li as HTMLElement).dataset && (li as HTMLElement).dataset.value);
            if (!validItems.length) return;
            let closestItem: HTMLElement = validItems[0];
            let minDistance = Infinity;
            const listRect = list.getBoundingClientRect();
            validItems.forEach((item: HTMLElement) => {
              const rect = item.getBoundingClientRect();
              const distance = Math.abs((rect.top + rect.bottom) / 2 - (listRect.top + listRect.bottom) / 2);
              if (distance < minDistance) { minDistance = distance; closestItem = item; }
            });
            const dataVal = (closestItem.dataset || ({} as any)).value;
            if (closestItem && dataVal) {
              const value = parseInt(dataVal, 10);
              setter(value);
              updateDateFields(); updateHighlightPosition(); updateSelectedClasses();
            }
          }, 50);
        };

        const handleClick = (event: any, setter: (v: number) => void, updateCallback: () => void) => {
          const li = event.target.closest('li');
          if (li && li.dataset.value) {
            const value = parseInt(li.dataset.value, 10);
            setter(value);
            updateCallback();
            updateDateFields(); updateHighlightPosition(); updateSelectedClasses(); scrollToSelected(); animateToFinalView();
          }
        };

        const openModal = () => {
          if (!dateModal) return;
          dateModal.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
          dateModal.classList.add('scale-100', 'opacity-100', 'pointer-events-auto');
          updateHighlightPosition(); updateSelectedClasses(); scrollToSelected();
          // Hide buttons when calendar opens
          if (buttonRow) buttonRow.style.display = 'none';
        };
        const closeModal = () => {
          if (!dateModal) return;
          dateModal.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');
          dateModal.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
          // Show buttons when calendar closes
          if (buttonRow) buttonRow.style.display = 'flex';
        };
        const animateToFinalView = () => {
          if (!calendarView || !finalDateView || !finalDateDisplay) return;
          calendarView.classList.remove('opacity-100', 'pointer-events-auto');
          calendarView.classList.add('opacity-0', 'pointer-events-none');
          finalDateDisplay.textContent = `${selectedDay} ${monthNames[selectedMonth]} ${selectedYear}`;
          finalDateView.classList.remove('opacity-0', 'pointer-events-none');
          finalDateView.classList.add('opacity-100', 'pointer-events-auto');
        };
        const resetCalendarView = () => {
          if (!calendarView || !finalDateView) return;
          finalDateView.classList.remove('opacity-100', 'pointer-events-auto');
          finalDateView.classList.add('opacity-0', 'pointer-events-none');
          calendarView.classList.remove('opacity-0', 'pointer-events-none');
          calendarView.classList.add('opacity-100', 'pointer-events-auto');
          scrollToSelected();
        };

        // initialize lists and defaults
        populateYearList(); populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); updateDateFields();

        // listeners
        dateInput?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
        changeDateButton?.addEventListener('click', resetCalendarView);
        dayList?.addEventListener('scroll', () => handleScroll(dayList, (val) => { selectedDay = val; if (selectedYear === currentYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }));
        dayList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedDay = val; if (selectedYear === currentYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }, () => { }));
        monthList?.addEventListener('scroll', () => handleScroll(monthList, (val) => { selectedMonth = val; if (selectedYear === currentYear && selectedMonth < currentMonth) selectedMonth = currentMonth; if (selectedYear === currentYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; populateDayList(selectedYear, selectedMonth); }));
        monthList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedMonth = val; if (selectedYear === currentYear && selectedMonth < currentMonth) selectedMonth = currentMonth; if (selectedYear === currentYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }, () => { populateDayList(selectedYear, selectedMonth); }));
        yearList?.addEventListener('scroll', () => handleScroll(yearList, (val) => { selectedYear = val; populateMonthList(selectedYear); if (selectedYear === currentYear && selectedMonth < currentMonth) { selectedMonth = currentMonth; selectedDay = currentDay; } populateDayList(selectedYear, selectedMonth); }));
        yearList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedYear = val; if (selectedYear === currentYear && selectedMonth < currentMonth) { selectedMonth = currentMonth; selectedDay = currentDay; } }, () => { populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); }));

        // popular cities & autocomplete
        const popularCities = [
          { name: 'New Delhi', city: 'New Delhi, Delhi', iata: 'DEL' },
          { name: 'Mumbai', city: 'Mumbai, Maharashtra', iata: 'BOM' },
          { name: 'Bengaluru', city: 'Bengaluru, Karnataka', iata: 'BLR' },
          { name: 'Chennai', city: 'Chennai, Tamil Nadu', iata: 'MAA' },
          { name: 'Kolkata', city: 'Kolkata, West Bengal', iata: 'CCU' },
          { name: 'Hyderabad', city: 'Hyderabad, Telangana', iata: 'HYD' }
        ];
        let autocompleteTimeout: any;
        const toggleSuggestions = (inputName: 'source' | 'destination', showPopular: boolean) => {
          const popularEl = (inputName === 'source') ? sourcePopular : destinationPopular;
          const suggestionsEl = (inputName === 'source') ? sourceSuggestions : destinationSuggestions;
          sourcePopular.classList.add('hidden'); destinationPopular.classList.add('hidden'); sourceSuggestions.classList.add('hidden'); destinationSuggestions.classList.add('hidden');
          if (showPopular) { populatePopularCities(inputName); popularEl.classList.remove('hidden'); } else { suggestionsEl.classList.remove('hidden'); }
        };
        const populatePopularCities = (inputName: 'source' | 'destination') => {
          const listEl = (inputName === 'source') ? sourcePopular : destinationPopular;
          listEl.innerHTML = '';
          const title = document.createElement('div'); title.textContent = 'Popular Cities'; title.className = 'py-2 px-4 text-gray-400 text-sm font-semibold border-b border-gray-200'; listEl.appendChild(title);
          popularCities.forEach(city => {
            const item = document.createElement('div'); item.className = 'popular-city-item'; item.innerHTML = `<div>${city.name}, <span class="font-medium">${city.city}</span></div><div class="text-sm text-gray-500">${city.iata}</div>`;
            item.addEventListener('click', () => { const input = (inputName === 'source' ? sourceInput : destinationInput); if (input) input.value = `${city.name} (${city.iata})`; listEl.classList.add('hidden'); });
            listEl.appendChild(item);
          });
        };
        const fetchAndDisplayAirports = async (inputEl: HTMLInputElement, suggestionsEl: HTMLElement, searchString: string) => {
          if (searchString.length < 2) { suggestionsEl.innerHTML = ''; suggestionsEl.classList.add('hidden'); return; }
          if (inputEl === sourceInput) { sourcePopular.classList.add('hidden'); } else { destinationPopular.classList.add('hidden'); }
          try {
            const response = await fetch(AIRPORT_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ searchString }) });
            if (response.status === 204) { suggestionsEl.classList.add('hidden'); return; }
            if (!response.ok) throw new Error(`API error ${response.status}`);
            const text = await response.text();
            const data = text ? JSON.parse(text) : null as any;
            const airports = (data && Array.isArray(data.results)) ? data.results : (Array.isArray(data) ? data : []);
            suggestionsEl.innerHTML = '';
            if (airports && airports.length > 0) {
              airports.forEach((ap: any) => {
                const label = `${ap.airport_name || ap.name || ''} (${ap.iata || ''})`;
                const sub = [ap.city, ap.country].filter(Boolean).join(', ');
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `<div>${label}</div><div class="text-sm text-gray-500">${sub}</div>`;
                item.addEventListener('click', () => { inputEl.value = label; suggestionsEl.classList.add('hidden'); });
                suggestionsEl.appendChild(item);
              });
              suggestionsEl.classList.remove('hidden');
            } else { suggestionsEl.classList.add('hidden'); }
          } catch (e) { console.error('Failed to fetch airport suggestions', e); suggestionsEl.classList.add('hidden'); }
        };
        sourceInput.addEventListener('input', (e: any) => { clearTimeout(autocompleteTimeout); autocompleteTimeout = setTimeout(() => { fetchAndDisplayAirports(sourceInput, sourceSuggestions, e.target.value); }, 300); });
        sourceInput.addEventListener('focus', () => toggleSuggestions('source', true));
        destinationInput.addEventListener('input', (e: any) => { clearTimeout(autocompleteTimeout); autocompleteTimeout = setTimeout(() => { fetchAndDisplayAirports(destinationInput, destinationSuggestions, e.target.value); }, 300); });
        destinationInput.addEventListener('focus', () => toggleSuggestions('destination', true));
        document.addEventListener('click', (e) => {
          if (!row.contains(e.target as Node)) return;
          if (!sourceInput.contains(e.target as Node) && !sourceSuggestions.contains(e.target as Node) && !sourcePopular.contains(e.target as Node)) { sourceSuggestions.classList.add('hidden'); sourcePopular.classList.add('hidden'); }
          if (!destinationInput.contains(e.target as Node) && !destinationSuggestions.contains(e.target as Node) && !destinationPopular.contains(e.target as Node)) { destinationSuggestions.classList.add('hidden'); destinationPopular.classList.add('hidden'); }
        });

        // Submit (robust: guard against double-submits and ensure click always triggers submit)
        const form = row.querySelector('.flight-form') as HTMLFormElement | null;
        const cancelBtn = row.querySelector(`#cancel-button-${uid}`) as HTMLElement | null;
        const submitBtnEl = row.querySelector(`#search-button-${uid}`) as HTMLButtonElement | null;

        // Use AbortController to avoid stacking global listeners when row is removed
        const ac = new AbortController();
        const docSignal = ac.signal;

        // Close date modal and hide suggestion lists on outside click using abortable listeners
        document.addEventListener('click', (e) => {
          if (!row.contains(e.target as Node)) return;
          if (dateModal && !dateModal.contains(e.target as Node) && dateInput && !dateInput.contains(e.target as Node)) {
            dateModal.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');
            dateModal.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
            // Show buttons when calendar closes
            if (buttonRow) buttonRow.style.display = 'flex';
          }
          if (!sourceInput.contains(e.target as Node) && !sourceSuggestions.contains(e.target as Node) && !sourcePopular.contains(e.target as Node)) { sourceSuggestions.classList.add('hidden'); sourcePopular.classList.add('hidden'); }
          if (!destinationInput.contains(e.target as Node) && !destinationSuggestions.contains(e.target as Node) && !destinationPopular.contains(e.target as Node)) { destinationSuggestions.classList.add('hidden'); destinationPopular.classList.add('hidden'); }
        }, { signal: docSignal });

        if (chatMessages) chatMessages.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          if (t.closest('.quick-reply-button') || t.closest('.quick-actions')) return;
          if (!row.contains(t)) { ac.abort(); row.remove(); }
        }, { signal: docSignal });

        if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.stopPropagation(); ac.abort(); row.remove(); });

        // Ensure button click always submits even if native validation UI behaves inconsistently
        if (submitBtnEl && form) {
          submitBtnEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (submitBtnEl.disabled) return;
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
            if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
          });
        }

        if (form) {
          let submitting = false;
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
            if (submitting) return; // guard against accidental double clicks
            submitting = true;
            const submitBtn = submitBtnEl;
            if (submitBtn) { submitBtn.textContent = 'Searching...'; submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
            const payload = {
              source: sourceInput.value,
              destination: destinationInput.value,
              departureDate: (hiddenDateInput && hiddenDateInput.value) || new Date().toISOString().slice(0, 10),
              adults: parseInt((row.querySelector(`#adults-${uid}`) as HTMLInputElement).value || '1', 10)
            };
            createMessageBubble(`Flight search: ${payload.source} → ${payload.destination} (${payload.departureDate}) - ${payload.adults} adult(s)`, true);
            const loader = createLoadingIndicator();
            try {
              const resp = await fetch(FLIGHTS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
              const json = await resp.json();
              loader.remove();
              setBackendOnline(true);
              ac.abort();
              row.remove();
              const flightsArray = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.results) ? json.results : (Array.isArray(json?.flights) ? json.flights : [])));
              if (flightsArray.length > 0) {
                renderFlights(flightsArray, !isDesktopView, chatMessages!);
              } else {
                createMessageBubble('No flights found for your search.', false);
              }
            } catch (err) {
              console.error('Flight fetch failed', err);
              loader.remove();
              createMessageBubble('Unable to fetch flights. Please try again later.', false);
            } finally {
              submitting = false;
              if (submitBtn) { submitBtn.textContent = 'Search Flights'; submitBtn.disabled = false; submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
            }
          });
        }
      };




      const createInlineHotelForm = () => {
        if (!chatMessages) return;
        chatMessages.querySelectorAll('.inline-flight-form-row, .inline-hotel-form-row, .inline-attraction-form-row').forEach(n => (n as HTMLElement).remove());
        const uid = String(Date.now());
        const row = document.createElement('div');
        row.className = 'inline-hotel-form-row flex items-start w-full';
        row.innerHTML = `
          <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-[90%] w-full border border-gray-200">
            <h3 class="text-2xl font-bold mb-4 text-center text-gray-800">Find Your Hotel</h3>
            <form class="hotel-form space-y-6 relative">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" id="cityName-${uid}" name="cityName" placeholder="City" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                <div id="cityName-suggestions-${uid}" class="autocomplete-list hidden"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <div id="checkinDate-picker-input-${uid}" class="mt-1 flex items-center justify-between cursor-pointer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    <span id="checkinDate-display-${uid}" class="text-gray-700"></span>
                    <i class="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input type="hidden" id="checkinDate-${uid}" name="checkinDate" />
                  <div id="date-picker-modal-checkin-${uid}" class="absolute z-10 mt-2 left-0 right-0 p-4 bg-yellow-400 rounded-2xl shadow-lg transition-all duration-300 scale-95 opacity-0 pointer-events-none origin-top">
                    <div class="flex justify-center mb-2"><div class="h-1 w-10 bg-yellow-600 rounded-full"></div></div>
                    <div id="calendar-view-checkin-${uid}" class="transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto">
                      <div class="flex justify-between items-center text-sm font-medium text-yellow-800 mb-2">
                        <span class="w-1/3 text-center">Day</span>
                        <span class="w-1/3 text-center">Month</span>
                        <span class="w-1/3 text-center">Year</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 h-48 overflow-hidden relative">
                        <div id="selection-highlight-checkin-${uid}" class="absolute h-10 w-full bg-yellow-600 rounded-full transition-transform duration-200 ease-in-out pointer-events-none z-0"></div>
                        <ul id="day-list-checkin-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="month-list-checkin-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="year-list-checkin-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                      </div>
                    </div>
                    <div id="final-date-view-checkin-${uid}" class="absolute inset-0 flex flex-col justify-center items-center text-center opacity-0 pointer-events-none transition-opacity duration-300">
                      <p class="text-4xl font-bold text-yellow-800" id="final-date-display-checkin-${uid}"></p>
                      <button type="button" id="change-date-button-checkin-${uid}" class="mt-4 px-6 py-2 bg-yellow-600 text-yellow-900 font-semibold rounded-full text-sm">Change Date</button>
                    </div>
                  </div>
                </div>

                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <div id="checkoutDate-picker-input-${uid}" class="mt-1 flex items-center justify-between cursor-pointer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    <span id="checkoutDate-display-${uid}" class="text-gray-700"></span>
                    <i class="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input type="hidden" id="checkoutDate-${uid}" name="checkoutDate" />
                  <div id="date-picker-modal-checkout-${uid}" class="absolute z-10 mt-2 left-0 right-0 p-4 bg-yellow-400 rounded-2xl shadow-lg transition-all duration-300 scale-95 opacity-0 pointer-events-none origin-top">
                    <div class="flex justify-center mb-2"><div class="h-1 w-10 bg-yellow-600 rounded-full"></div></div>
                    <div id="calendar-view-checkout-${uid}" class="transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto">
                      <div class="flex justify-between items-center text-sm font-medium text-yellow-800 mb-2">
                        <span class="w-1/3 text-center">Day</span>
                        <span class="w-1/3 text-center">Month</span>
                        <span class="w-1/3 text-center">Year</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 h-48 overflow-hidden relative">
                        <div id="selection-highlight-checkout-${uid}" class="absolute h-10 w-full bg-yellow-600 rounded-full transition-transform duration-200 ease-in-out pointer-events-none z-0"></div>
                        <ul id="day-list-checkout-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="month-list-checkout-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="year-list-checkout-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                      </div>
                    </div>
                    <div id="final-date-view-checkout-${uid}" class="absolute inset-0 flex flex-col justify-center items-center text-center opacity-0 pointer-events-none transition-opacity duration-300">
                      <p class="text-4xl font-bold text-yellow-800" id="final-date-display-checkout-${uid}"></p>
                      <button type="button" id="change-date-button-checkout-${uid}" class="mt-4 px-6 py-2 bg-yellow-600 text-yellow-900 font-semibold rounded-full text-sm">Change Date</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                <input type="number" id="adults-${uid}" name="adults" value="1" min="1" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
              </div>

              <div class="pt-6 flex flex-col sm:flex-row-reverse justify-end items-center gap-4 relative z-20">
                <button type="submit" id="search-button-${uid}" class="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">Search Hotels</button>
                <button type="button" id="cancel-button-${uid}" class="w-full sm:w-auto px-8 py-3 text-gray-700 bg-gray-200 font-semibold rounded-xl shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition">Cancel</button>
              </div>

              <div id="message-box-${uid}" class="mt-4 p-4 text-center rounded-xl transition-opacity duration-300 opacity-0 hidden"></div>
            </form>
          </div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // constants and helpers
        const HOTELS_API_URL = 'http://localhost:8000/tools/fetchHotels';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const qs = (sel: string) => row.querySelector(sel) as HTMLElement | null;
        const qsi = (sel: string) => row.querySelector(sel) as HTMLInputElement | null;

        const cityNameInput = qsi(`#cityName-${uid}`)!;
        const cityNameSuggestions = qs(`#cityName-suggestions-${uid}`)!;
        const cancelButton = qs(`#cancel-button-${uid}`)!;
        const searchButton = qs(`#search-button-${uid}`)!;
        const buttonRow = row.querySelector('.pt-6.flex.flex-col.sm\\:flex-row-reverse.justify-end.items-center.gap-4') as HTMLElement | null;
        const messageBox = qs(`#message-box-${uid}`)! as HTMLElement;
        const form = row.querySelector('.hotel-form') as HTMLFormElement | null;

        const setMsg = (msg: string, type: 'success' | 'error') => {
          if (!messageBox) return;
          messageBox.textContent = msg;
          messageBox.classList.remove('bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'hidden');
          if (type === 'success') { messageBox.classList.add('bg-green-100', 'text-green-700'); }
          else { messageBox.classList.add('bg-red-100', 'text-red-700'); }
          messageBox.classList.remove('opacity-0');
          messageBox.classList.add('opacity-100');
        };

        // init dates
        const hiddenCheckin = qsi(`#checkinDate-${uid}`)!;
        const hiddenCheckout = qsi(`#checkoutDate-${uid}`)!;
        const displayCheckin = qs(`#checkinDate-display-${uid}`)!;
        const displayCheckout = qs(`#checkoutDate-display-${uid}`)!;
        hiddenCheckin.value = '2025-11-01';
        hiddenCheckout.value = '2025-11-07';
        if (displayCheckin) displayCheckin.textContent = hiddenCheckin.value;
        if (displayCheckout) displayCheckout.textContent = hiddenCheckout.value;

        // date pickers identical to flight calendar
        const initHotelDatePicker = (kind: 'checkin' | 'checkout') => {
          const dateInput = qs(`#${kind}Date-picker-input-${uid}`);
          const dateModal = qs(`#date-picker-modal-${kind}-${uid}`) as HTMLElement | null;
          const hiddenDateInput = qsi(`#${kind}Date-${uid}`);
          const displayDateSpan = qs(`#${kind}Date-display-${uid}`) as HTMLElement | null;
          const dayList = qs(`#day-list-${kind}-${uid}`) as HTMLElement | null;
          const monthList = qs(`#month-list-${kind}-${uid}`) as HTMLElement | null;
          const yearList = qs(`#year-list-${kind}-${uid}`) as HTMLElement | null;
          const calendarView = qs(`#calendar-view-${kind}-${uid}`);
          const finalDateView = qs(`#final-date-view-${kind}-${uid}`);
          const finalDateDisplay = qs(`#final-date-display-${kind}-${uid}`) as HTMLElement | null;
          const changeDateButton = qs(`#change-date-button-${kind}-${uid}`);
          const selectionHighlight = qs(`#selection-highlight-${kind}-${uid}`) as HTMLElement | null;
          const calendarGrid = dateModal ? (dateModal.querySelector('.grid') as HTMLElement | null) : null;

          let selectedDay: number, selectedMonth: number, selectedYear: number;
          const now = new Date();
          const currentDay = now.getDate();
          const currentMonth = now.getMonth();
          const nowYear = now.getFullYear();
          selectedDay = currentDay; selectedMonth = currentMonth; selectedYear = nowYear;

          const updateDateFields = () => {
            if (!hiddenDateInput || !displayDateSpan) return;
            const monthFormatted = String(selectedMonth + 1).padStart(2, '0');
            const dayFormatted = String(selectedDay).padStart(2, '0');
            const dateString = `${selectedYear}-${monthFormatted}-${dayFormatted}`;
            hiddenDateInput.value = dateString;
            displayDateSpan.textContent = dateString;
          };

          const populateDayList = (year: number, month: number) => {
            if (!dayList) return;
            dayList.innerHTML = '';
            const numDays = new Date(year, month + 1, 0).getDate();
            const startDay = (year === nowYear && month === currentMonth) ? currentDay : 1;
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; dayList.appendChild(e); }
            for (let i = startDay; i <= numDays; i++) { const li = document.createElement('li'); li.textContent = String(i); li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); dayList.appendChild(li); }
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; dayList.appendChild(e); }
          };
          const populateMonthList = (year: number) => {
            if (!monthList) return;
            monthList.innerHTML = '';
            const startMonth = (year === nowYear) ? currentMonth : 0;
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; monthList.appendChild(e); }
            for (let i = startMonth; i < monthNames.length; i++) { const li = document.createElement('li'); li.textContent = monthNames[i]; li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); monthList.appendChild(li); }
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; monthList.appendChild(e); }
          };
          const populateYearList = () => {
            if (!yearList) return;
            yearList.innerHTML = '';
            const endYear = nowYear + 10;
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; yearList.appendChild(e); }
            for (let i = nowYear; i <= endYear; i++) { const li = document.createElement('li'); li.textContent = String(i); li.className = 'py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value = String(i); yearList.appendChild(li); }
            for (let i = 0; i < 2; i++) { const e = document.createElement('li'); e.className = 'py-2 px-1'; yearList.appendChild(e); }
          };

          const updateHighlightPosition = () => {
            if (!selectionHighlight || !calendarGrid || !dayList) return;
            const selectedDayEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null;
            if (selectedDayEl) {
              const gridRect = calendarGrid.getBoundingClientRect();
              const dayRect = selectedDayEl.getBoundingClientRect();
              const topPosition = dayRect.top - gridRect.top;
              selectionHighlight.style.transform = `translateY(${topPosition}px)`;
            }
          };

          const updateSelectedClasses = () => {
            if (!dayList || !monthList || !yearList) return;
            dayList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
            monthList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
            yearList.querySelectorAll('li').forEach(li => li.classList.remove('selected-text'));
            const dEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; if (dEl) dEl.classList.add('selected-text');
            const mEl = monthList.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; if (mEl) mEl.classList.add('selected-text');
            const yEl = yearList.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; if (yEl) yEl.classList.add('selected-text');
          };

          const scrollToSelected = () => {
            const dEl = dayList?.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; dEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const mEl = monthList?.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; mEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const yEl = yearList?.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; yEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          };

          const handleScroll = (list: HTMLElement & { scrollTimeout?: any }, setter: (v: number) => void) => {
            clearTimeout(list.scrollTimeout);
            list.scrollTimeout = setTimeout(() => {
              const listItems = Array.from(list.children) as HTMLElement[];
              const validItems = listItems.filter((li) => (li as HTMLElement).dataset && (li as HTMLElement).dataset.value);
              if (!validItems.length) return;
              let closestItem: HTMLElement = validItems[0];
              let minDistance = Infinity;
              const listRect = list.getBoundingClientRect();
              validItems.forEach((item: HTMLElement) => {
                const rect = item.getBoundingClientRect();
                const distance = Math.abs((rect.top + rect.bottom) / 2 - (listRect.top + listRect.bottom) / 2);
                if (distance < minDistance) { minDistance = distance; closestItem = item; }
              });
              const dataVal = (closestItem.dataset || ({} as any)).value;
              if (closestItem && dataVal) {
                const value = parseInt(dataVal, 10);
                setter(value);
                updateDateFields(); updateHighlightPosition(); updateSelectedClasses();
              }
            }, 50);
          };

          const handleClick = (event: any, setter: (v: number) => void, updateCallback: () => void) => {
            const li = event.target.closest('li');
            if (li && (li as any).dataset.value) {
              const value = parseInt((li as any).dataset.value, 10);
              setter(value);
              updateCallback();
              updateDateFields(); updateHighlightPosition(); updateSelectedClasses(); scrollToSelected(); animateToFinalView();
            }
          };

          const openModal = () => {
            if (!dateModal) return;
            dateModal.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
            dateModal.classList.add('scale-100', 'opacity-100', 'pointer-events-auto');
            updateHighlightPosition(); updateSelectedClasses(); scrollToSelected();
            // Hide buttons when calendar opens
            if (buttonRow) buttonRow.style.display = 'none';
          };
          const closeModal = () => {
            if (!dateModal) return;
            dateModal.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');
            dateModal.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
            // Show buttons when calendar closes
            if (buttonRow) buttonRow.style.display = 'flex';
          };
          const animateToFinalView = () => {
            if (!calendarView || !finalDateView || !finalDateDisplay) return;
            calendarView.classList.remove('opacity-100', 'pointer-events-auto');
            calendarView.classList.add('opacity-0', 'pointer-events-none');
            finalDateDisplay.textContent = `${selectedDay} ${monthNames[selectedMonth]} ${selectedYear}`;
            finalDateView.classList.remove('opacity-0', 'pointer-events-none');
            finalDateView.classList.add('opacity-100', 'pointer-events-auto');
          };
          const resetCalendarView = () => {
            if (!calendarView || !finalDateView) return;
            finalDateView.classList.remove('opacity-100', 'pointer-events-auto');
            finalDateView.classList.add('opacity-0', 'pointer-events-none');
            calendarView.classList.remove('opacity-0', 'pointer-events-none');
            calendarView.classList.add('opacity-100', 'pointer-events-auto');
            scrollToSelected();
          };

          // initialize lists and defaults
          populateYearList(); populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); updateDateFields();

          // listeners
          dateInput?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
          changeDateButton?.addEventListener('click', resetCalendarView);
          dayList?.addEventListener('scroll', () => handleScroll(dayList, (val) => { selectedDay = val; if (selectedYear === nowYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }));
          dayList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedDay = val; if (selectedYear === nowYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }, () => { }));
          monthList?.addEventListener('scroll', () => handleScroll(monthList, (val) => { selectedMonth = val; if (selectedYear === nowYear && selectedMonth < currentMonth) selectedMonth = currentMonth; if (selectedYear === nowYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; populateDayList(selectedYear, selectedMonth); }));
          monthList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedMonth = val; if (selectedYear === nowYear && selectedMonth < currentMonth) selectedMonth = currentMonth; if (selectedYear === nowYear && selectedMonth === currentMonth && selectedDay < currentDay) selectedDay = currentDay; }, () => { populateDayList(selectedYear, selectedMonth); }));
          yearList?.addEventListener('scroll', () => handleScroll(yearList, (val) => { selectedYear = val; populateMonthList(selectedYear); if (selectedYear === nowYear && selectedMonth < currentMonth) { selectedMonth = currentMonth; selectedDay = currentDay; } populateDayList(selectedYear, selectedMonth); }));
          yearList?.addEventListener('click', (e) => handleClick(e, (val) => { selectedYear = val; if (selectedYear === nowYear && selectedMonth < currentMonth) { selectedMonth = currentMonth; selectedDay = currentDay; } }, () => { populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); }));
        };

        // city autocomplete using Airport Search API
        const getAirportApiUrlForHotels = () => {
          const winBase = (window as any).__API_BASE__;
          const base = (winBase || '').toString().trim();
          if (base) return `${base.replace(/\/$/, '')}/tools/searchAirport`;
          return 'http://localhost:8000/tools/searchAirport';
        };
        const AIRPORT_API_URL_HOTEL = getAirportApiUrlForHotels();
        let cityAutocompleteTimeout: any;
        const fetchAndDisplayCities = async (query: string) => {
          if (!cityNameSuggestions) return;
          if (!query || query.trim().length < 2) { cityNameSuggestions.innerHTML = ''; cityNameSuggestions.classList.add('hidden'); return; }
          try {
            const resp = await fetch(AIRPORT_API_URL_HOTEL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ searchString: query }) });
            if (resp.status === 204) { cityNameSuggestions.classList.add('hidden'); return; }
            if (!resp.ok) throw new Error(`API error ${resp.status}`);
            const data = await resp.json();
            const results = (data && Array.isArray(data.results)) ? data.results : (Array.isArray(data) ? data : []);
            type CityOpt = { city: string; country: string };
            const seen = new Set<string>();
            const cities: CityOpt[] = (results as any[])
              .map((ap: any): CityOpt => ({ city: ap.city || ap.airport_name || ap.iata || '', country: ap.country || '' }))
              .filter((c: CityOpt) => Boolean(c.city))
              .filter((c: CityOpt) => { const key = `${c.city}|${c.country}`; if (seen.has(key)) return false; seen.add(key); return true; })
              .slice(0, 20);
            cityNameSuggestions.innerHTML = '';
            if (cities.length) {
              cities.forEach((c: any) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `<div>${c.city}</div><div class="text-sm text-gray-500">${[c.city, c.country].filter(Boolean).join(', ')}</div>`;
                item.addEventListener('click', () => { if (cityNameInput) cityNameInput.value = c.city; cityNameSuggestions.classList.add('hidden'); });
                cityNameSuggestions.appendChild(item);
              });
              cityNameSuggestions.classList.remove('hidden');
            } else { cityNameSuggestions.classList.add('hidden'); }
          } catch (err) {
            console.error('Failed to fetch city suggestions', err);
            cityNameSuggestions.classList.add('hidden');
          }
        };
        cityNameInput.addEventListener('input', (e: any) => { clearTimeout(cityAutocompleteTimeout); cityAutocompleteTimeout = setTimeout(() => { fetchAndDisplayCities(e.target.value); }, 300); });
        cityNameInput.addEventListener('focus', () => { if (cityNameInput && cityNameInput.value.trim().length >= 2) fetchAndDisplayCities(cityNameInput.value.trim()); });

        // Abortable global click handler to avoid stacking listeners between form openings
        const ac = new AbortController();
        const docSignal = ac.signal;
        document.addEventListener('click', (e) => {
          if (!row.contains(e.target as Node)) return;
          const m1 = qs(`#date-picker-modal-checkin-${uid}`) as HTMLElement | null;
          const m2 = qs(`#date-picker-modal-checkout-${uid}`) as HTMLElement | null;
          const isInModal = (m1 && m1.contains(e.target as Node)) || (m2 && m2.contains(e.target as Node));
          const i1 = qs(`#checkinDate-picker-input-${uid}`) as HTMLElement | null;
          const i2 = qs(`#checkoutDate-picker-input-${uid}`) as HTMLElement | null;
          const isOnInput = (i1 && i1.contains(e.target as Node)) || (i2 && i2.contains(e.target as Node));
          if (!isInModal && !isOnInput) {
            [m1, m2].forEach(m => { if (m) { m.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto'); m.classList.add('scale-95', 'opacity-0', 'pointer-events-none'); } });
            // Show buttons when calendar closes
            if (buttonRow) buttonRow.style.display = 'flex';
          }
          if (!cityNameInput.contains(e.target as Node) && !cityNameSuggestions.contains(e.target as Node)) { cityNameSuggestions.classList.add('hidden'); }
        }, { signal: docSignal });

        if (chatMessages) chatMessages.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          if (t.closest('.quick-reply-button') || t.closest('.quick-actions')) return;
          if (!row.contains(t)) { ac.abort(); row.remove(); }
        }, { signal: docSignal });

        initHotelDatePicker('checkin');
        initHotelDatePicker('checkout');

        if (cancelButton) cancelButton.addEventListener('click', (e) => { e.stopPropagation(); ac.abort(); row.remove(); });

        if (form) {
          const submitBtn = qs(`#search-button-${uid}`) as HTMLButtonElement | null;
          // Ensure click triggers submit consistently
          if (submitBtn) submitBtn.addEventListener('click', (e) => { e.stopPropagation(); if (form) { if (!form.checkValidity()) { form.reportValidity(); return; } if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); } });

          let submitting = false;
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
            if (submitting) return; submitting = true;
            if (submitBtn) { submitBtn.textContent = 'Searching...'; submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
            const payload = {
              cityName: cityNameInput.value,
              checkinDate: hiddenCheckin.value,
              checkoutDate: hiddenCheckout.value,
              adults: parseInt((qs(`#adults-${uid}`) as HTMLInputElement).value || '1', 10)
            };
            createMessageBubble(`Hotel search: ${payload.cityName} (${payload.checkinDate} → ${payload.checkoutDate}) - ${payload.adults} adult(s)`, true);
            const loader = createLoadingIndicator();
            try {
              const resp = await fetch(HOTELS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
              const json = await resp.json();
              loader.remove(); setBackendOnline(true); ac.abort(); row.remove();
              const hotelsArray = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.results) ? json.results : (Array.isArray(json?.hotels) ? json.hotels : [])));
              if (hotelsArray.length > 0) {
                renderHotels(hotelsArray, !isDesktopView, chatMessages!);
              } else {
                createMessageBubble('No hotels found for your search.', false);
              }
            } catch (err) {
              console.error('Hotel fetch failed', err);
              loader.remove(); setBackendOnline(false); setMsg('Failed to connect to the hotel search service.', 'error');
            } finally {
              submitting = false;
              if (submitBtn) { submitBtn.textContent = 'Search Hotels'; submitBtn.disabled = false; submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
            }
          });
        }
      };

      const createInlineAttractionsForm = () => {
        if (!chatMessages) return;
        chatMessages.querySelectorAll('.inline-flight-form-row, .inline-hotel-form-row, .inline-attraction-form-row').forEach(n => (n as HTMLElement).remove());
        const uid = String(Date.now());
        const row = document.createElement('div');
        row.className = 'inline-attraction-form-row flex items-start w-full';
        row.innerHTML = `
          <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-[90%] w-full border border-gray-200">
            <h3 class="text-2xl font-bold mb-4 text-center text-gray-800">Explore Attractions</h3>
            <form class="attraction-form space-y-6 relative">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" id="attr-cityName-${uid}" name="cityName" placeholder="City" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                <div id="attr-cityName-suggestions-${uid}" class="autocomplete-list hidden"></div>
              </div>

              <div class="pt-2 flex flex-col sm:flex-row-reverse justify-end items-center gap-4">
                <button type="submit" id="attr-search-button-${uid}" class="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">Search Attractions</button>
                <button type="button" id="attr-cancel-button-${uid}" class="w-full sm:w-auto px-8 py-3 text-gray-700 bg-gray-200 font-semibold rounded-xl shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition">Cancel</button>
              </div>
            </form>
          </div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const ATTRACTIONS_API_URL = 'http://localhost:8000/tools/fetchAttractions';
        const qs = (sel: string) => row.querySelector(sel) as HTMLElement | null;
        const qsi = (sel: string) => row.querySelector(sel) as HTMLInputElement | null;
        const cityInput = qsi(`#attr-cityName-${uid}`)!;
        const citySug = qs(`#attr-cityName-suggestions-${uid}`)!;
        const cancelBtn = qs(`#attr-cancel-button-${uid}`)!;
        const form = row.querySelector('.attraction-form') as HTMLFormElement | null;

        const getAirportApiUrl = () => {
          const winBase = (window as any).__API_BASE__;
          const base = (winBase || '').toString().trim();
          if (base) return `${base.replace(/\/$/, '')}/tools/searchAirport`;
          return 'http://localhost:8000/tools/searchAirport';
        };
        const AIRPORT_API_URL = getAirportApiUrl();

        let t: any;
        const fetchCities = async (query: string) => {
          if (!citySug) return;
          if (!query || query.trim().length < 2) { citySug.innerHTML = ''; citySug.classList.add('hidden'); return; }
          try {
            const resp = await fetch(AIRPORT_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ searchString: query }) });
            if (resp.status === 204) { citySug.classList.add('hidden'); return; }
            if (!resp.ok) throw new Error(`API error ${resp.status}`);
            const data = await resp.json();
            const results = (data && Array.isArray(data.results)) ? data.results : (Array.isArray(data) ? data : []);
            const seen = new Set<string>();
            const cities = (results as any[])
              .map((ap: any) => ({ city: ap.city || ap.airport_name || ap.iata || '', country: ap.country || '' }))
              .filter((c: any) => Boolean(c.city))
              .filter((c: any) => { const key = `${c.city}|${c.country}`; if (seen.has(key)) return false; seen.add(key); return true; })
              .slice(0, 20);
            citySug.innerHTML = '';
            if (cities.length) {
              cities.forEach((c: any) => { const item = document.createElement('div'); item.className = 'autocomplete-item'; item.innerHTML = `<div>${c.city}</div><div class="text-sm text-gray-500">${[c.city, c.country].filter(Boolean).join(', ')}</div>`; item.addEventListener('click', () => { if (cityInput) cityInput.value = c.city; citySug.classList.add('hidden'); }); citySug.appendChild(item); });
              citySug.classList.remove('hidden');
            } else { citySug.classList.add('hidden'); }
          } catch (e) { console.error('Failed to fetch city suggestions', e); citySug.classList.add('hidden'); }
        };
        cityInput.addEventListener('input', (e: any) => { clearTimeout(t); t = setTimeout(() => fetchCities(e.target.value), 300); });
        cityInput.addEventListener('focus', () => { if (cityInput && cityInput.value.trim().length >= 2) fetchCities(cityInput.value.trim()); });
        const ac = new AbortController();
        const docSignal = ac.signal;
        document.addEventListener('click', (e) => { if (!row.contains(e.target as Node)) return; if (!cityInput.contains(e.target as Node) && !citySug.contains(e.target as Node)) { citySug.classList.add('hidden'); } }, { signal: docSignal });
        if (chatMessages) chatMessages.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('.quick-reply-button') || t.closest('.quick-actions')) return; if (!row.contains(t)) { ac.abort(); row.remove(); } }, { signal: docSignal });
        if (cancelBtn) cancelBtn.addEventListener('click', () => { ac.abort(); row.remove(); });

        if (form) {
          const btn = qs(`#attr-search-button-${uid}`) as HTMLButtonElement | null;
          if (btn) btn.addEventListener('click', () => { if (form) { if (!form.checkValidity()) { form.reportValidity(); return; } if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); } });
          let submitting = false;
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitting) return; submitting = true;
            if (btn) { btn.textContent = 'Searching...'; btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
            const payload = { cityName: cityInput.value };
            createMessageBubble(`Attractions search: ${payload.cityName}`, true);
            const loader = createLoadingIndicator();
            try {
              const resp = await fetch(ATTRACTIONS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
              const json = await resp.json();
              loader.remove(); setBackendOnline(true); ac.abort(); row.remove();
              const arr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.results) ? json.results : (Array.isArray(json?.rows) ? json.rows : (Array.isArray(json?.attractions) ? json.attractions : []))));
              if (arr.length > 0) { renderAttractions(arr, !isDesktopView, chatMessages!); } else { createMessageBubble('No attractions found for your search.', false); }
            } catch (err) {
              console.error('Attractions fetch failed', err);
              loader.remove(); setBackendOnline(false); createMessageBubble('Unable to fetch attractions. Please try again later.', false);
            } finally { submitting = false; if (btn) { btn.textContent = 'Search Attractions'; btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); } }
          });
        }
      };

      const attachQuickReplyListeners = () => {
        const buttons = document.querySelectorAll('.quick-reply-button');
        buttons.forEach(btn => {
          const b = btn as HTMLElement & { _qrHandler?: any };
          if (b._qrHandler) return;
          const handler = () => {
            const label = (b.dataset.label || b.textContent || '').trim();
            if (label.toLowerCase().startsWith('find a flight')) { createInlineFlightForm(); return; }
            if (label.toLowerCase().startsWith('search for hotels')) { createInlineHotelForm(); return; }
            if (label.toLowerCase().startsWith('explore attractions in a city')) { createInlineAttractionsForm(); return; }
            if (userPromptInput) { userPromptInput.value = label; userPromptInput.focus(); }
          };
          btn.addEventListener('click', handler);
          b._qrHandler = handler;
        });
      };

      try {
        (window as any).__attachQuickReplies = attachQuickReplyListeners;
        attachQuickReplyListeners();
        document.addEventListener('DOMContentLoaded', attachQuickReplyListeners);
      } catch (e) { console.warn('Failed to attach quick reply listeners', e); }

      addWelcomeMessage();
    };

    window.addEventListener('load', onLoad);
    // Also run once immediately in case 'load' has already fired
    onLoad();

    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  const clearChat = () => { const f = (window as any).clearChat; if (typeof f === 'function') f(); };
  const restartConversation = () => { const f = (window as any).restartConversation; if (typeof f === 'function') f(); };

  // Alternative: Strongly typed version using proper interfaces



  interface ItineraryData {
    overview?: {
      title?: string;
      destination?: string;
      summary?: string;
      stats?: {
        durationInDays?: number;
        checkInDate?: string;
        checkOutDate?: string;
        placesVisited?: number;
      };
    };
    dailyPlan?: Array<{
      day: number;
      title: string;
      activities: Array<{
        name: string;
        type?: string;
        rating?: number;
        description?: string;
        imageLinks?: string[];
      }>;
    }>;
    exploreMore?: Array<{
      name: string;
      type?: string;
      rating?: number;
      description?: string;
      imageLinks?: string[];
    }>;
    hotelRecommendations?: {
      cheapest?: Array<{
        name: string;
        rating?: number;
        price?: string;
        pricecurrency?: string;
        link?: string;
        imageLinks?: string[];
      }>;
      highestRated?: Array<{
        name: string;
        rating?: number;
        price?: string;
        pricecurrency?: string;
        link?: string;
        imageLinks?: string[];
      }>;
    };
    flightSuggestions?: {
      cheapest?: Array<{
        airline?: string;
        airline_logo?: string;
        departureairportcode?: string;
        arrivalairportcode?: string;
        departuredatetime?: string;
        arrivaldatetime?: string;
        price?: string;
        pricecurrency?: string;
      }>;
      shortestDuration?: Array<{
        airline?: string;
        airline_logo?: string;
        departureairportcode?: string;
        arrivalairportcode?: string;
        departuredatetime?: string;
        arrivaldatetime?: string;
        price?: string;
        pricecurrency?: string;
      }>;
    };
  }


  const [navOpen, setNavOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: any;

    const TOOLS_URL = 'http://localhost:8000/tools';

    const tryFetch = async (url: string) => {
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 2500);
        await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
        clearTimeout(id);
        return true;
      } catch {
        return false;
      }
    };

    const check = async () => {
      const ok = await tryFetch(TOOLS_URL);
      if (mounted) setBackendOnline(!!ok);
    };

    const onOnline = () => { check(); };
    const onOffline = () => { if (mounted) setBackendOnline(false); };

    check();
    timer = setInterval(check, 10000);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <>
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F6f93519000c74ba084c4626024227ad2%2F161f61559b844c2b95a6c7af386a3097?format=webp&width=800" alt="Tapas logo" className="nav-brand-logo w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-gray-800">Tapas Travel AI</span>
          </div>
          <div className="nav-desktop-links flex items-center space-x-4">
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">Features</a>
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">About</a>
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">Contact</a>
          </div>
          <button
            className="nav-toggle chat-header-button p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
            onClick={(e) => { e.preventDefault(); setNavOpen((o) => !o); }}
          >
            <i className="fas fa-bars" />
          </button>
        </div>
        <div id="mobile-nav" className={`mobile-nav-panel ${navOpen ? 'open' : ''}`}>
          <a href="/" className="mobile-nav-link" onClick={() => setNavOpen(false)}>Features</a>
          <a href="/" className="mobile-nav-link" onClick={() => setNavOpen(false)}>About</a>
          <a href="/" className="mobile-nav-link" onClick={() => setNavOpen(false)}>Contact</a>
        </div>
      </nav>
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-hidden relative" onClick={() => { if (navOpen) setNavOpen(false); }}>
        <div className="main-hero-bg" aria-hidden="true" />
        <div id="intro-section" className="w-full md:w-2/3 lg:w-1/2 p-8 md:p-10 flex-shrink-0 flex flex-col space-y-6 transition-all duration-700 ease-in-out relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-800"><span className="gradient-text">Tapas</span> – Your Intelligent Travel Planning Assistant</h1>
          <p className="text-xl md:text-2xl text-gray-700">
            Tapas helps travelers simplify every stage of their journey — from discovering destinations to finding flights, hotels, and attractions. Acting as a virtual travel concierge, Tapas answers questions, compares options, and builds personalized itineraries tailored to budgets, schedules, and preferences. Whether you're planning a quick getaway or a detailed international trip, Tapas ensures a seamless, stress-free experience with smart recommendations and real-time data.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3 text-gray-700 text-lg">
              <i className="fas fa-plane text-blue-500 text-xl" />
              <span className="font-semibold">Live Flight Data</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 text-lg">
              <i className="fas fa-hotel text-blue-500 text-xl" />
              <span className="font-semibold">Hotel Booking & Info</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 text-lg">
              <i className="fas fa-map-marker-alt text-blue-500 text-xl" />
              <span className="font-semibold">Attractions & Itineraries</span>
            </div>
          </div>
        </div>

        <div id="chat-container" className="bg-gray-200 phone-view flex-grow flex flex-col overflow-hidden transition-all duration-700 ease-in-out shadow-2xl chat-right-align z-20">
          <div className="relative bg-white shadow-md rounded-t-2xl p-4 flex items-center justify-between z-10">
            <div className="chat-title-centered">AI⚡Hutech</div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F6f93519000c74ba084c4626024227ad2%2F161f61559b844c2b95a6c7af386a3097?format=webp&width=800" alt="Tapas logo" className="w-8 h-8 rounded-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-semibold gradient-text">Tapas</span>
                <p id="backend-status" className="text-sm text-gray-500" aria-live="polite">{backendOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              <button id="toggle-view" className="chat-header-button p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200" title="Toggle view">
                <i className="fas fa-desktop text-sm" />
              </button>
              <div className="relative">
                <OverflowMenu
                  restartConversation={restartConversation}
                />
              </div>
            </div>
          </div>
          <div id="chat-messages" className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="flex flex-col items-start space-y-3">
              <div className="bg-white p-3 rounded-2xl shadow-sm max-w-[80%] welcome-message">
                <p className="text-gray-800 text-sm">Hello! How can I help you plan your next trip?</p>
              </div>
              <div className="quick-actions flex flex-wrap gap-2 max-w-[80%] mt-2" aria-label="Suggested actions">
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Find a flight?">Find a flight?</button>
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Search for hotels?">Search for hotels?</button>
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Explore attractions in a city?">Explore attractions in a city?</button>
              </div>
            </div>
          </div>
          <form id="chat-form" className="p-4 bg-white rounded-b-2xl">
            <div className="relative chat-input-wrapper">
              <input type="text" id="user-prompt" placeholder="Ask Tapas about your travel plans..." className="chat-input w-full p-3 pl-4 pr-14 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm" />
              <button type="submit" className="send-button absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Send message">
                <i className="fas fa-paper-plane" />
                <span className="send-spinner" aria-hidden="true"></span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <div id="modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
          <p id="modal-text" className="mb-4 text-gray-700"></p>
          <button onClick={() => { const m = document.getElementById('modal'); if (m) m.classList.add('hidden'); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Close</button>
        </div>
      </div>
    </>
  );
};

export default ChatApp;
