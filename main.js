// Configuration
const BASE_URL = 'https://instimage.vercel.app/images';
const TOTAL_IMAGES = 20;
const IMAGES_PER_LOAD = 8;

// Creative names for wallpapers
const wallpaperNames = [
    'Midnight Dreams', 'Ocean Breeze', 'Sunset Glow', 'Forest Whisper', 'City Lights',
    'Purple Haze', 'Golden Hour', 'Mystic Blue', 'Coral Reef', 'Starry Night',
    'Autumn Leaves', 'Crystal Clear', 'Neon Vibes', 'Peaceful Zen', 'Electric Storm',
    'Rose Garden', 'Mountain Peak', 'Desert Mirage', 'Arctic Frost', 'Tropical Paradise'
];

// Fallback images from Pexels (in case external images fail)
const fallbackImages = [
    'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400'
];

// State management
let currentFilter = 'all';
let loadedImages = 0;
let wallpaperData = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let downloadCounts = JSON.parse(localStorage.getItem('downloadCounts')) || {};
let currentUser = null;
let userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
let imagesLoaded = false;

// DOM Elements
const wallpaperGrid = document.getElementById('wallpaper-grid');
const loadingOverlay = document.getElementById('loading-overlay');
const loadMoreBtn = document.getElementById('load-more-btn');

// Initialize the gallery
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing gallery...');
    initializeWallpaperData();
    setupEventListeners();
    loadInitialWallpapers();
    checkAuthState();
});

// Test image URL function
async function testImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
}

// Google Sign-In callback
function handleCredentialResponse(response) {
    try {
        const responsePayload = decodeJwtResponse(response.credential);
        
        currentUser = {
            id: responsePayload.sub,
            name: responsePayload.name,
            email: responsePayload.email,
            picture: responsePayload.picture
        };
        
        updateAuthUI();
        trackUserVisit();
        showToast(`Welcome, ${currentUser.name}!`, 'success');
    } catch (error) {
        console.error('Error handling Google sign-in:', error);
        showToast('Sign-in failed. Please try again.', 'error');
    }
}

// Decode JWT response
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Update authentication UI
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const signInButton = document.getElementById('g_id_signin');
    
    if (currentUser) {
        document.getElementById('user-avatar').src = currentUser.picture;
        document.getElementById('user-name').textContent = currentUser.name;
        userInfo.classList.remove('d-none');
        if (signInButton) signInButton.style.display = 'none';
    } else {
        userInfo.classList.add('d-none');
        if (signInButton) signInButton.style.display = 'block';
    }
}

// Check authentication state
function checkAuthState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

