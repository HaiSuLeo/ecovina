/* ============================================
   ECOVINA – SCRIPT.JS
   Navbar | Products từ JSON | Modal Slide Carousel | Filter | Form | Animations
   ============================================ */

'use strict';

// ============================================================
// 1. NAVBAR – scroll + mobile toggle
// ============================================================
(function initNavbar() {
  var navbar = document.getElementById('navbar');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }
})();

// ============================================================
// 2. SMOOTH SCROLL cho anchor links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  });
});

// ============================================================
// 3. LOAD SẢN PHẨM TỪ products.json & RENDER
// ============================================================
var allProducts = [];
var currentCat = 'all';

function renderProductCard(product) {
  var imgStyle = product.imageStyle ? ' style="' + product.imageStyle + '"' : '';
  var countBadge = (product.details && product.details.products)
    ? '<span class="prod-item-count">' + product.details.products.length + ' mẫu</span>'
    : '';

  return (
    '<div class="product-card" data-cat="' + product.category + '" data-id="' + product.id + '" tabindex="0" role="button" aria-label="Xem chi tiết ' + product.name + '">' +
      '<div class="prod-img-wrap">' +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy"' + imgStyle + '/>' +
        '<div class="prod-cat-badge">' + product.categoryLabel + '</div>' +
        countBadge +
        '<div class="prod-view-hint">🔍 Xem ' + (product.details ? product.details.products.length : '') + ' mẫu sản phẩm (Slide) →</div>' +
      '</div>' +
      '<div class="prod-info">' +
        '<h3>' + product.name + '</h3>' +
        '<p>' + product.shortDesc + '</p>' +
        '<div class="prod-features">' +
          product.features.map(function (f) { return '<span>' + f + '</span>'; }).join('') +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function filterAndRender(cat) {
  currentCat = cat;
  var grid = document.getElementById('productsGrid');
  if (!grid) return;

  var filtered = cat === 'all'
    ? allProducts
    : allProducts.filter(function (p) { return p.category === cat; });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>Không có sản phẩm trong danh mục này.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(renderProductCard).join('');

  // Attach click & keyboard events
  grid.querySelectorAll('.product-card').forEach(function (card) {
    card.addEventListener('click', function () {
      openModal(card.getAttribute('data-id'));
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.getAttribute('data-id'));
      }
    });
  });

  // Scroll-in animation
  observeCards();
}

function loadProducts() {
  fetch('products.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
      return res.json();
    })
    .then(function (data) {
      allProducts = data;
      filterAndRender('all');
    })
    .catch(function (err) {
      var grid = document.getElementById('productsGrid');
      if (grid) {
        grid.innerHTML = '<div class="empty-state" style="color:red;padding:40px;text-align:center;">' +
          '<p>⚠️ ' + err.message + '</p>' +
          '<p style="font-size:0.8rem;margin-top:8px;">Hãy mở trang qua server (npm run dev), không mở trực tiếp file.</p>' +
          '</div>';
      }
      console.error(err);
    });
}

// ============================================================
// 4. CATEGORY FILTER TABS
// ============================================================
(function initTabs() {
  var tabsContainer = document.getElementById('categoryTabs');
  if (!tabsContainer) return;

  tabsContainer.querySelectorAll('.tab-btn').forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabsContainer.querySelectorAll('.tab-btn').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      filterAndRender(tab.getAttribute('data-cat'));
    });
  });
})();

// ============================================================
// 5. MODAL SLIDE / CAROUSEL – Chi tiết từng sản phẩm
// ============================================================
var modalOverlay   = document.getElementById('modalOverlay');
var modalInner     = document.getElementById('modalInner');
var modalClose     = document.getElementById('modalClose');
var activeProduct  = null;
var activeSlideIdx = 0;

