import { MENU_CATEGORIES, PAGES_DATA, PAGE_UI_LABELS, BLOG_POSTS } from './pages-data.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class PagesRouter {
  constructor({ i18n, onNavigateHome }) {
    this.i18n = i18n;
    this.onNavigateHome = onNavigateHome;
    this.activeSlug = null;
    this.activeBlogSlug = null;
    this.openDropdownId = null;

    this.navContainer = document.getElementById('main-nav-list');
    this.mobileDrawer = document.getElementById('mobile-menu-drawer');
    this.mobileToggleBtn = document.getElementById('btn-mobile-menu');
    this.subpageView = document.getElementById('subpage-view');
    this.subpageContent = document.getElementById('subpage-content');

    this.bindGlobalEvents();
    this.renderMenus();
    this.syncFromHash();
  }

  getLang() {
    return this.i18n.lang || 'en';
  }

  t(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = this.getLang();
    return obj[lang] || obj.en || obj.fr || '';
  }

  ui(key) {
    const lang = this.getLang();
    return (PAGE_UI_LABELS[lang] && PAGE_UI_LABELS[lang][key]) || PAGE_UI_LABELS.en[key] || key;
  }

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
        this.closeMobileDrawer();
      }
    });

    this.mobileToggleBtn?.addEventListener('click', () => {
      const isOpen = !this.mobileDrawer?.hidden;
      if (isOpen) {
        this.closeMobileDrawer();
      } else {
        this.openMobileDrawer();
      }
    });

    window.addEventListener('hashchange', () => this.syncFromHash());
  }

  openMobileDrawer() {
    if (!this.mobileDrawer) return;
    this.mobileDrawer.hidden = false;
    this.mobileToggleBtn?.setAttribute('aria-expanded', 'true');
  }

  closeMobileDrawer() {
    if (!this.mobileDrawer) return;
    this.mobileDrawer.hidden = true;
    this.mobileToggleBtn?.setAttribute('aria-expanded', 'false');
  }

  closeAllDropdowns() {
    this.openDropdownId = null;
    document.querySelectorAll('.nav-dropdown').forEach((dd) => {
      dd.classList.remove('open');
      dd.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }

  renderMenus() {
    if (this.navContainer) {
      this.navContainer.innerHTML = MENU_CATEGORIES.map((cat) => {
        const badgeHtml = cat.badgeKey
          ? `<span class="nav-badge">${escapeHtml(this.ui(cat.badgeKey))}</span>`
          : '';
        const isCategoryActive =
          (this.activeSlug && PAGES_DATA[this.activeSlug]?.category === cat.id) ||
          (!this.activeSlug && cat.id === 'home');

        const itemsHtml = cat.items
          .map((item) => {
            const isActiveItem = item.type === 'page' && item.slug === this.activeSlug;
            return `<button type="button" class="submenu-item${isActiveItem ? ' active' : ''}" data-nav-type="${item.type}" data-nav-target="${escapeHtml(item.slug || item.target)}">${escapeHtml(this.t(item.label))}</button>`;
          })
          .join('');

        return `
          <div class="nav-dropdown" data-cat-id="${cat.id}">
            <button type="button" class="nav-trigger${isCategoryActive ? ' active' : ''}" aria-expanded="false">
              ${badgeHtml}
              <span>${escapeHtml(this.t(cat.label))}</span>
              <span class="nav-caret" aria-hidden="true">▾</span>
            </button>
            <div class="nav-submenu" role="menu">
              ${itemsHtml}
            </div>
          </div>
        `;
      }).join('');

      this.navContainer.querySelectorAll('.nav-trigger').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const parent = btn.closest('.nav-dropdown');
          const wasOpen = parent.classList.contains('open');
          this.closeAllDropdowns();
          if (!wasOpen) {
            parent.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            this.openDropdownId = parent.dataset.catId;
          }
        });
      });

      this.navContainer.querySelectorAll('.submenu-item').forEach((itemBtn) => {
        itemBtn.addEventListener('click', () => {
          this.handleNavClick(itemBtn.dataset.navType, itemBtn.dataset.navTarget);
        });
      });
    }

    if (this.mobileDrawer) {
      this.mobileDrawer.innerHTML = MENU_CATEGORIES.map((cat) => {
        const badgeHtml = cat.badgeKey
          ? `<span class="nav-badge">${escapeHtml(this.ui(cat.badgeKey))}</span>`
          : '';
        const itemsHtml = cat.items
          .map((item) => {
            const isActiveItem = item.type === 'page' && item.slug === this.activeSlug;
            return `<button type="button" class="mobile-submenu-item${isActiveItem ? ' active' : ''}" data-nav-type="${item.type}" data-nav-target="${escapeHtml(item.slug || item.target)}">${escapeHtml(this.t(item.label))}</button>`;
          })
          .join('');

        return `
          <div class="mobile-cat-group">
            <div class="mobile-cat-title">${escapeHtml(this.t(cat.label))} ${badgeHtml}</div>
            <div class="mobile-cat-items">${itemsHtml}</div>
          </div>
        `;
      }).join('');

      this.mobileDrawer.querySelectorAll('.mobile-submenu-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.handleNavClick(btn.dataset.navType, btn.dataset.navTarget);
        });
      });
    }
  }

  handleNavClick(type, target) {
    this.closeAllDropdowns();
    this.closeMobileDrawer();

    if (type === 'page') {
      this.openPage(target);
    } else {
      this.closeSubpage();
      if (this.onNavigateHome) {
        this.onNavigateHome(type, target);
      }
    }
  }

  syncFromHash() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#page/')) {
      const slug = decodeURIComponent(hash.slice(6));
      if (PAGES_DATA[slug]) {
        this.openPage(slug, false);
        return;
      }
    }
    if (this.activeSlug) {
      this.closeSubpage(false);
    }
  }

  openPage(slug, pushHash = true) {
    const page = PAGES_DATA[slug];
    if (!page) return;

    this.activeSlug = slug;
    this.activeBlogSlug = null;
    if (pushHash) {
      window.location.hash = `#page/${encodeURIComponent(slug)}`;
    }

    document.body.classList.add('subpage-open');
    if (this.subpageView) {
      this.subpageView.hidden = false;
      this.subpageView.scrollTop = 0;
    }

    this.renderMenus();
    this.renderSubpage(slug);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  closeSubpage(clearHash = true) {
    this.activeSlug = null;
    this.activeBlogSlug = null;
    document.body.classList.remove('subpage-open');
    if (this.subpageView) {
      this.subpageView.hidden = true;
    }
    if (clearHash && window.location.hash.startsWith('#page/')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    this.renderMenus();
  }

  renderSubpage(slug) {
    if (!this.subpageContent) return;
    const page = PAGES_DATA[slug];
    if (!page) return;

    const category = MENU_CATEGORIES.find((c) => c.id === page.category);
    const siblingTabsHtml = category
      ? category.items
          .filter((it) => it.type === 'page')
          .map((it) => {
            const active = it.slug === slug ? ' active' : '';
            return `<button type="button" class="subpage-cat-tab${active}" data-open-page="${escapeHtml(it.slug)}">${escapeHtml(this.t(it.label))}</button>`;
          })
          .join('')
      : '';

    const specsHtml = page.specs?.length
      ? `
        <section class="sub-section">
          <h3>${escapeHtml(this.ui('specsTitle'))}</h3>
          <div class="sub-specs-grid">
            ${page.specs
              .map(
                (sp) => `
              <div class="sub-spec-card">
                <span class="sub-spec-label">${escapeHtml(this.t(sp.label))}</span>
                <strong class="sub-spec-value">${escapeHtml(this.t(sp.value))}</strong>
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      `
      : '';

    const highlightsList = this.t(page.highlights);
    const highlightsHtml = Array.isArray(highlightsList) && highlightsList.length
      ? `
        <section class="sub-section">
          <h3>${escapeHtml(this.ui('highlightsTitle'))}</h3>
          <ul class="sub-highlights-list">
            ${highlightsList.map((txt) => `<li>${escapeHtml(txt)}</li>`).join('')}
          </ul>
        </section>
      `
      : '';

    const modelsHtml = page.models?.length
      ? `
        <section class="sub-section">
          <h3>${escapeHtml(this.ui('modelsTitle'))}</h3>
          <div class="sub-models-grid">
            ${page.models
              .map(
                (m) => `
              <div class="sub-model-card">
                <div class="sub-model-head">
                  <h4>${escapeHtml(this.t(m.name))}</h4>
                  <span class="sub-model-price">${escapeHtml(this.t(m.price))}</span>
                </div>
                <div class="sub-model-meta">
                  <div><span>📐</span> ${escapeHtml(this.t(m.area))}</div>
                  <div><span>☀️</span> ${escapeHtml(this.t(m.solar))}</div>
                  <div><span>🔋</span> ${escapeHtml(this.t(m.battery))}</div>
                </div>
                <p>${escapeHtml(this.t(m.details))}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      `
      : '';

    const faqsHtml = page.faqs?.length
      ? `
        <section class="sub-section">
          <h3>${escapeHtml(this.ui('faqTitle'))}</h3>
          <div class="sub-faq-list">
            ${page.faqs
              .map(
                (f) => `
              <details class="sub-faq-item">
                <summary>${escapeHtml(this.t(f.q))}</summary>
                <p>${escapeHtml(this.t(f.a))}</p>
              </details>
            `
              )
              .join('')}
          </div>
        </section>
      `
      : '';

    const interactiveHtml = this.buildInteractiveHtml(page);
    const formHtml = page.formType ? this.buildFormHtml(page) : '';

    const actionsHtml = `
      <div class="sub-actions-row">
        ${
          page.pdfUrl
            ? `<a class="btn-primary sub-btn-link" href="${escapeHtml(page.pdfUrl)}" target="_blank" rel="noopener noreferrer">📄 ${escapeHtml(page.pdfLabel || this.ui('downloadPdf'))}</a>`
            : ''
        }
        ${
          page.quoteSubject
            ? `<a class="btn-secondary sub-btn-link" href="mailto:info@smart-city-led.com?subject=${encodeURIComponent(page.quoteSubject)}">✉️ ${escapeHtml(this.ui('requestQuote'))}</a>`
            : ''
        }
        ${
          page.links?.length
            ? page.links
                .map(
                  (lnk) =>
                    `<button type="button" class="btn-secondary" data-open-page="${escapeHtml(lnk.target)}">${escapeHtml(this.ui(lnk.labelKey))}</button>`
                )
                .join('')
            : ''
        }
      </div>
    `;

    this.subpageContent.innerHTML = `
      <div class="subpage-topbar">
        <button type="button" class="btn-back-3d" id="btn-back-to-3d">${escapeHtml(this.ui('backToHome3d'))}</button>
        ${category ? `<span class="subpage-cat-pill">${escapeHtml(this.t(category.label))}</span>` : ''}
      </div>

      ${
        siblingTabsHtml
          ? `
        <div class="subpage-cat-bar">
          <span class="subpage-cat-bar-label">${escapeHtml(this.ui('subpagesInCategory'))}</span>
          <div class="subpage-cat-tabs">${siblingTabsHtml}</div>
        </div>
      `
          : ''
      }

      <div class="subpage-hero">
        <span class="stage-badge">${escapeHtml(this.t(page.badge))}</span>
        <h1>${escapeHtml(this.t(page.title))}</h1>
        <p class="subpage-subtitle">${escapeHtml(this.t(page.subtitle))}</p>
        ${actionsHtml}
      </div>

      ${specsHtml}
      ${modelsHtml}
      ${highlightsHtml}
      ${interactiveHtml}
      ${faqsHtml}
      ${formHtml}
    `;

    this.bindSubpageEvents(page);
  }

  buildInteractiveHtml(page) {
    if (page.interactiveType === 'simultaneity') {
      return `
        <section class="sub-section sub-interactive-card">
          <h3>${escapeHtml(this.ui('simCalcTitle'))}</h3>
          <div class="calc-grid sub-calc-grid">
            <div class="calc-inputs">
              <div class="input-group">
                <label for="sim-pitches"><span>${escapeHtml(this.ui('simPitches'))}</span><span class="input-val" id="sim-pitches-val">80</span></label>
                <input id="sim-pitches" type="range" min="10" max="400" step="5" value="80" />
              </div>
              <div class="input-group">
                <label for="sim-power"><span>${escapeHtml(this.ui('simAcPower'))}</span><span class="input-val" id="sim-power-val">1100 W</span></label>
                <input id="sim-power" type="range" min="600" max="2200" step="100" value="1100" />
              </div>
              <div class="input-group">
                <label for="sim-factor"><span>${escapeHtml(this.ui('simFactor'))}</span><span class="input-val" id="sim-factor-val">65%</span></label>
                <input id="sim-factor" type="range" min="25" max="100" step="5" value="65" />
              </div>
              <div class="input-group">
                <label for="sim-grid"><span>${escapeHtml(this.ui('simGridAmps'))}</span><span class="input-val" id="sim-grid-val">42 kVA</span></label>
                <input id="sim-grid" type="range" min="12" max="250" step="6" value="42" />
              </div>
            </div>
            <div class="calc-outputs">
              <div class="calc-card">
                <span class="calc-card-label">${escapeHtml(this.ui('simResTotal'))}</span>
                <span class="calc-card-value" id="sim-res-total">57.2 kVA</span>
              </div>
              <div class="calc-card">
                <span class="calc-card-label">${escapeHtml(this.ui('simResSolar'))}</span>
                <span class="calc-card-value" id="sim-res-solar">18 kWc + 25 kWh</span>
              </div>
              <div class="calc-card" style="grid-column: 1 / -1;">
                <span class="calc-card-label">${escapeHtml(this.ui('simResStatus'))}</span>
                <span class="calc-card-value" id="sim-res-status" style="font-size:1.15rem;">+15.2 kVA Peak Offset Needed</span>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    if (page.interactiveType === 'rental') {
      return `
        <section class="sub-section sub-interactive-card">
          <h3>${escapeHtml(this.ui('campCalcTitle'))}</h3>
          <div class="calc-grid sub-calc-grid">
            <div class="calc-inputs">
              <div class="input-group">
                <label for="camp-units"><span>${escapeHtml(this.ui('campUnits'))}</span><span class="input-val" id="camp-units-val">25</span></label>
                <input id="camp-units" type="range" min="5" max="150" step="5" value="25" />
              </div>
              <div class="input-group">
                <label for="camp-weeks"><span>${escapeHtml(this.ui('campWeeks'))}</span><span class="input-val" id="camp-weeks-val">10</span></label>
                <input id="camp-weeks" type="range" min="4" max="20" step="1" value="10" />
              </div>
              <div class="input-group">
                <label for="camp-rate"><span>${escapeHtml(this.ui('campRate'))}</span><span class="input-val" id="camp-rate-val">€55</span></label>
                <input id="camp-rate" type="range" min="30" max="95" step="5" value="55" />
              </div>
            </div>
            <div class="calc-outputs">
              <div class="calc-card">
                <span class="calc-card-label">${escapeHtml(this.ui('campRevGross'))}</span>
                <span class="calc-card-value" id="camp-res-gross">€13,750</span>
              </div>
              <div class="calc-card">
                <span class="calc-card-label">${escapeHtml(this.ui('campRevCapex'))}</span>
                <span class="calc-card-value">€0</span>
              </div>
              <div class="calc-card" style="grid-column: 1 / -1;">
                <span class="calc-card-label">${escapeHtml(this.ui('campRevNet'))}</span>
                <span class="calc-card-value" id="camp-res-net">€5,500</span>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    if (page.interactiveType === 'blog') {
      if (this.activeBlogSlug) {
        const post = BLOG_POSTS.find((b) => b.slug === this.activeBlogSlug);
        if (post) {
          const articleContext = {
            en: [
              'Published by Smart City Led® / NEO® engineering team (serving France and Europe since 2015). Direct on-site solar generation combined with modular Magnelis ZM310 structures, ultra-light glass-free eArc modules, or off-grid DC EV charging protects municipalities and businesses from grid volatility.',
              'Looking to evaluate your parking lot under the APER/Huwart mandate, retrofit an existing carport without drilling, or deploy autonomous NEO® energy storage? Contact our engineering desk at info@smart-city-led.com or +33 (0)2 18 88 64 18 for a site-specific yield and ROI study.'
            ],
            fr: [
              'Article publié par l’équipe technique Smart City Led® / NEO® (créateur d’économies d’énergie depuis 2015). L’autoconsommation directe combinée aux ombrières modulaires Magnelis ZM310, aux modules composites ultra-légers eArc et aux bornes solaires DC permet de sécuriser durablement le coût du kWh.',
              'Vous souhaitez auditer un parking soumis à la loi APER/Huwart, équiper une toiture légère sans perçage ou chiffrer une solution NEO® ? Contactez notre bureau d’étude à info@smart-city-led.com ou au +33 (0)2 18 88 64 18.'
            ],
            bg: [
              'Публикувано от инженерния екип на Smart City Led® / NEO® (от 2015 г. във Франция и Европа). Комбинацията от собствено соларно производство, модулни конструкции Magnelis ZM310, ултралеки панели eArc и автономни DC зарядни станции защитава бизнеса и общините от високите цени на тока.',
              'За индивидуална техническа консултация и оценка на възвръщаемостта се свържете с нас на info@smart-city-led.com или +33 (0)2 18 88 64 18.'
            ],
            ro: [
              'Publicat de echipa tehnică Smart City Led® / NEO® (activă din 2015 în Franța și Europa). Producția solară proprie combinată cu structuri modulare Magnelis ZM310, module ultra-ușoare eArc și stații DC off-grid protejează companiile și municipalitățile împotriva volatilității tarifelor.',
              'Pentru un audit tehnic și calcul ROI personalizat, contactați echipa noastră la info@smart-city-led.com sau +33 (0)2 18 88 64 18.'
            ]
          };
          const extraParas = this.t(articleContext);
          return `
            <section class="sub-section sub-blog-reader">
              <button type="button" class="btn-secondary" id="btn-blog-back">${escapeHtml(this.ui('blogBackList'))}</button>
              <article class="sub-blog-article">
                <div class="sub-blog-meta">${escapeHtml(post.date)} · ${escapeHtml(post.author)}</div>
                <h2>${escapeHtml(this.t(post.title))}</h2>
                <p><strong>${escapeHtml(this.t(post.summary))}</strong></p>
                ${Array.isArray(extraParas) ? extraParas.map((txt) => `<p>${escapeHtml(txt)}</p>`).join('') : ''}
                <div class="sub-actions-row">
                  <button type="button" class="btn-secondary" data-open-page="neo-ombrieres-huwart">☀️ NEO® HUWART</button>
                  <button type="button" class="btn-secondary" data-open-page="ombriere-aper-recharge-dc">⚡ APER DC 80 kW</button>
                  <a class="btn-primary sub-btn-link" href="mailto:info@smart-city-led.com?subject=${encodeURIComponent(this.t(post.title))}">✉️ ${escapeHtml(this.ui('requestQuote'))}</a>
                </div>
              </article>
            </section>
          `;
        }
      }

      return `
        <section class="sub-section">
          <div class="sub-blog-grid">
            ${BLOG_POSTS.map(
              (post) => `
              <article class="sub-blog-card">
                <div class="sub-blog-meta">${escapeHtml(post.date)} · ${escapeHtml(post.author)}</div>
                <h4>${escapeHtml(this.t(post.title))}</h4>
                <p>${escapeHtml(this.t(post.summary))}</p>
                <button type="button" class="btn-secondary btn-sm" data-read-blog="${escapeHtml(post.slug)}">${escapeHtml(this.ui('blogReadMore'))}</button>
              </article>
            `
            ).join('')}
          </div>
        </section>
      `;
    }

    return '';
  }

  buildFormHtml(page) {
    return `
      <section class="sub-section sub-form-card">
        <h3>${escapeHtml(this.ui('requestQuote'))}</h3>
        <form id="subpage-inquiry-form" class="sub-form">
          <div class="sub-form-row">
            <label>
              <span>${escapeHtml(this.ui('formFirstName'))}</span>
              <input type="text" name="firstName" required />
            </label>
            <label>
              <span>${escapeHtml(this.ui('formLastName'))}</span>
              <input type="text" name="lastName" required />
            </label>
          </div>
          <div class="sub-form-row">
            <label>
              <span>${escapeHtml(this.ui('formEmail'))}</span>
              <input type="email" name="email" required />
            </label>
            <label>
              <span>${escapeHtml(this.ui('formPhone'))}</span>
              <input type="tel" name="phone" required />
            </label>
          </div>
          <label>
            <span>${escapeHtml(this.ui('formCompany'))}</span>
            <input type="text" name="company" />
          </label>
          <label>
            <span>${escapeHtml(this.ui('formMessage'))}</span>
            <textarea name="message" rows="3"></textarea>
          </label>
          <button type="submit" class="btn-primary">${escapeHtml(this.ui('formSend'))}</button>
          <div id="subpage-form-feedback" class="sub-form-feedback" hidden>
            <strong>${escapeHtml(this.ui('formSentTitle'))}</strong>
            <p>${escapeHtml(this.ui('formSentDesc'))}</p>
          </div>
        </form>
      </section>
    `;
  }

  bindSubpageEvents(page) {
    document.getElementById('btn-back-to-3d')?.addEventListener('click', () => {
      this.closeSubpage();
    });

    this.subpageContent.querySelectorAll('[data-open-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.openPage(btn.getAttribute('data-open-page'));
      });
    });

    this.subpageContent.querySelectorAll('[data-read-blog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeBlogSlug = btn.getAttribute('data-read-blog');
        this.renderSubpage('blog');
      });
    });

    document.getElementById('btn-blog-back')?.addEventListener('click', () => {
      this.activeBlogSlug = null;
      this.renderSubpage('blog');
    });

    if (page.interactiveType === 'simultaneity') {
      const pEl = document.getElementById('sim-pitches');
      const wEl = document.getElementById('sim-power');
      const fEl = document.getElementById('sim-factor');
      const gEl = document.getElementById('sim-grid');

      const updateSim = () => {
        const pitches = Number(pEl.value);
        const watts = Number(wEl.value);
        const factor = Number(fEl.value) / 100;
        const gridKva = Number(gEl.value);

        document.getElementById('sim-pitches-val').textContent = `${pitches}`;
        document.getElementById('sim-power-val').textContent = `${watts} W`;
        document.getElementById('sim-factor-val').textContent = `${Math.round(factor * 100)}%`;
        document.getElementById('sim-grid-val').textContent = `${gridKva} kVA`;

        const peakKva = (pitches * watts * factor) / 1000;
        const deficit = Math.max(0, peakKva - gridKva);
        const recSolar = Math.ceil(deficit * 1.15);
        const recBat = Math.ceil(deficit * 1.6);

        document.getElementById('sim-res-total').textContent = `${peakKva.toFixed(1)} kVA`;
        document.getElementById('sim-res-solar').textContent =
          deficit > 0 ? `${recSolar} kWc + ${recBat} kWh` : '0 kWc (OK)';
        document.getElementById('sim-res-status').textContent =
          deficit > 0 ? `+${deficit.toFixed(1)} kVA Solar Buffer Needed` : 'Grid Capacity OK';
      };
      [pEl, wEl, fEl, gEl].forEach((el) => el?.addEventListener('input', updateSim));
      updateSim();
    }

    if (page.interactiveType === 'rental') {
      const uEl = document.getElementById('camp-units');
      const wEl = document.getElementById('camp-weeks');
      const rEl = document.getElementById('camp-rate');

      const updateCamp = () => {
        const units = Number(uEl.value);
        const weeks = Number(wEl.value);
        const rate = Number(rEl.value);

        document.getElementById('camp-units-val').textContent = `${units}`;
        document.getElementById('camp-weeks-val').textContent = `${weeks}`;
        document.getElementById('camp-rate-val').textContent = `€${rate}`;

        const gross = units * weeks * rate;
        const net = Math.round(gross * 0.4);
        document.getElementById('camp-res-gross').textContent = `€${gross.toLocaleString()}`;
        document.getElementById('camp-res-net').textContent = `€${net.toLocaleString()}`;
      };
      [uEl, wEl, rEl].forEach((el) => el?.addEventListener('input', updateCamp));
      updateCamp();
    }

    const form = document.getElementById('subpage-inquiry-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const subject = page.quoteSubject || this.t(page.title);
      const bodyLines = [
        `Name: ${data.get('firstName')} ${data.get('lastName')}`,
        `Email: ${data.get('email')}`,
        `Phone: ${data.get('phone')}`,
        `Company: ${data.get('company') || '-'}`,
        `Message: ${data.get('message') || '-'}`
      ].join('\n');

      const mailto = `mailto:info@smart-city-led.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;
      const feedback = document.getElementById('subpage-form-feedback');
      if (feedback) {
        feedback.hidden = false;
      }
      window.location.href = mailto;
    });
  }
}
