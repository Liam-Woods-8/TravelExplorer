// Constants
const API_CONFIG = {
    UNSPLASH: {
        BASE_URL: "https://api.unsplash.com/search/photos",
        API_KEY: "e12u7ws6ol4AkfvJDhM7rNcSHRQQWHxZfaEt_Wjhfmg",
        PER_PAGE: 6,
        HEADERS: {
            'Authorization': 'Client-ID e12u7ws6ol4AkfvJDhM7rNcSHRQQWHxZfaEt_Wjhfmg'
        }
    },
    REST_COUNTRIES: {
        BASE_URL: "https://restcountries.com/v3.1/name",
        FIELDS: ['name', 'flags', 'region', 'subregion', 'population', 'languages', 'currencies']
    },
    WIKIPEDIA: {
        BASE_URL: "https://en.wikipedia.org/api/rest_v1/page/summary"
    }
};

const UI_CONFIG = {
    ANIMATION: {
        DURATION: 500,
        DELAY: 100
    },
    RETRY: {
        MAX_ATTEMPTS: 5,
        BASE_DELAY: 1000,
        MAX_DELAY: 10000
    }
};

// DOM Elements
const elements = {
    searchInput: document.querySelector('.search-input'),
    searchButton: document.querySelector('.search-button'),
    countryDisplay: document.querySelector('.country-display'),
    welcomeSection: document.querySelector('.welcome-section'),
    flagImage: document.querySelector('.flag-image'),
    countryName: document.querySelector('.country-name h1'),
    countrySubtitle: document.querySelector('.country-name h2'),
    region: document.querySelector('.region'),
    population: document.querySelector('.population'),
    currency: document.querySelector('.currency'),
    languages: document.querySelector('.languages'),
    description: document.querySelector('.description p'),
    photoGallery: document.querySelector('.photo-gallery'),
    expandedView: document.querySelector('.expanded-view'),
    expandedImage: document.querySelector('.expanded-image'),
    closeButton: document.querySelector('.close-button'),
    loadingAnimation: document.querySelector('.loading-animation')
};

// Verify all required elements exist
function verifyElements() {
    const requiredElements = ['searchInput', 'searchButton', 'countryDisplay', 'flagImage', 'countryName', 'countrySubtitle', 'region', 'population', 'currency', 'languages', 'description', 'photoGallery', 'expandedView', 'expandedImage', 'closeButton', 'loadingAnimation'];
    
    for (const element of requiredElements) {
        if (!elements[element]) {
            console.error(`Required element not found: ${element}`);
            return false;
        }
    }
    return true;
}

// Event Listeners
if (elements.searchButton && elements.searchInput) {
    elements.searchButton.addEventListener('click', () => {
        const countryName = elements.searchInput.value.trim();
        if (countryName) {
            fetchCountryInfo(countryName);
        }
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const countryName = elements.searchInput.value.trim();
            if (countryName) {
                fetchCountryInfo(countryName);
            }
        }
    });
}

if (elements.expandedView) {
    elements.expandedView.addEventListener('click', (e) => {
        if (e.target === elements.expandedView) {
            elements.expandedView.classList.remove('active');
        }
    });
}

if (elements.closeButton) {
    elements.closeButton.addEventListener('click', () => {
        elements.expandedView.classList.remove('active');
    });
}

// API Functions
async function fetchCountryInfo(countryName) {
    if (!verifyElements()) {
        showError('Required elements not found. Please check the HTML structure.');
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_CONFIG.REST_COUNTRIES.BASE_URL}/${encodeURIComponent(countryName)}`);
        if (!response.ok) {
            throw new Error('Country not found');
        }
        const data = await response.json();
        if (!data || !data[0]) {
            throw new Error('Invalid country data received');
        }
        displayCountryInfo(data[0]);
    } catch (error) {
        showError(error.message || 'Country not found. Please try again.');
    } finally {
        hideLoading();
    }
}

async function fetchWikipediaData(countryName) {
    if (!elements.description) {
        console.error('Description element not found');
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.WIKIPEDIA.BASE_URL}/${encodeURIComponent(countryName)}`);
        if (!response.ok) {
            throw new Error('Wikipedia data not found');
        }
        const data = await response.json();
        if (!data || !data.extract) {
            throw new Error('No description available');
        }
        elements.description.textContent = data.extract;
    } catch (error) {
        elements.description.textContent = 'Description not available.';
    }
}