function openModal(productId) {
  activeProduct = allProducts.find(function (p) { return p.id === productId; });
  if (!activeProduct || !modalOverlay || !modalInner) return;

  activeSlideIdx = 0;
  buildModalDOM(activeProduct);
  updateSlideView(0);

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  setTimeout(function () {
    if (modalClose) modalClose.focus();
  }, 50);
}

function buildModalDOM(product) {
  var d = product.details;
  var items = d.products || [];
  var total = items.length;

  // Quick navigation pill tabs
  var pillTabsHtml = items.map(function (item, idx) {
    return '<button class="slide-pill' + (idx === 0 ? ' active' : '') + '" data-slide-to="' + idx + '" id="pill-' + idx + '">' +
      '<span class="pill-num">' + (idx + 1) + '</span> ' + item.name +
    '</button>';
  }).join('');

  // Dots indicator
  var dotsHtml = items.map(function (_, idx) {
    return '<button class="slide-dot' + (idx === 0 ? ' active' : '') + '" data-slide-to="' + idx + '" id="dot-' + idx + '" aria-label="Đến mẫu ' + (idx + 1) + '"></button>';
  }).join('');

  // Highlights list
  var highlightsHtml = d.highlights.map(function (h) {
    return (
      '<div class="modal-highlight-item">' +
        '<span class="modal-highlight-icon">✓</span>' +
        '<span>' + h + '</span>' +
      '</div>'
    );
  }).join('');

  // Build shell once
  modalInner.innerHTML =
    '<div class="modal-header-bar">' +
      '<div class="modal-header-left">' +
        '<span class="modal-cat-tag">' + product.categoryLabel + '</span>' +
        '<h2 class="modal-main-title">' + product.name + '</h2>' +
      '</div>' +
      '<div class="slide-counter-badge">' +
        'Mẫu <span class="cur-num" id="slideCurNum">1</span> / ' + total +
      '</div>' +
    '</div>' +

    // Quick selector horizontal scroll
    (total > 1 ? '<div class="slide-pills-bar" id="slidePillsBar">' + pillTabsHtml + '</div>' : '') +

    // Main Showcase Stage
    '<div class="slide-stage">' +
      '<div class="slide-visual-col">' +
        '<div class="slide-img-container" id="slideImgContainer" title="Bấm để phóng to xem ảnh chi tiết" tabindex="0" role="button" aria-label="Phóng to ảnh">' +
          '<img src="" alt="" class="slide-main-img" id="slideMainImg"/>' +
          '<div class="slide-img-tag" id="slideImgTag">Mẫu 1 / ' + total + '</div>' +
          '<div class="slide-zoom-hint">🔍 Bấm để xem ảnh lớn</div>' +
        '</div>' +
        // Navigation buttons on image
        (total > 1 ?
          '<div class="slide-nav-arrows">' +
            '<button class="slide-arrow prev" id="slidePrevBtn" aria-label="Mẫu trước">❮</button>' +
            '<button class="slide-arrow next" id="slideNextBtn" aria-label="Mẫu tiếp theo">❯</button>' +
          '</div>' : '') +
      '</div>' +

      '<div class="slide-info-col">' +
        '<div class="slide-item-card">' +
          '<div class="slide-item-header">' +
            '<span class="slide-item-idx" id="slideItemIdx">#01</span>' +
            '<h3 class="slide-item-name" id="slideItemName"></h3>' +
          '</div>' +
          '<div class="slide-item-desc" id="slideItemDesc"></div>' +
          '<div class="slide-item-actions">' +
            '<button class="btn btn-primary btn-sm" id="btnConsultThis">' +
              '💬 Tư vấn & Báo giá mẫu này' +
            '</button>' +
            '<a href="tel:0943195687" class="btn btn-outline-dark btn-sm">📞 Hotline 0943 195 687</a>' +
          '</div>' +
        '</div>' +

        // Group Highlights
        '<div class="slide-group-info">' +
          '<div class="slide-info-subtitle">Ưu điểm nổi bật nhóm sản phẩm</div>' +
          '<div class="modal-highlights">' + highlightsHtml + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Clean Footer with Dots & Contact Note
    '<div class="modal-footer">' +
      '<p class="modal-contact-note">💡 ' + d.contact + '</p>' +
      (total > 1 ? '<div class="slide-dots-wrap">' + dotsHtml + '</div>' : '') +
    '</div>';

  // Attach event listeners to modal shell
  attachModalEvents();
}

