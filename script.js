// Data Source
const projectsData = [
    {
        id: 0,
        title: 'E-Commerce Web App (React)',
        images: [
            './picture/project/eCommerceReact.webp'
        ], 
        description: 'A comprehensive e-commerce solution built with React. Features include sign in & sign up, product catalog, shopping cart, and order management.',
        longDescription: 'E-commerce web application built with React and TypeScript, featuring a product catalog, shopping cart, and purchase history. Includes AI-based product search that returns the 3 most relevant products using a Hugging Face Indonesian embedding model and vector search in MySQL, with all business logic exposed via Go APIs. Although this is a group project, I do almost all the work for the React front-end and connecting front-end with the Golang backend APIs.',
        technologies: ['React', 'TypeScript', 'Golang', 'Redux', 'REST APIs', 'Postman', 'MySQL', 'PHP MyAdmin', 'Railway', 'Vercel'],
        link: 'https://github.com/gunawanbinus/digiberkat/tree/main/front-end'
    },
    {
        id: 1,
        title: 'Web for Admin E-Commerce (Laravel)',
        images: [
            './picture/project/eCommerceAdminLaravel.webp',
            './picture/project/eCommerceAdminLaravel-1.webp'
        ],
        description: 'Interactive e-commerce admin dashboard with CRUD for products, categories, and employees, restock & order evaluation, and QR scanning via camera.',
        longDescription: 'An e-commerce administration system designed to streamline store operations. It provides full CRUD modules for products, categories, and employees, supports restock and order evaluation, and enables fast verification through integrated QR code scanning using the device camera. During product creation, the system can request AI (Qwen2.5-VL-7B-Instruct, Hugging Face API) to automatically generate product descriptions based on the product name to reduce manual input time. I worked on: sign-in/sign-up authentication, role-based routes, QR scanning using the camera, and AI integration.',
        technologies: ['Laravel', 'Bootstrap 5', 'REST APIs', 'Postman', 'Golang', 'Vercel', 'MySQL', 'PHP MyAdmin', 'Railway'],
        link: 'https://github.com/gunawanbinus/digiberkat/tree/main/web-admin'
    },
    {
        id: 2,
        title: 'Tourism Platform — Desa Wisata Wringinanom',
        images: [
            './picture/project/Laravel-pioneer.webp',
            './picture/project/Laravel-pioneer-1.webp'
        ],
        description: 'A digital platform created to introduce Wringinanom Village is culture, attractions, and tourism experiences to visitors.',
        longDescription: 'This website was developed to support the tourism growth of Desa Wisata Wringinanom by providing an online hub where visitors can explore cultural activities, local heritage, and places to visit. The project was built collaboratively as part of a community initiative and focused on combining modern web design with traditional visual elements to represent the village identity. I joined as a volunteer front-end developer during Semester 2 and was responsible for creating the news catalog and article page using HTML, CSS, and JavaScript, as well as assisting with the integration of front-end layouts to the back-end system.',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        link: 'https://github.com/LukasMystic/Project-Wringinanom'
    }
];

// --- Configuration ---
const PLACEHOLDER_IMG = './picture/project/placeholder.webp';
const LOADING_TIMEOUT_MS = 5000;

// --- Globals for Window Management ---
let highestZIndex = 100;
let isDragging = false;
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    generateProjectCards();
    initNavbar();
    initContactModal();
    initGlobalDragListeners();
    initResizeListener();
    initZoomFeature(); // Initialize Zoom System
});

