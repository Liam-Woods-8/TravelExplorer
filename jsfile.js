/**
 * Travel Explorer - Country Information App
 */

// API Configuration
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
        BASE_URL: "https://restcountries.com/v3.1",
        FIELDS: ['name', 'flags', 'region', 'subregion', 'population', 'languages', 'currencies']
    },
    WIKIPEDIA: {
        BASE_URL: "https://en.wikipedia.org/api/rest_v1/page/summary"
    }
};

// UI Configuration
const UI_CONFIG = {
    ANIMATION: {
        DURATION: 500
    },
    ALERT: {
        DISPLAY_TIME: 5000
    }
};

// DOM Elements
let elements = {};

// Initialize app once DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Get all DOM elements
    elements = {
        searchInput: document.querySelector('.search-input'),
        searchButton: document.querySelector('.search-button'),
        countryDisplay: document.querySelector('.country-display'),
        flagImage: document.querySelector('.flag-image'),
        countryName: document.querySelector('.country-name h1'),
        countrySubtitle: document.querySelector('.country-name h2'),
        region: document.querySelector('.region'),
        population: document.querySelector('.population'),
        languages: document.querySelector('.languages'),
        currency: document.querySelector('.currency'),
        description: document.querySelector('.description p'),
        photoGallery: document.querySelector('.photo-gallery'),
        expandedView: document.querySelector('.expanded-view'),
        expandedImage: document.querySelector('.expanded-image'),
        closeButton: document.querySelector('.close-button'),
        loadingAnimation: document.querySelector('.loading-animation')
    };

    setupEventListeners();
    handleLottieAnimations();
}

function setupEventListeners() {
    // Search button click
    if (elements.searchButton) {
        elements.searchButton.addEventListener('click', handleSearch);
    }
    
    // Search input enter key
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Close expanded view when clicking outside
    if (elements.expandedView) {
        elements.expandedView.addEventListener('click', (e) => {
            if (e.target === elements.expandedView) {
                elements.expandedView.classList.remove('active');
            }
        });
    }
    
    // Close expanded view with close button
    if (elements.closeButton) {
        elements.closeButton.addEventListener('click', () => {
            elements.expandedView.classList.remove('active');
        });
    }
}

function handleLottieAnimations() {
    const lottiePlayers = document.querySelectorAll('lottie-player');
    
    lottiePlayers.forEach(player => {
        player.addEventListener('error', (e) => {
            console.warn('Lottie animation failed to load:', e);
            
            // Show fallback content
            const parent = player.parentElement;
            player.style.display = 'none';
            
            if (parent.querySelector('.fallback-icon')) {
                parent.querySelector('.fallback-icon').style.display = 'block';
            }
            
            if (parent.querySelector('.fallback-spinner')) {
                parent.querySelector('.fallback-spinner').style.display = 'block';
            }
        });
    });
}

function handleSearch() {
    const countryName = elements.searchInput.value.trim();
    if (countryName) {
        fetchCountryInfo(countryName);
    }
}

function verifyElements() {
    const requiredElements = [
        'searchInput', 'searchButton', 'countryDisplay', 
        'flagImage', 'countryName', 'region', 
        'population', 'currency', 'languages', 
        'description', 'photoGallery', 'expandedView', 
        'expandedImage', 'closeButton', 'loadingAnimation'
    ];
    
    for (const element of requiredElements) {
        if (!elements[element]) {
            console.error(`Required element not found: ${element}`);
            return false;
        }
    }
    return true;
}

// API Functions
async function fetchCountryInfo(countryName) {
    if (!verifyElements()) {
        showError('Required elements not found. Please check the HTML structure.');
        return;
    }

    showLoading();
    try {
        const normalizedName = normalizeCountryName(countryName);
        
        const response = await fetch(`${API_CONFIG.REST_COUNTRIES.BASE_URL}/name/${encodeURIComponent(normalizedName)}?fullText=false`);
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                displayCountryInfo(data[0]);
                return;
            }
        }
        
        throw new Error(`We couldn't find "${countryName}". Please check the spelling or try another country.`);
    } catch (error) {
        showError(error.message || 'Country not found. Please try again.');
    } finally {
        hideLoading();
    }
}

function normalizeCountryName(input) {
    if (!input) return '';
    
    const normalized = input.toLowerCase().trim();
    
    const countryVariations = {
        'us': 'united states',
        'usa': 'united states',
        'america': 'united states',
        'uk': 'united kingdom',
        'britain': 'united kingdom',
        'england': 'united kingdom',
        'holland': 'netherlands'
    };
    
    return countryVariations[normalized] || normalized;
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
    
    // Update country name and subtitle
    elements.countryName.textContent = countryData.name.common;
    elements.countrySubtitle.textContent = countryData.name.official;
    
    // Update flag
    elements.flagImage.src = countryData.flags.png;
    elements.flagImage.alt = `${countryData.name.common} flag`;
    
    // Update info boxes
    elements.region.textContent = `${countryData.region} (${countryData.subregion})`;
    elements.population.textContent = formatNumber(countryData.population);
    
    // Update currency
    if (countryData.currencies) {
        elements.currency.textContent = Object.values(countryData.currencies)
            .map(currency => `${currency.name} (${currency.symbol})`)
            .join(', ');
    } else {
        elements.currency.textContent = 'Not available';
    }
    
    // Update languages
    if (countryData.languages) {
        elements.languages.textContent = Object.values(countryData.languages).join(', ');
    } else {
        elements.languages.textContent = 'Not available';
    }
    
    // Fetch and display additional data
    fetchWikipediaData(countryData.name.common);
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
        
        const icon = document.createElement('i');
        icon.className = 'bi bi-arrows-fullscreen';
        overlay.appendChild(icon);
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(overlay);
        
        imgContainer.addEventListener('click', () => showExpandedView(image.urls.regular));
        elements.photoGallery.appendChild(imgContainer);
    });
}

// Utility Functions
function showExpandedView(imageSrc) {
    if (!elements.expandedView || !elements.expandedImage) return;
    
    elements.expandedImage.src = imageSrc;
    elements.expandedView.classList.add('active');
}

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
    hideLoading();
    
    const searchSection = document.querySelector('.search-section');
    if (!searchSection) return;
    
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'alert-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => alert.remove());
    alert.appendChild(closeBtn);
    
    // Show for 5 seconds then fade out
    searchSection.appendChild(alert);
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, UI_CONFIG.ALERT.DISPLAY_TIME);
} 