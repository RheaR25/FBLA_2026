// Supabase configuration
// IMPORTANT: Update these to match your Supabase credentials (same as signup.js)
const SUPABASE_URL = 'https://jbanjopyzckxgllpyknr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYW5qb3B5emNreGdsbHB5a25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTg4MzQsImV4cCI6MjA4Mjc3NDgzNH0.DSr8IgZ4DlUsr4PaPDv0mfrL6KgmTKJ7pVAcMbIghVI';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const teacherDashboard = document.getElementById('teacherDashboard');
const studentDashboard = document.getElementById('studentDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');

// Current user data
let currentUser = null;
let userProfile = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndLoadDashboard();
    
    // Logout button handler
    logoutBtn.addEventListener('click', handleLogout);
});

// Check authentication and load appropriate dashboard
async function checkAuthAndLoadDashboard() {
    try {
        // Check current session first
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            showErrorState();
            return;
        }
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError) {
            console.error('Auth error:', authError);
            showErrorState();
            return;
        }
        
        if (!user) {
            console.log('No user found');
            showErrorState();
            return;
        }
        
        currentUser = user;
        if (userEmail) {
            userEmail.textContent = user.email;
        }
        
        // Fetch user profile to get role
        console.log('Fetching profile for user:', user.id, user.email);
        const { data: profile, error: profileError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        console.log('Profile fetch result:', { profile, profileError });
        
        if (profileError) {
            console.error('Error fetching profile:', profileError);
            console.error('Profile error code:', profileError.code);
            console.error('Profile error message:', profileError.message);
            console.error('Profile error details:', JSON.stringify(profileError, null, 2));
            
            // Check if profile doesn't exist (error code PGRST116 means no rows returned)
            const isNoRowsError = profileError.code === 'PGRST116' || 
                                 profileError.code === '42P01' ||
                                 profileError.message?.includes('No rows') ||
                                 profileError.message?.includes('not found') ||
                                 profileError.message?.includes('does not exist');
            
            if (isNoRowsError) {
                alert('Your profile could not be found. Please log out and log back in, or contact an administrator.');
                showErrorState();
                return;
              
            } else {
                // For other errors (like 500), show helpful message
                console.error('Unexpected error fetching profile:', profileError);
                
                let errorMessage = 'Error loading your profile. ';
                
                if (profileError.code === '42501' || profileError.message?.includes('permission') || profileError.message?.includes('policy')) {
                    errorMessage += 'This appears to be a permission issue. Please run the SQL fix in Supabase (fix_rls_policies.sql file).';
                } else if (profileError.code === 'PGRST301' || profileError.status === 500) {
                    errorMessage += 'Server error. This might be a Row Level Security policy issue. Please run fix_rls_policies.sql in Supabase.';
                } else {
                    errorMessage += 'Error details: ' + (profileError.message || 'Unknown error');
                }
                
                alert(errorMessage);
                showErrorState();
                return;
            }
        } else {
            userProfile = profile;
        }
        
        if (!userProfile) {
            console.error('No profile found');
            showErrorState();
            return;
        }
        
        // Hide loading state
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        
        // Show appropriate dashboard based on role
        if (userProfile.role === 'teacher') {
            showTeacherDashboard();
            await loadTeacherData();
        } else if (userProfile.role === 'student') {
            showStudentDashboard();
            await loadStudentData();
        } else {
            console.error('Unknown role:', userProfile.role);
            showErrorState();
        }
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState();
    }
}

// Show teacher dashboard
function showTeacherDashboard() {
    teacherDashboard.style.display = 'block';
    
    // Populate account info
    document.getElementById('teacherEmail').textContent = currentUser.email;
    document.getElementById('teacherRole').textContent = 'Teacher';
    if (userProfile.created_at) {
        const createdAt = new Date(userProfile.created_at);
        document.getElementById('teacherCreatedAt').textContent = createdAt.toLocaleDateString();
    }
}

// Show student dashboard
function showStudentDashboard() {
    studentDashboard.style.display = 'block';
    
    // Populate account info
    document.getElementById('studentEmail').textContent = currentUser.email;
    document.getElementById('studentRole').textContent = 'Student';
    if (userProfile.created_at) {
        const createdAt = new Date(userProfile.created_at);
        document.getElementById('studentCreatedAt').textContent = createdAt.toLocaleDateString();
    }
}

// Show error state
function showErrorState() {
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    if (errorState) {
        errorState.style.display = 'block';
    }
}

// Load teacher-specific data
async function loadTeacherData() {
    await Promise.all([
        loadPendingItems(),
        loadPendingClaims(),
        loadStudentDirectory()
    ]);
}