function updateSlideView(idx) {
  if (!activeProduct || !activeProduct.details.products) return;
  var items = activeProduct.details.products;
  var total = items.length;
  var item = items[idx] || { name: activeProduct.name, desc: '' };
  var itemImage = item.image || activeProduct.image;

  // 1. Update text & numbers
  var curNumEl = document.getElementById('slideCurNum');
  if (curNumEl) curNumEl.textContent = idx + 1;

  var imgTagEl = document.getElementById('slideImgTag');
  if (imgTagEl) imgTagEl.textContent = 'Mẫu ' + (idx + 1) + ' / ' + total;

  var itemIdxEl = document.getElementById('slideItemIdx');
  if (itemIdxEl) itemIdxEl.textContent = '#' + (idx + 1 < 10 ? '0' : '') + (idx + 1);

  var itemNameEl = document.getElementById('slideItemName');
  if (itemNameEl) itemNameEl.textContent = item.name;

  var itemDescEl = document.getElementById('slideItemDesc');
  if (itemDescEl) itemDescEl.innerHTML = formatItemDescription(item.desc);

  // 2. Smoothly update image
  var mainImg = document.getElementById('slideMainImg');
  if (mainImg) {
    if (mainImg.src !== itemImage) {
      mainImg.style.opacity = '0.4';
      mainImg.src = itemImage;
      mainImg.alt = item.name;
      mainImg.onload = function () {
        mainImg.style.opacity = '1';
      };
    }
  }

  // 3. Update active pill
  var pillsBar = document.getElementById('slidePillsBar');
  if (pillsBar) {
    pillsBar.querySelectorAll('.slide-pill').forEach(function (p, pIdx) {
      p.classList.toggle('active', pIdx === idx);
    });
    var activePill = document.getElementById('pill-' + idx);
    if (activePill && activePill.scrollIntoView) {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // 4. Update active dot
  var dotsWrap = document.querySelector('.slide-dots-wrap');
  if (dotsWrap) {
    dotsWrap.querySelectorAll('.slide-dot').forEach(function (d, dIdx) {
      d.classList.toggle('active', dIdx === idx);
    });
  }

  // 5. Update Consult button dataset
  var consultBtn = document.getElementById('btnConsultThis');
  if (consultBtn) consultBtn.setAttribute('data-item-name', item.name);

  // 6. Synchronize Lightbox if open
  if (lightboxOverlay && lightboxOverlay.classList.contains('open')) {
    openLightbox(
      itemImage,
      activeProduct.name + ' – ' + item.name,
      'Mẫu ' + (idx + 1) + ' / ' + total
    );
  }
}

// Format specs string with pipes | into nice bullet points
function formatItemDescription(desc) {
  if (!desc) return '';
  if (desc.indexOf('|') !== -1) {
    var parts = desc.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    return '<ul class="slide-specs-list">' +
      parts.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
    '</ul>';
  }
  return '<p>' + desc + '</p>';
}

function attachModalEvents() {
  // Pill button clicks
  document.querySelectorAll('.slide-pill[data-slide-to], .slide-dot[data-slide-to]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-slide-to'), 10);
      goToSlide(idx);
    });
  });

  // Prev / Next button clicks on visual image
  var prevBtn = document.getElementById('slidePrevBtn');
  var nextBtn = document.getElementById('slideNextBtn');

  if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(activeSlideIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(activeSlideIdx + 1); });

  // Lightbox click to zoom
  var imgContainer = document.getElementById('slideImgContainer');
  if (imgContainer) {
    imgContainer.addEventListener('click', function () {
      if (!activeProduct || !activeProduct.details.products) return;
      var item = activeProduct.details.products[activeSlideIdx] || {};
      var img = item.image || activeProduct.image;
      openLightbox(img, activeProduct.name + ' – ' + (item.name || ''));
    });
    imgContainer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!activeProduct || !activeProduct.details.products) return;
        var item = activeProduct.details.products[activeSlideIdx] || {};
        var img = item.image || activeProduct.image;
        openLightbox(img, activeProduct.name + ' – ' + (item.name || ''));
      }
    });
  }

  // Quick Consult this item button
  var consultBtn = document.getElementById('btnConsultThis');
  if (consultBtn) {
    consultBtn.addEventListener('click', function () {
      var name = consultBtn.getAttribute('data-item-name') || '';
      var messageField = document.getElementById('message');
      if (messageField && activeProduct) {
        messageField.value = 'Tôi quan tâm đến: ' + activeProduct.name + ' - Mẫu: ' + name + '.\nVui lòng tư vấn báo giá và số lượng.';
      }

      // Tự động chọn nhóm sản phẩm tương ứng trong dropdown
      var productSelect = document.getElementById('product');
      if (productSelect && activeProduct) {
        selectProductOption(productSelect, activeProduct.name, activeProduct.categoryLabel);
      }

      closeModal();
      var contactSection = document.getElementById('contact');
      if (contactSection) {
        var top = contactSection.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
        setTimeout(function () {
          var nameInput = document.getElementById('name');
          if (nameInput) nameInput.focus();
        }, 300);
      }
    });
  }
}

