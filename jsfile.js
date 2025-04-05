// API Configuration
const UNSPLASH_API_KEY = 'YOUR_UNSPLASH_API_KEY';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const REST_COUNTRIES_API_URL = 'https://restcountries.com/v3.1/name';
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

// UI Elements
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const countryDisplay = document.querySelector('.country-display');
const loadingAnimation = document.querySelector('.loading-animation');
const expandedView = document.querySelector('.expanded-view');
const expandedImage = document.querySelector('.expanded-image');
const photoGallery = document.querySelector('.photo-gallery');

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Main Functions
async function handleSearch() {
    const countryName = searchInput.value.trim();
    if (!countryName) return;

    showLoading();
    try {
        const countryData = await fetchCountryData(countryName);
        const wikiData = await fetchWikipediaData(countryName);
        const images = await fetchCountryImages(countryName);
        
        updateUI(countryData, wikiData, images);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch country data. Please try again.');
    } finally {
        hideLoading();
    }
}

// Data Fetching
async function fetchCountryData(countryName) {
    const response = await fetch(`${REST_COUNTRIES_API_URL}/${countryName}`);
    if (!response.ok) throw new Error('Country not found');
    const data = await response.json();
    return data[0];
}

async function fetchWikipediaData(countryName) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'extracts',
        exintro: true,
        explaintext: true,
        titles: countryName,
        origin: '*'
    });

    const response = await fetch(`${WIKIPEDIA_API_URL}?${params}`);
    const data = await response.json();
    const page = Object.values(data.query.pages)[0];
    return page.extract;
}

async function fetchCountryImages(countryName) {
    const response = await fetch(`${UNSPLASH_API_URL}?query=${countryName}&client_id=${UNSPLASH_API_KEY}`);
    const data = await response.json();
    return data.results;
}

// UI Updates
function updateUI(countryData, wikiData, images) {
    updateCountryInfo(countryData);
    updateDescription(wikiData);
    updatePhotoGallery(images);
    countryDisplay.style.display = 'block';
}

function updateCountryInfo(data) {
    document.querySelector('.flag-image').src = data.flags.png;
    document.querySelector('.country-name h1').textContent = data.name.common;
    document.querySelector('.country-name h2').textContent = data.name.official;
    
    const infoBoxes = document.querySelectorAll('.info-box p');
    infoBoxes[0].textContent = `${data.region}, ${data.subregion}`;
    infoBoxes[1].textContent = data.population.toLocaleString();
    infoBoxes[2].textContent = Object.values(data.languages).join(', ');
    infoBoxes[3].textContent = Object.values(data.currencies)[0].name;
}

function updateDescription(text) {
    document.querySelector('.description p').textContent = text;
}

function updatePhotoGallery(images) {
    photoGallery.innerHTML = '';
    images.forEach(image => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${image.urls.regular}" alt="${image.alt_description}">
            <div class="gallery-overlay">
                <i class="bi bi-zoom-in"></i>
            </div>
        `;
        item.addEventListener('click', () => showExpandedImage(image.urls.full));
        photoGallery.appendChild(item);
    });
}

// UI Helpers
function showLoading() {
    loadingAnimation.style.display = 'flex';
}

function hideLoading() {
    loadingAnimation.style.display = 'none';
}

function showExpandedImage(src) {
    expandedImage.src = src;
    expandedView.classList.add('active');
}

// Close expanded view when clicking outside
expandedView.addEventListener('click', (e) => {
    if (e.target === expandedView) {
        expandedView.classList.remove('active');
    }
}); 