// Load pending items for approval (teacher view)
async function loadPendingItems() {
    try {
        const { data: items, error } = await supabaseClient
            .from('items')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading pending items:', error);
            return;
        }
        
        const container = document.getElementById('pendingItems');
        
        // Update pending count badge
        const pendingCountBadge = document.getElementById('pendingCount');
        if (pendingCountBadge) {
            pendingCountBadge.textContent = items ? items.length : 0;
        }
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="empty-message">No items pending approval.</p>';
            return;
        }
        
        // Fetch student emails for each item
        const studentIds = [...new Set(items.map(item => item.student_id))];
        const { data: students } = await supabaseClient
            .from('users')
            .select('id, email')
            .in('id', studentIds);
        
        const studentMap = {};
        if (students) {
            students.forEach(student => {
                studentMap[student.id] = student.email;
            });
        }
        
        container.innerHTML = items.map(item => {
            const studentEmail = studentMap[item.student_id] || 'Unknown';
            return `
            <div class="item-card">
                <div class="item-header">
                    <h3>${escapeHtml(item.title || 'Untitled Item')}</h3>
                    <span class="item-status status-pending">Pending</span>
                </div>
                <div class="item-body">
                    <p class="item-description">${escapeHtml(item.description || 'No description')}</p>
                    <div class="item-meta">
                        <span>Posted by: ${escapeHtml(studentEmail)}</span>
                        <span>Date: ${formatDate(item.created_at)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-success btn-sm" onclick="approveItem('${item.id}')">
                        Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectItem('${item.id}')">
                        Reject
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error in loadPendingItems:', error);
    }
}

// Load pending claims for review (teacher view)
async function loadPendingClaims() {
    try {
        const { data: items, error } = await supabaseClient
            .from('items')
            .select(`
                *,
                student:users!items_student_id_fkey(email),
                claimant:users!items_claimed_by_fkey(email)
            `)
            .eq('claim_status', 'pending')
            .order('claimed_at', { ascending: false });
        
        if (error) {
            console.error('Error loading pending claims:', error);
            return;
        }
        
        const container = document.getElementById('pendingClaims');
        
        // Update count badge
        const pendingClaimsCountBadge = document.getElementById('pendingClaimsCount');
        if (pendingClaimsCountBadge) {
            pendingClaimsCountBadge.textContent = items ? items.length : 0;
        }
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="empty-message">No claims pending review.</p>';
            return;
        }
        
        container.innerHTML = items.map(item => {
            const claimantEmail = item.claimant?.email || 'Unknown';
            const posterEmail = item.student?.email || 'Unknown';
            
            return `
            <div class="item-card">
                <div class="item-header">
                    <h3>${escapeHtml(item.title || 'Untitled Item')}</h3>
                    <span class="item-status status-pending">Claim Pending</span>
                </div>
                <div class="item-body">
                    <p class="item-description">${escapeHtml(item.description || 'No description')}</p>
                    <div class="item-meta">
                        <span>Posted by: ${escapeHtml(posterEmail)}</span>
                        <span>Claimed by: ${escapeHtml(claimantEmail)}</span>
                        <span>Date: ${formatDate(item.claimed_at)}</span>
                    </div>
                    <div class="claim-proof">
                        <strong>Proof of Ownership:</strong>
                        <p>${escapeHtml(item.claim_proof || 'No proof provided')}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-success btn-sm" onclick="approveClaim('${item.id}')">
                        Approve Claim
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectClaim('${item.id}')">
                        Reject Claim
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error in loadPendingClaims:', error);
    }
}

