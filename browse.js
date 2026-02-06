// Supabase configuration
const SUPABASE_URL = 'https://jbanjopyzckxgllpyknr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYW5qb3B5emNreGdsbHB5a25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTg4MzQsImV4cCI6MjA4Mjc3NDgzNH0.DSr8IgZ4DlUsr4PaPDv0mfrL6KgmTKJ7pVAcMbIghVI';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const itemsContainer = document.getElementById('itemsContainer');
const noItemsMessage = document.getElementById('noItemsMessage');
const searchKeyword = document.getElementById('searchKeyword');
const filterColor = document.getElementById('filterColor');
const filterSize = document.getElementById('filterSize');
const filterLocation = document.getElementById('filterLocation');
const clearFilters = document.getElementById('clearFilters');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const itemModal = document.getElementById('itemModal');
const claimModal = document.getElementById('claimModal');
const claimForm = document.getElementById('claimForm');

// Current user data
let currentUser = null;
let allItems = [];
let currentItemId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadItems();
    
    // Event listeners
    searchKeyword.addEventListener('input', filterItems);
    filterColor.addEventListener('change', filterItems);
    filterSize.addEventListener('change', filterItems);
    filterLocation.addEventListener('input', filterItems);
    clearFilters.addEventListener('click', clearAllFilters);
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal close handlers
    const modalClose = document.querySelector('.modal-close');
    const modalCloseClaim = document.querySelector('.modal-close-claim');
    const cancelClaim = document.getElementById('cancelClaim');
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            itemModal.style.display = 'none';
        });
    }
    
    if (modalCloseClaim) {
        modalCloseClaim.addEventListener('click', () => {
            claimModal.style.display = 'none';
        });
    }
    
    if (cancelClaim) {
        cancelClaim.addEventListener('click', () => {
            claimModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            itemModal.style.display = 'none';
        }
        if (e.target === claimModal) {
            claimModal.style.display = 'none';
        }
    });
    
    // Claim form handler
    claimForm.addEventListener('submit', handleClaim);
});

// Check authentication
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = user;
        if (userEmail) {
            userEmail.textContent = user.email;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

// Load all approved items
async function loadItems() {
    try {
        const { data: items, error } = await supabaseClient
            .from('items')
            .select(`
                *,
                student:users!items_student_id_fkey(email)
            `)
            .eq('status', 'approved')
            .is('claim_status', null)
            .or('claim_status.is.null,claim_status.eq.rejected')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading items:', error);
            itemsContainer.innerHTML = '<p class="error-message">Error loading items. Please refresh the page.</p>';
            return;
        }
        
        allItems = items || [];
        filterItems();
    } catch (error) {
        console.error('Error in loadItems:', error);
        itemsContainer.innerHTML = '<p class="error-message">Error loading items. Please refresh the page.</p>';
    }
}

// Filter items based on search and filters
function filterItems() {
    const keyword = searchKeyword.value.toLowerCase().trim();
    const color = filterColor.value;
    const size = filterSize.value;
    const location = filterLocation.value.toLowerCase().trim();
    
    const filtered = allItems.filter(item => {
        const matchKeyword = !keyword || 
            item.title?.toLowerCase().includes(keyword) ||
            item.description?.toLowerCase().includes(keyword);
        
        const matchColor = !color || item.color === color;
        const matchSize = !size || item.size === size;
        const matchLocation = !location || item.location?.toLowerCase().includes(location);
        
        return matchKeyword && matchColor && matchSize && matchLocation;
    });
    
    displayItems(filtered);
}

// Display items in grid
function displayItems(items) {
    if (items.length === 0) {
        itemsContainer.style.display = 'none';
        noItemsMessage.style.display = 'block';
        return;
    }
    
    itemsContainer.style.display = 'grid';
    noItemsMessage.style.display = 'none';
    
    itemsContainer.innerHTML = items.map(item => `
        <div class="item-card-browse" onclick="openItemDetail('${item.id}')">
            ${item.image_url ? `
                <div class="item-card-image">
                    <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect fill=%27%23e0e0e0%27 width=%27400%27 height=%27300%27/%3E%3Ctext fill=%27%23999%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27%3ENo Image%3C/text%3E%3C/svg%3E'">
                </div>
            ` : `
                <div class="item-card-image no-image">
                    <div class="no-image-placeholder">No Photo</div>
                </div>
            `}
            <div class="item-card-content">
                <h3>${escapeHtml(item.title || 'Untitled Item')}</h3>
                <div class="item-card-meta">
                    <span class="item-badge color-badge">${escapeHtml(item.color || 'N/A')}</span>
                    <span class="item-badge size-badge">${escapeHtml(item.size || 'N/A')}</span>
                </div>
                <p class="item-card-location">📍 ${escapeHtml(item.location || 'Unknown location')}</p>
            </div>
        </div>
    `).join('');
}