async function fetchCountryImages(countryName) {
    if (!elements.photoGallery) {
        console.error('Photo gallery element not found');
        return;
    }

    try {
        const response = await fetch(
            `${API_CONFIG.UNSPLASH.BASE_URL}?query=${encodeURIComponent(countryName)}&per_page=12&orientation=landscape`,
            {
                headers: API_CONFIG.UNSPLASH.HEADERS
            }
        );
        if (!response.ok) {
            throw new Error('Images not found');
        }
        const data = await response.json();
        if (!data || !data.results || data.results.length === 0) {
            throw new Error('No images available');
        }
        displayImages(data.results);
    } catch (error) {
        showError('Images not available.');
    }
}

// Display Functions
function displayCountryInfo(countryData) {
    if (!verifyElements()) return;

    // Show the country display section
    elements.countryDisplay.style.display = 'block';
    
    // Update country name
    elements.countryName.textContent = countryData.name.common;
    elements.countrySubtitle.textContent = countryData.name.official;
    
    // Update flag
    elements.flagImage.src = countryData.flags.png;
    elements.flagImage.alt = `${countryData.name.common} flag`;
    
    // Update info boxes
    elements.region.textContent = `${countryData.region} (${countryData.subregion})`;
    elements.population.textContent = countryData.population.toLocaleString();
    elements.currency.textContent = Object.values(countryData.currencies)
        .map(currency => `${currency.name} (${currency.symbol})`)
        .join(', ');
    elements.languages.textContent = Object.values(countryData.languages).join(', ');
    
    // Fetch and display description
    fetchWikipediaData(countryData.name.common);
    
    // Fetch and display images
    fetchCountryImages(countryData.name.common);
}

function displayImages(images) {
    if (!elements.photoGallery) return;

    elements.photoGallery.innerHTML = '';
    
    images.forEach(image => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = image.urls.regular;
        img.alt = image.alt_description || 'Country image';
        img.loading = 'lazy';
        
        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';
        overlay.innerHTML = `<i class="bi bi-zoom-in"></i>`;
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(overlay);
        
        imgContainer.addEventListener('click', () => showExpandedView(image.urls.regular));
        elements.photoGallery.appendChild(imgContainer);
    });
}

// Utility Functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function showLoading() {
    if (elements.loadingAnimation && elements.searchButton) {
        elements.loadingAnimation.classList.add('active');
        elements.searchButton.disabled = true;
    }
}

function hideLoading() {
    if (elements.loadingAnimation && elements.searchButton) {
        elements.loadingAnimation.classList.remove('active');
        elements.searchButton.disabled = false;
    }
}

function showError(message) {
    const searchSection = document.querySelector('.search-section');
    if (!searchSection) return;

    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    searchSection.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function showExpandedView(imageUrl) {
    if (!elements.expandedImage || !elements.expandedView) return;

    elements.expandedImage.src = imageUrl;
    elements.expandedView.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeExpandedView() {
    if (!elements.expandedView) return;

    elements.expandedView.classList.remove('active');
    document.body.style.overflow = '';
}

// Update photo gallery click handlers
function updatePhotoGallery(photos) {
    elements.photoGallery.innerHTML = '';
    photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.urls.regular;
        img.alt = `Photo of ${elements.countryName.textContent}`;
        img.classList.add('gallery-item');
        img.addEventListener('click', () => {
            elements.expandedImage.src = photo.urls.regular;
            elements.expandedView.classList.add('active');
        });
        elements.photoGallery.appendChild(img);
    });
} 