function selectProductOption(selectEl, prodName, catLabel) {
  if (!selectEl) return;
  var norm = function (s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  var targetNorm = norm(prodName);
  var catNorm = norm(catLabel);
  var matchedIdx = 0;

  for (var i = 1; i < selectEl.options.length; i++) {
    var opt = selectEl.options[i];
    var optValNorm = norm(opt.value);
    var optTextNorm = norm(opt.text);

    if (optValNorm === targetNorm || optTextNorm === targetNorm) {
      matchedIdx = i;
      break;
    }
    if (optValNorm && targetNorm.indexOf(optValNorm) !== -1) {
      matchedIdx = i;
      break;
    }
    if (optTextNorm.indexOf(targetNorm) !== -1 || targetNorm.indexOf(optTextNorm) !== -1) {
      matchedIdx = i;
      break;
    }
  }

  // If still not matched, try matching category label
  if (matchedIdx === 0 && catNorm) {
    for (var j = 1; j < selectEl.options.length; j++) {
      var optText = norm(selectEl.options[j].text);
      if (optText.indexOf(catNorm) !== -1) {
        matchedIdx = j;
        break;
      }
    }
  }

  if (matchedIdx > 0) {
    selectEl.selectedIndex = matchedIdx;
    selectEl.style.borderColor = 'var(--green-500)';
    selectEl.style.boxShadow = '0 0 0 3px rgba(39, 160, 92, 0.2)';
    setTimeout(function () {
      selectEl.style.borderColor = '';
      selectEl.style.boxShadow = '';
    }, 2000);
  }
}

function goToSlide(newIdx) {
  if (!activeProduct || !activeProduct.details.products) return;
  var total = activeProduct.details.products.length;
  if (newIdx < 0) newIdx = total - 1;
  if (newIdx >= total) newIdx = 0;

  activeSlideIdx = newIdx;
  updateSlideView(newIdx);
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  activeProduct = null;
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });
}

// ============================================================
// 5B. LIGHTBOX IMAGE VIEWER & NAVIGATION
// ============================================================
var lightboxOverlay = document.getElementById('lightboxOverlay');
var lightboxImg     = document.getElementById('lightboxImg');
var lightboxCaption = document.getElementById('lightboxCaption');
var lightboxCounter = document.getElementById('lightboxCounter');
var lightboxClose   = document.getElementById('lightboxClose');
var lightboxPrev    = document.getElementById('lightboxPrev');
var lightboxNext    = document.getElementById('lightboxNext');