// Open item detail modal
window.openItemDetail = async function(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Fetch full item details with poster info
    const { data: fullItem, error } = await supabaseClient
        .from('items')
        .select(`
            *,
            student:users!items_student_id_fkey(email),
            claimed_by_user:users!items_claimed_by_fkey(email)
        `)
        .eq('id', itemId)
        .single();
    
    if (error || !fullItem) {
        alert('Error loading item details.');
        return;
    }
    
    currentItemId = itemId;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="item-detail">
            ${fullItem.image_url ? `
                <div class="item-detail-image">
                    <img src="${escapeHtml(fullItem.image_url)}" alt="${escapeHtml(fullItem.title)}">
                </div>
            ` : `
                <div class="item-detail-image no-image">
                    <div class="no-image-placeholder">No Photo Available</div>
                </div>
            `}
            <div class="item-detail-content">
                <h2>${escapeHtml(fullItem.title || 'Untitled Item')}</h2>
                <div class="item-detail-info">
                    <div class="detail-row">
                        <span class="detail-label">Color:</span>
                        <span class="detail-value">${escapeHtml(fullItem.color || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Size:</span>
                        <span class="detail-value">${escapeHtml(fullItem.size || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Found At:</span>
                        <span class="detail-value">${escapeHtml(fullItem.location || 'Unknown')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Posted By:</span>
                        <span class="detail-value">${escapeHtml(fullItem.student?.email || 'Unknown')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date Posted:</span>
                        <span class="detail-value">${formatDate(fullItem.created_at)}</span>
                    </div>
                    ${fullItem.claimed_by ? `
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value claimed">Claimed</span>
                        </div>
                    ` : ''}
                </div>
                <div class="item-detail-description">
                    <h3>Description</h3>
                    <p>${escapeHtml(fullItem.description || 'No description provided.')}</p>
                </div>
                    ${fullItem.claim_status !== 'approved' && fullItem.student_id !== currentUser?.id ? `
                    <button class="btn btn-primary btn-claim" onclick="openClaimModal('${itemId}')">
                        Claim This Item
                    </button>
                ` : fullItem.claimed_by === currentUser?.id && fullItem.claim_status === 'approved' ? `
                    <div class="claim-status">
                        <p class="claim-success">You have claimed this item!</p>
                    </div>
                ` : fullItem.claimed_by === currentUser?.id && fullItem.claim_status === 'pending' ? `
                    <div class="claim-status">
                        <p class="claim-pending">Your claim is pending teacher approval.</p>
                    </div>
                ` : fullItem.student_id === currentUser?.id ? `
                    <div class="claim-status">
                        <p>This is your posted item.</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    itemModal.style.display = 'block';
};

// Open claim modal
window.openClaimModal = function(itemId) {
    currentItemId = itemId;
    document.getElementById('claimItemId').value = itemId;
    claimForm.reset();
    claimModal.style.display = 'block';
};

// Handle claim submission
async function handleClaim(e) {
    e.preventDefault();
    
    const proof = document.getElementById('claimProof').value.trim();
    if (!proof) {
        alert('Please provide proof of ownership.');
        return;
    }
    
    const submitBtn = claimForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Submit claim with pending status for teacher approval
        const { error } = await supabaseClient
            .from('items')
            .update({
                claimed_by: currentUser.id,
                claim_proof: proof,
                claim_status: 'pending',
                claimed_at: new Date().toISOString()
            })
            .eq('id', currentItemId)
            .eq('status', 'approved')
            .is('claimed_by', null);
        
        if (error) {
            throw error;
        }
        
        // Create notification for the item poster (if they exist)
        const item = allItems.find(i => i.id === currentItemId);
        if (item && item.student_id) {
            await supabaseClient
                .from('notifications')
                .insert([
                    {
                        user_id: item.student_id,
                        type: 'claim_submitted',
                        message: `Someone has submitted a claim for your item: ${item.title}`,
                        item_id: currentItemId
                    }
                ]);
        }
        
        alert('Claim submitted successfully! A teacher will review your claim and you will be notified once it is approved.');
        claimModal.style.display = 'none';
        itemModal.style.display = 'none';
        
        // Reload items
        await loadItems();
        
    } catch (error) {
        console.error('Error claiming item:', error);
        if (error.code === 'PGRST116') {
            alert('This item has already been claimed or is no longer available.');
        } else {
            alert('Error submitting claim: ' + (error.message || 'Please try again.'));
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Claim';
    }
}

// Clear all filters
function clearAllFilters() {
    searchKeyword.value = '';
    filterColor.value = '';
    filterSize.value = '';
    filterLocation.value = '';
    filterItems();
}

// Handle logout
async function handleLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
}

// Helper functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