// --- 1. Generate Project Cards ---
function generateProjectCards() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    container.innerHTML = projectsData.map(project => `
        <div class="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 shadow-lg cursor-pointer" 
             onclick="openProjectWindow(${project.id})">
            <div class="h-48 overflow-hidden relative bg-gray-900">
                <img src="${project.images[0]}" 
                     alt="${project.title}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                     onerror="this.src='${PLACEHOLDER_IMG}'">
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400">${project.title}</h3>
                <p class="text-gray-400 text-sm line-clamp-2 mb-4">${project.description}</p>
                <div class="flex flex-wrap gap-2">
                    ${project.technologies.slice(0, 3).map(tech => 
                        `<span class="text-xs bg-gray-900 text-blue-300 px-2 py-1 rounded border border-gray-700">${tech}</span>`
                    ).join('')}
                    ${project.technologies.length > 3 ? `<span class="text-xs text-gray-500 px-2 py-1">+${project.technologies.length - 3}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// --- 2. Image Loading Logic ---
function safeLoadImage(imgElement, targetUrl) {
    if (!imgElement) return;

    imgElement.style.opacity = '0.3';
    imgElement.style.transition = 'opacity 0.3s ease';
    
    let isResolved = false;
    const tempImg = new Image();

    const finalize = (finalSrc) => {
        if (isResolved) return;
        isResolved = true;
        imgElement.src = finalSrc;
        imgElement.style.opacity = '1';
    };

    const timer = setTimeout(() => {
        console.warn(`Image timeout: ${targetUrl}`);
        finalize(PLACEHOLDER_IMG);
    }, LOADING_TIMEOUT_MS);

    tempImg.onload = () => {
        clearTimeout(timer);
        finalize(targetUrl);
    };

    tempImg.onerror = () => {
        clearTimeout(timer);
        finalize(PLACEHOLDER_IMG);
    };

    tempImg.src = targetUrl;
}

// --- 3. ZOOM FEATURE IMPLEMENTATION ---

function initZoomFeature() {
    // 1. Inject Styles for Overlay
    const style = document.createElement('style');
    style.textContent = `
        #zoom-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0, 0, 0, 0.95);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
            backdrop-filter: blur(5px);
        }
        #zoom-overlay.active { opacity: 1; pointer-events: auto; }
        #zoom-img {
            max-width: 95vw; max-height: 95vh;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
            transform: scale(0.95); transition: transform 0.3s ease;
        }
        #zoom-overlay.active #zoom-img { transform: scale(1); }
        #zoom-close {
            position: absolute; top: 20px; right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none; color: white; font-size: 24px;
            width: 44px; height: 44px; border-radius: 50%;
            cursor: pointer; transition: background 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        #zoom-close:hover { background: rgba(255, 255, 255, 0.4); }
    `;
    document.head.appendChild(style);

    // 2. Create Overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'zoom-overlay';
    overlay.innerHTML = `
        <button id="zoom-close"><i class="fas fa-times"></i></button>
        <img id="zoom-img" src="" alt="Zoomed Image">
    `;
    document.body.appendChild(overlay);

    // 3. Add Event Listeners
    overlay.addEventListener('click', (e) => {
        // Close if clicking background or close button
        if (e.target === overlay || e.target.closest('#zoom-close')) {
            closeZoom();
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeZoom();
    });
}

function openZoom(imageSrc) {
    const overlay = document.getElementById('zoom-overlay');
    const zoomImg = document.getElementById('zoom-img');
    if (!overlay || !zoomImg) return;

    zoomImg.src = imageSrc;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling background
}

function closeZoom() {
    const overlay = document.getElementById('zoom-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}


// --- 4. Window Widget Logic ---

function openProjectWindow(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const isMobile = window.innerWidth < 768;
    const windowId = `window-${Date.now()}`;
    const zIndex = ++highestZIndex;
    const modeClass = isMobile ? 'fullscreen-mode' : 'desktop-mode';
    const offset = document.querySelectorAll('.mac-window').length * 30 + 50;
    let initialStyle = !isMobile ? `top: ${Math.min(offset, window.innerHeight - 400)}px; left: ${Math.min(offset, window.innerWidth - 400)}px;` : '';

    const hasMultipleImages = project.images.length > 1;
    
    const carouselButtonsHTML = hasMultipleImages ? `
        <button onclick="changeSlide('${windowId}', ${projectId}, -1); event.stopPropagation();" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm z-10 cursor-pointer select-none">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button onclick="changeSlide('${windowId}', ${projectId}, 1); event.stopPropagation();" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm z-10 cursor-pointer select-none">
            <i class="fas fa-chevron-right"></i>
        </button>
    ` : '';

    const windowHTML = `
        <div id="${windowId}" class="mac-window ${modeClass}" style="z-index: ${zIndex}; ${initialStyle}" onclick="bringToFront('${windowId}')">
            <div class="window-header" onmousedown="startDrag(event, '${windowId}')">
                <div class="text-gray-400 text-sm font-medium select-none mx-auto pr-14 truncate max-w-[200px]">
                    ${project.title}
                </div>
                <div class="window-controls">
                    <button class="mac-btn minimize" title="Minimize"></button>
                    <button class="mac-btn maximize" onclick="toggleMaximize('${windowId}')" title="Toggle Fullscreen"></button>
                    <button class="mac-btn close" onclick="closeWindow('${windowId}')" title="Close"></button>
                </div>
            </div>

            <div class="window-content">
                <div class="max-w-3xl mx-auto">
                    <div class="relative group mb-6 select-none">
                        <div class="aspect-video w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 relative flex items-center justify-center">
                            <img id="img-${windowId}" 
                                 src="" 
                                 data-img-index="0"
                                 class="w-full h-full object-contain transition-opacity duration-300 cursor-zoom-in hover:opacity-90" 
                                 alt="${project.title}"
                                 onclick="openZoom(this.src)">
                        </div>
                        ${carouselButtonsHTML}
                        ${hasMultipleImages ? `<div class="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-gray-300 backdrop-blur-sm"><span id="counter-${windowId}">1</span>/${project.images.length}</div>` : ''}
                    </div>
                    
                    <h2 class="text-3xl font-bold text-white mb-4">${project.title}</h2>
                    
                    <div class="mb-6">
                        <h3 class="text-blue-400 font-bold uppercase text-sm tracking-wider mb-2">About</h3>
                        <p class="text-gray-300 leading-relaxed">${project.description}</p>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-blue-400 font-bold uppercase text-sm tracking-wider mb-2">Description</h3>
                        <p class="text-gray-300 leading-relaxed">${project.longDescription}</p>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-blue-400 font-bold uppercase text-sm tracking-wider mb-3">Technologies</h3>
                        <div class="flex flex-wrap gap-2">
                            ${project.technologies.map(tech => 
                                `<span class="bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm border border-blue-500/30">${tech}</span>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="text-center border-t border-gray-700 pt-6">
                        <a href="${project.link}" target="_blank" class="inline-flex items-center gap-2 bg-gray-100 hover:bg-white text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors">
                            <i class="fab fa-github"></i> View on GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('windows-container').insertAdjacentHTML('beforeend', windowHTML);
    
    // Load Initial Image
    const imgElement = document.getElementById(`img-${windowId}`);
    safeLoadImage(imgElement, project.images[0]);
}

function changeSlide(windowId, projectId, direction) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const imgElement = document.getElementById(`img-${windowId}`);
    const counterElement = document.getElementById(`counter-${windowId}`);
    if(!imgElement) return;

    let currentIndex = parseInt(imgElement.dataset.imgIndex);
    let newIndex = currentIndex + direction;

    if (newIndex >= project.images.length) newIndex = 0;
    else if (newIndex < 0) newIndex = project.images.length - 1;

    imgElement.dataset.imgIndex = newIndex;
    if(counterElement) counterElement.innerText = newIndex + 1;
    safeLoadImage(imgElement, project.images[newIndex]);
}

// --- 5. Standard Window Functions ---
function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.opacity = '0';
        win.style.transform = 'scale(0.95)';
        setTimeout(() => win.remove(), 200);
    }
}

function bringToFront(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.zIndex = ++highestZIndex;
    }
}