function openLightbox(src, caption, counterText) {
  if (!lightboxOverlay || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = caption || 'Chi tiết sản phẩm';
  if (lightboxCaption) lightboxCaption.textContent = caption || '';
  if (lightboxCounter) {
    var total = (activeProduct && activeProduct.details.products) ? activeProduct.details.products.length : 1;
    lightboxCounter.textContent = counterText || ('Mẫu ' + (activeSlideIdx + 1) + ' / ' + total);
  }
  lightboxOverlay.classList.add('open');
}

function closeLightbox() {
  if (!lightboxOverlay) return;
  lightboxOverlay.classList.remove('open');
  setTimeout(function () {
    if (lightboxOverlay && !lightboxOverlay.classList.contains('open') && lightboxImg) {
      lightboxImg.src = '';
    }
  }, 350);
}

if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    goToSlide(activeSlideIdx - 1);
  });
}

if (lightboxNext) {
  lightboxNext.addEventListener('click', function (e) {
    e.stopPropagation();
    goToSlide(activeSlideIdx + 1);
  });
}

if (lightboxOverlay) {
  lightboxOverlay.addEventListener('click', function (e) {
    if (e.target === lightboxOverlay) closeLightbox();
  });
}

// Keyboard navigation (Escape to close, ArrowLeft / ArrowRight to slide)
document.addEventListener('keydown', function (e) {
  // Khi đang bật Lightbox phóng to
  if (lightboxOverlay && lightboxOverlay.classList.contains('open')) {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToSlide(activeSlideIdx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToSlide(activeSlideIdx + 1);
    }
    return;
  }

  // Khi đang bật Popup chi tiết sản phẩm
  if (!modalOverlay || !modalOverlay.classList.contains('open')) return;

  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    goToSlide(activeSlideIdx - 1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    goToSlide(activeSlideIdx + 1);
  }
});

// ============================================================
// 6. SCROLL TO TOP
// ============================================================
(function initScrollTop() {
  var btn = document.getElementById('scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ============================================================
// 7. CONTACT FORM
// ============================================================
(function initContactForm() {
  var form = document.getElementById('contactForm');
  var successMsg = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('submitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }

    setTimeout(function () {
      form.style.display = 'none';
      if (successMsg) successMsg.style.display = 'block';
    }, 1200);
  });
})();

// ============================================================
// 8. INTERSECTION OBSERVER – animate on scroll
// ============================================================
function observeCards() {
  if (!('IntersectionObserver' in window)) return;

  var cards = document.querySelectorAll(
    '.product-card, .value-card, .solution-card, .why-card'
  );

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(function (el) {
    if (!el.classList.contains('visible')) {
      observer.observe(el);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  observeCards();
});

// ============================================================
// 9. HERO COUNTER ANIMATION
// ============================================================
(function initCounters() {
  var observed = false;
  var statsEl = document.querySelector('.hero-stats');
  if (!statsEl || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && !observed) {
      observed = true;

      document.querySelectorAll('.stat-num[data-target]').forEach(function (el) {
        var target  = parseInt(el.getAttribute('data-target'), 10);
        var suffix  = el.getAttribute('data-suffix') || '';
        var dur     = 1200;
        var t0      = null;

        function step(ts) {
          if (!t0) t0 = ts;
          var prog = Math.min((ts - t0) / dur, 1);
          var ease = 1 - Math.pow(1 - prog, 3);
          el.textContent = Math.floor(ease * target) + suffix;
          if (prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
  }, { threshold: 0.5 });

  observer.observe(statsEl);
})();

// ============================================================
// 10. KHỞI ĐỘNG – tải sản phẩm từ JSON
// ============================================================
loadProducts();