// Track user visit
function trackUserVisit() {
    if (currentUser) {
        const visits = JSON.parse(localStorage.getItem('userVisits')) || {};
        const today = new Date().toDateString();
        
        if (!visits[currentUser.id]) {
            visits[currentUser.id] = [];
        }
        
        if (!visits[currentUser.id].includes(today)) {
            visits[currentUser.id].push(today);
            localStorage.setItem('userVisits', JSON.stringify(visits));
        }
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Initialize wallpaper data
async function initializeWallpaperData() {
    console.log('Initializing wallpaper data...');
    
    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const originalUrl = `${BASE_URL}/img (${i}).jpg`;
        const fallbackUrl = fallbackImages[i - 1];
        
        // Test if original URL works, otherwise use fallback
        const imageUrl = await testImageUrl(originalUrl) ? originalUrl : fallbackUrl;
        
        wallpaperData.push({
            id: i,
            url: imageUrl,
            name: wallpaperNames[i - 1] || `Aesthetic ${i}`,
            downloads: downloadCounts[i] || Math.floor(Math.random() * 100),
            isFavorite: favorites.includes(i),
            tags: generateRandomTags(),
            uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            votes: Math.floor(Math.random() * 50) + 10
        });
    }
    
    console.log('Wallpaper data initialized:', wallpaperData.length, 'items');
    imagesLoaded = true;
}

// Generate random tags for wallpapers
function generateRandomTags() {
    const allTags = ['aesthetic', 'minimal', 'nature', 'abstract', 'dark', 'colorful', 'gradient', 'pattern', 'artistic', 'modern'];
    const numTags = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
}

// Load initial wallpapers
async function loadInitialWallpapers() {
    console.log('Loading initial wallpapers...');
    loadedImages = 0;
    wallpaperGrid.innerHTML = '';
    
    // Wait for data to be initialized if not ready
    if (!imagesLoaded) {
        await initializeWallpaperData();
    }
    
    loadMoreWallpapers();
    
    // Hide loading overlay after a delay
    setTimeout(() => {
        hideLoadingOverlay();
    }, 2000);
}

// Load more wallpapers
function loadMoreWallpapers() {
    console.log('Loading more wallpapers...');
    const filteredData = getFilteredData();
    const nextBatch = filteredData.slice(loadedImages, loadedImages + IMAGES_PER_LOAD);
    
    if (nextBatch.length === 0) {
        console.log('No more images to load');
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    nextBatch.forEach((wallpaper, index) => {
        setTimeout(() => {
            const card = createWallpaperCard(wallpaper);
            wallpaperGrid.appendChild(card);
            animateCardEntry(card);
        }, index * 100);
    });
    
    loadedImages += nextBatch.length;
    
    // Hide load more button if all images are loaded
    if (loadedImages >= filteredData.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Get filtered data
function getFilteredData() {
    let filtered = [...wallpaperData];
    
    // Apply category filter
    switch (currentFilter) {
        case 'recent':
            filtered = filtered.sort((a, b) => b.uploadDate - a.uploadDate);
            break;
        case 'popular':
            filtered = filtered.sort((a, b) => b.downloads - a.downloads);
            break;
        case 'favorites':
            filtered = filtered.filter(wallpaper => wallpaper.isFavorite);
            break;
    }
    
    return filtered;
}

// Create wallpaper card
function createWallpaperCard(wallpaper) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-6 col-md-4 col-lg-3 mb-3';
    
    const heartIcon = wallpaper.isFavorite ? 'fas fa-heart' : 'far fa-heart';
    const heartClass = wallpaper.isFavorite ? 'favorited' : '';
    
    colDiv.innerHTML = `
        <div class="wallpaper-card" data-id="${wallpaper.id}">
            <div class="image-container">
                <img src="${wallpaper.url}" alt="${wallpaper.name}" class="wallpaper-image" loading="lazy" onerror="this.src='${fallbackImages[0]}'">
                <div class="image-overlay">
                    <button class="action-btn preview-btn" onclick="previewImage('${wallpaper.url}', ${wallpaper.id})">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="action-btn favorite-btn ${heartClass}" onclick="toggleFavorite(${wallpaper.id})">
                        <i class="${heartIcon}"></i>
                    </button>
                </div>
                <div class="image-stats">
                    <span class="vote-count">
                        <i class="fas fa-thumbs-up"></i>
                        ${wallpaper.votes}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <h5 class="card-title">${wallpaper.name}</h5>
                <div class="card-actions">
                    <button class="download-btn" onclick="downloadImage('${wallpaper.url}', ${wallpaper.id})">
                        <i class="fas fa-download"></i>
                        <span class="btn-text">Download</span>
                    </button>
                    <button class="share-btn" onclick="shareWallpaper(${wallpaper.id})">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return colDiv;
}

// Animate card entry
function animateCardEntry(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 50);
}

// Toggle favorite
function toggleFavorite(id) {
    const wallpaper = wallpaperData.find(w => w.id === id);
    if (!wallpaper) return;
    
    wallpaper.isFavorite = !wallpaper.isFavorite;
    
    if (wallpaper.isFavorite) {
        favorites.push(id);
        showToast('Added to favorites!', 'success');
    } else {
        favorites = favorites.filter(fav => fav !== id);
        showToast('Removed from favorites!', 'info');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update the heart icon
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        const heartBtn = card.querySelector('.favorite-btn');
        const heartIcon = heartBtn.querySelector('i');
        
        if (wallpaper.isFavorite) {
            heartIcon.className = 'fas fa-heart';
            heartBtn.classList.add('favorited');
        } else {
            heartIcon.className = 'far fa-heart';
            heartBtn.classList.remove('favorited');
        }
    }
}

// Download image
function downloadImage(imageUrl, id) {
    const button = event.target.closest('.download-btn');
    const originalContent = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Downloading...</span>';
    button.disabled = true;
    
    // Update download count
    const wallpaper = wallpaperData.find(w => w.id === id);
    if (wallpaper) {
        wallpaper.downloads++;
        downloadCounts[id] = wallpaper.downloads;
        localStorage.setItem('downloadCounts', JSON.stringify(downloadCounts));
    }
    
    // Track download if user is logged in
    if (currentUser) {
        trackDownload(id);
    }
    
    try {
        // Create download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${wallpaper ? wallpaper.name.toLowerCase().replace(/\s+/g, '-') : 'wallpaper'}.jpg`;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset button and show success
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-check"></i> <span class="btn-text">Downloaded!</span>';
            showToast('Wallpaper downloaded successfully!', 'success');
            
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.disabled = false;
            }, 2000);
        }, 1000);
    } catch (error) {
        console.error('Download error:', error);
        button.innerHTML = originalContent;
        button.disabled = false;
        showToast('Download failed. Please try again.', 'error');
    }
}