function toggleMaximize(id) {
    const win = document.getElementById(id);
    if (!win) return;

    const isDesktop = win.classList.contains('desktop-mode');
    const isFullscreen = win.classList.contains('fullscreen-mode');
    
    if (isDesktop) {
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.classList.remove('desktop-mode');
        win.classList.add('fullscreen-mode');
        win.style.top = ''; win.style.left = ''; win.style.width = ''; win.style.height = '';
    } else if (isFullscreen) {
        if (window.innerWidth >= 768) {
            win.classList.remove('fullscreen-mode');
            win.classList.add('desktop-mode');
            win.style.top = win.dataset.prevTop || '50px';
            win.style.left = win.dataset.prevLeft || '50px';
            win.style.width = win.dataset.prevWidth || '800px';
            win.style.height = win.dataset.prevHeight || '600px';
        }
    }
}

// --- 6. Global Events (Drag, Resize, Navbar) ---
function startDrag(e, windowId) {
    const win = document.getElementById(windowId);
    if (win.classList.contains('fullscreen-mode')) return;
    if (e.target.closest('button')) return;

    isDragging = true;
    dragTarget = win;
    bringToFront(windowId);

    const rect = win.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
}

function initGlobalDragListeners() {
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragTarget) return;
        e.preventDefault();
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;
        const maxX = window.innerWidth - 50;
        const maxY = window.innerHeight - 50;

        if (newY < 0) newY = 0;
        if (newX < -dragTarget.offsetWidth + 50) newX = -dragTarget.offsetWidth + 50;
        if (newX > maxX) newX = maxX;
        if (newY > maxY) newY = maxY;

        dragTarget.style.left = `${newX}px`;
        dragTarget.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        dragTarget = null;
    });
}

function initResizeListener() {
    window.addEventListener('resize', () => {
        const isMobile = window.innerWidth < 768;
        document.querySelectorAll('.mac-window').forEach(win => {
            if (isMobile) {
                if (!win.classList.contains('fullscreen-mode')) {
                    win.dataset.prevTop = win.style.top;
                    win.dataset.prevLeft = win.style.left;
                    win.dataset.prevWidth = win.style.width;
                    win.dataset.prevHeight = win.style.height;
                    win.classList.remove('desktop-mode');
                    win.classList.add('fullscreen-mode');
                    win.style.top = ''; win.style.left = ''; win.style.width = ''; win.style.height = '';
                }
            } else {
                if (win.classList.contains('fullscreen-mode') && win.dataset.prevTop) {
                    win.classList.remove('fullscreen-mode');
                    win.classList.add('desktop-mode');
                    win.style.top = win.dataset.prevTop;
                    win.style.left = win.dataset.prevLeft;
                    win.style.width = win.dataset.prevWidth || '800px';
                    win.style.height = win.dataset.prevHeight || '600px';
                }
            }
        });
    });
}

function initNavbar() {
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');
    if(btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!menu.classList.contains('hidden') && !btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
            if(menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
        });
    });
}

function initContactModal() {
    const modal = document.getElementById('contact-modal');
    const btn = document.getElementById('contact-btn');
    const close = document.getElementById('close-contact-modal');
    const form = document.getElementById('contact-form');
    if (btn) btn.addEventListener('click', () => modal.classList.remove('hidden'));
    if (close) close.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const msg = document.getElementById('message').value;
            window.location.href = `mailto:michella.anjani@binus.ac.id?subject=Portfolio Contact: ${name}&body=${msg}`;
            modal.classList.add('hidden');
            form.reset();
        });
    }
}