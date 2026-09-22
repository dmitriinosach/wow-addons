// Лендинг howToPlay. Живая на странице одна вещь — карусель по классам.
// Библиотек нет: страница должна открываться и без сети.

// Ссылки собраны в одном месте. Пока строка пустая, кнопка сама становится
// неактивной — так на странице не бывает ссылок в никуда.
const LINKS = {
    'guide-download': '',
    discord: 'https://discord.gg/CYnxS6R9qY',
    repo: '',
    issues: '',
    donate: '',
};

for (const [key, url] of Object.entries(LINKS)) {
    for (const el of document.querySelectorAll(`[data-link="${key}"]`)) {
        if (!url) {
            el.setAttribute('aria-disabled', 'true');
            el.removeAttribute('href');

            continue;
        }

        el.href = url;
    }
}

// --- карусель по классам -----------------------------------------------------
// Слайды лежат в разметке, а не собираются здесь: их правят вместе с текстом.
// Скрипт только переключает и рисует точки.

// --- снимки, которых ещё нет ---------------------------------------------------
// Кадра может не быть: страница пишется раньше, чем игра снята в клиенте. Пустая
// ниша с подписью, что тут будет, честнее битой картинки — и сразу видно, чего
// не хватает. Живёт снаружи карусели: ниши есть на всех страницах, слайды — нет.

for (const img of document.querySelectorAll('.hero-art img, .shot img')) {
    const miss = () => img.closest('figure').classList.add('is-empty');

    img.addEventListener('error', miss);
    if (img.complete && !img.naturalWidth) miss();
}

const slides = [...document.querySelectorAll('.slide')];

if (slides.length) {
    const dots = document.querySelector('.tour__dots');
    let at = 0;

    function show(i) {
        at = (i + slides.length) % slides.length;

        slides.forEach((s, n) => { s.hidden = n !== at; });

        [...dots.children].forEach((d, n) => {
            d.classList.toggle('is-on', n === at);
            d.setAttribute('aria-selected', String(n === at));
        });
    }

    slides.forEach((s, n) => {
        const dot = document.createElement('button');

        dot.className = 'tour__dot';
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', s.dataset.class);
        dot.addEventListener('click', () => show(n));
        dots.append(dot);
    });

    document.querySelector('[data-tour="prev"]').addEventListener('click', () => show(at - 1));
    document.querySelector('[data-tour="next"]').addEventListener('click', () => show(at + 1));

    document.querySelector('.tour').addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;

        e.preventDefault();
        show(at + step);
    });

    show(0);
}

// --- просмотр снимка ---------------------------------------------------------
// Снимок открывался новой вкладкой и уводил со страницы. Теперь — в <dialog>
// поверх неё. Листаются только соседи по одному ряду: кадры игр между собой,
// а не вперемешку со снимком из другого раздела.

const zoomLinks = [...document.querySelectorAll('.shot a, .frame a')];

// Подписи кнопок живут здесь, а не в разметке: диалог собирается скриптом.
const ZOOM_TEXT = document.documentElement.lang === 'en'
    ? { prev: 'Previous screenshot', next: 'Next screenshot', close: 'Close' }
    : { prev: 'Предыдущий снимок', next: 'Следующий снимок', close: 'Закрыть' };

if (zoomLinks.length && 'showModal' in HTMLDialogElement.prototype) {
    const dlg = document.createElement('dialog');

    dlg.className = 'zoom';
    dlg.innerHTML = `
        <div class="zoom__body">
            <img class="zoom__img" alt="">
            <p class="zoom__cap"></p>
        </div>
        <button class="zoom__btn zoom__btn--prev" type="button" aria-label="${ZOOM_TEXT.prev}">←</button>
        <button class="zoom__btn zoom__btn--next" type="button" aria-label="${ZOOM_TEXT.next}">→</button>
        <button class="zoom__btn zoom__btn--close" type="button" aria-label="${ZOOM_TEXT.close}">✕</button>`;
    document.body.append(dlg);

    const img = dlg.querySelector('.zoom__img');
    const cap = dlg.querySelector('.zoom__cap');
    const prev = dlg.querySelector('.zoom__btn--prev');
    const next = dlg.querySelector('.zoom__btn--next');
    let group = [];
    let at = 0;

    function show(i) {
        at = (i + group.length) % group.length;

        const link = group[at];
        const fig = link.closest('figure');

        img.src = link.href;
        img.alt = link.querySelector('img').alt;
        cap.textContent = fig.classList.contains('frame') ? fig.querySelector('figcaption').textContent : '';
    }

    for (const link of zoomLinks) {
        link.addEventListener('click', (e) => {
            // Снимка нет — ниша пустая, открывать нечего.
            if (link.closest('figure').classList.contains('is-empty')) return;
            if (e.ctrlKey || e.metaKey || e.shiftKey) return;

            e.preventDefault();

            const row = link.closest('.frames');

            group = row ? [...row.querySelectorAll('a')] : [link];
            prev.hidden = next.hidden = group.length < 2;
            show(group.indexOf(link));
            dlg.showModal();
        });
    }

    prev.addEventListener('click', () => show(at - 1));
    next.addEventListener('click', () => show(at + 1));
    dlg.querySelector('.zoom__btn--close').addEventListener('click', () => dlg.close());

    // Щелчок мимо картинки закрывает; по самой картинке — нет.
    dlg.querySelector('.zoom__body').addEventListener('click', (e) => {
        if (e.target !== img) dlg.close();
    });

    dlg.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step || group.length < 2) return;

        e.preventDefault();
        show(at + step);
    });

    dlg.addEventListener('close', () => { img.removeAttribute('src'); });
}