// Load student directory (teacher view)
async function loadStudentDirectory() {
    try {
        const { data: students, error } = await supabaseClient
            .from('users')
            .select('id, email, created_at')
            .eq('role', 'student')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading students:', error);
            return;
        }
        
        const container = document.getElementById('studentDirectory');
        
        // Update student count badge
        const studentCountBadge = document.getElementById('studentCount');
        if (studentCountBadge) {
            studentCountBadge.textContent = students ? students.length : 0;
        }
        
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty-message">No students found.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="directory-list">
                ${students.map(student => `
                    <div class="directory-item">
                        <div class="directory-info">
                            <span class="directory-email">${escapeHtml(student.email)}</span>
                            <span class="directory-date">Joined: ${formatDate(student.created_at)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error in loadStudentDirectory:', error);
    }
}

// Load student-specific data
async function loadStudentData() {
    await Promise.all([
        loadMyItems(),
        loadNotifications()
    ]);
}

// Load items posted/claimed by student
async function loadMyItems() {
    try {
        const { data: items, error } = await supabaseClient
            .from('items')
            .select('*')
            .eq('student_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading my items:', error);
            return;
        }
        
        const container = document.getElementById('myItems');
        
        // Update my items count badge
        const myItemsCountBadge = document.getElementById('myItemsCount');
        if (myItemsCountBadge) {
            myItemsCountBadge.textContent = items ? items.length : 0;
        }
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="empty-message">You haven\'t posted or claimed any items yet.</p>';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <h3>${escapeHtml(item.title || 'Untitled Item')}</h3>
                    <span class="item-status status-${item.status}">${capitalize(item.status)}</span>
                </div>
                <div class="item-body">
                    <p class="item-description">${escapeHtml(item.description || 'No description')}</p>
                    <div class="item-meta">
                        <span>Posted: ${formatDate(item.created_at)}</span>
                        ${item.updated_at ? `<span>Updated: ${formatDate(item.updated_at)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error in loadMyItems:', error);
    }
}

// Approve item (teacher action)
window.approveItem = async function(itemId) {
    try {
        const { error } = await supabaseClient
            .from('items')
            .update({ 
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);
        
        if (error) throw error;
        
        // Reload pending items
        await loadPendingItems();
        
        // Show success message
        alert('Item approved successfully!');
    } catch (error) {
        console.error('Error approving item:', error);
        alert('Error approving item. Please try again.');
    }
};

// Approve claim (teacher action)
window.approveClaim = async function(itemId) {
    try {
        // Get the item to find the claimant
        const { data: item, error: itemError } = await supabaseClient
            .from('items')
            .select('claimed_by')
            .eq('id', itemId)
            .single();
        
        if (itemError || !item) {
            throw new Error('Item not found');
        }
        
        // Update item claim status to approved
        const { error } = await supabaseClient
            .from('items')
            .update({ 
                claim_status: 'approved'
            })
            .eq('id', itemId);
        
        if (error) throw error;
        
        // Create notification for the claimant
        if (item.claimed_by) {
            await supabaseClient
                .from('notifications')
                .insert([
                    {
                        user_id: item.claimed_by,
                        type: 'claim_approved',
                        message: `Your claim has been approved! You can now collect your item.`,
                        item_id: itemId
                    }
                ]);
        }
        
        // Reload pending claims
        await loadPendingClaims();
        
        alert('Claim approved successfully!');
    } catch (error) {
        console.error('Error approving claim:', error);
        alert('Error approving claim. Please try again.');
    }
};

// Reject claim (teacher action)
window.rejectClaim = async function(itemId) {
    if (!confirm('Are you sure you want to reject this claim? The item will become available again.')) {
        return;
    }
    
    try {
        // Get the item to find the claimant
        const { data: item, error: itemError } = await supabaseClient
            .from('items')
            .select('claimed_by')
            .eq('id', itemId)
            .single();
        
        if (itemError || !item) {
            throw new Error('Item not found');
        }
        
        // Update item - remove claim and set status to rejected
        const { error } = await supabaseClient
            .from('items')
            .update({ 
                claim_status: 'rejected',
                claimed_by: null,
                claim_proof: null,
                claimed_at: null
            })
            .eq('id', itemId);
        
        if (error) throw error;
        
        // Create notification for the claimant
        if (item.claimed_by) {
            await supabaseClient
                .from('notifications')
                .insert([
                    {
                        user_id: item.claimed_by,
                        type: 'claim_rejected',
                        message: `Your claim has been rejected. The item is available for others to claim.`,
                        item_id: itemId
                    }
                ]);
        }
        
        // Reload pending claims
        await loadPendingClaims();
        
        alert('Claim rejected. The item is now available again.');
    } catch (error) {
        console.error('Error rejecting claim:', error);
        alert('Error rejecting claim. Please try again.');
    }
};

// Load notifications (student view)
async function loadNotifications() {
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*, item:items(id, title)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error loading notifications:', error);
            return;
        }
        
        const container = document.getElementById('notifications');
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<p class="empty-message">No notifications.</p>';
            return;
        }
        
        container.innerHTML = notifications.map(notif => {
            const readClass = notif.read ? 'notification-read' : 'notification-unread';
            return `
            <div class="notification-item ${readClass}" onclick="markNotificationRead('${notif.id}')">
                <div class="notification-content">
                    <p class="notification-message">${escapeHtml(notif.message)}</p>
                    <span class="notification-date">${formatDate(notif.created_at)}</span>
                </div>
                ${!notif.read ? '<span class="notification-badge">New</span>' : ''}
            </div>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error in loadNotifications:', error);
    }
}

// Mark notification as read
window.markNotificationRead = async function(notificationId) {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        
        if (error) throw error;
        
        // Reload notifications
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Reject item (teacher action)
window.rejectItem = async function(itemId) {
    if (!confirm('Are you sure you want to reject this item?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('items')
            .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);
        
        if (error) throw error;
        
        // Reload pending items
        await loadPendingItems();
        
        // Show success message
        alert('Item rejected.');
    } catch (error) {
        console.error('Error rejecting item:', error);
        alert('Error rejecting item. Please try again.');
    }
};

// Handle logout
async function handleLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

//Hide Navigation bar when scrolling 
let lastScrollY = window.scrollY;
const nav = document.querySelector('.main-nav');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down
        nav.classList.add('nav-hidden');
    } else {
        // Scrolling up
        nav.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY;
});