// Track download
function trackDownload(wallpaperId) {
    if (currentUser) {
        const downloads = JSON.parse(localStorage.getItem('userDownloads')) || {};
        if (!downloads[currentUser.id]) {
            downloads[currentUser.id] = [];
        }
        downloads[currentUser.id].push({
            wallpaperId,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('userDownloads', JSON.stringify(downloads));
    }
}

// Preview image
function previewImage(imageUrl, id) {
    const wallpaper = wallpaperData.find(w => w.id === id);
    if (!wallpaper) return;
    
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageUrl}" alt="${wallpaper.name}" class="modal-image" onerror="this.src='${fallbackImages[0]}'">
            <div class="modal-info">
                <h3>${wallpaper.name}</h3>
                <div class="modal-stats">
                    <span><i class="fas fa-download"></i> ${wallpaper.downloads} downloads</span>
                    <span><i class="fas fa-thumbs-up"></i> ${wallpaper.votes} votes</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn favorite-btn ${wallpaper.isFavorite ? 'favorited' : ''}" onclick="toggleFavorite(${id})">
                    <i class="${wallpaper.isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    ${wallpaper.isFavorite ? 'Favorited' : 'Add to Favorites'}
                </button>
                <button class="modal-btn download-btn" onclick="downloadImage('${imageUrl}', ${id})">
                    <i class="fas fa-download"></i>
                    Download
                </button>
                <button class="modal-btn share-btn" onclick="shareWallpaper(${id})">
                    <i class="fas fa-share-alt"></i>
                    Share
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Share wallpaper
function shareWallpaper(id) {
    const wallpaper = wallpaperData.find(w => w.id === id);
    if (!wallpaper) return;
    
    if (navigator.share) {
        navigator.share({
            title: wallpaper.name,
            text: `Check out this amazing wallpaper: ${wallpaper.name}`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(err => {
            console.log('Error copying to clipboard:', err);
            showToast('Unable to copy link', 'error');
        });
    }
}

// Show random wallpaper
function showRandomWallpaper() {
    if (wallpaperData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * wallpaperData.length);
    const randomWallpaper = wallpaperData[randomIndex];
    previewImage(randomWallpaper.url, randomWallpaper.id);
}

// Submit vote
function submitVote() {
    if (!currentUser) {
        showToast('Please sign in to vote!', 'error');
        return;
    }
    
    const rating = document.querySelector('.rating-stars .active')?.dataset.rating;
    const comment = document.getElementById('vote-comment').value;
    
    if (!rating) {
        showToast('Please select a rating!', 'error');
        return;
    }
    
    // Store vote
    userVotes[currentUser.id] = {
        rating: parseInt(rating),
        comment,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    
    // Close modal and show success
    const modal = bootstrap.Modal.getInstance(document.getElementById('voteModal'));
    if (modal) modal.hide();
    
    showToast('Thank you for your feedback!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadedImages = 0;
            wallpaperGrid.innerHTML = '';
            loadMoreWallpapers();
        });
    });
    
    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreWallpapers);
    }
    
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            switch(action) {
                case 'home':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'random':
                    showRandomWallpaper();
                    break;
                case 'vote':
                    if (!currentUser) {
                        showToast('Please sign in to vote!', 'error');
                        return;
                    }
                    const voteModal = new bootstrap.Modal(document.getElementById('voteModal'));
                    voteModal.show();
                    break;
                case 'support':
                    const supportModal = new bootstrap.Modal(document.getElementById('supportModal'));
                    supportModal.show();
                    break;
                case 'profile':
                    if (!currentUser) {
                        showToast('Please sign in to view profile!', 'error');
                        return;
                    }
                    showToast('Profile feature coming soon!', 'info');
                    break;
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAuthUI();
            showToast('Logged out successfully!', 'info');
        });
    }
    
    // Rating stars
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            document.querySelectorAll('.rating-stars i').forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // Submit vote button
    const submitVoteBtn = document.getElementById('submit-vote');
    if (submitVoteBtn) {
        submitVoteBtn.addEventListener('click', submitVote);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            showRandomWallpaper();
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error handling for global errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    hideLoadingOverlay();
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    hideLoadingOverlay();
});