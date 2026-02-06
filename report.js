// Supabase configuration
// Same credentials as other files
const SUPABASE_URL = 'https://jbanjopyzckxgllpyknr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYW5qb3B5emNreGdsbHB5a25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTg4MzQsImV4cCI6MjA4Mjc3NDgzNH0.DSr8IgZ4DlUsr4PaPDv0mfrL6KgmTKJ7pVAcMbIghVI';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const reportForm = document.getElementById('reportForm');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');

// Current user data
let currentUser = null;
let selectedPhotoFile = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    await checkAuth();
    
    // Photo upload handler
    const photoInput = document.getElementById('itemPhoto');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    const removePhotoBtn = document.getElementById('removePhoto');
    
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showError('Photo size must be less than 5MB.');
                    photoInput.value = '';
                    return;
                }
                
                selectedPhotoFile = file;
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    photoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            selectedPhotoFile = null;
            photoInput.value = '';
            photoPreview.style.display = 'none';
            previewImage.src = '';
        });
    }
    
    // Form submission handler
    reportForm.addEventListener('submit', handleFormSubmit);
    
    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            // Redirect to login if not authenticated
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

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Reset messages
    hideMessage(errorMessage);
    hideMessage(successMessage);
    
    // Check if user is authenticated
    if (!currentUser) {
        showError('Please log in to report an item.');
        return;
    }
    
    // Get form values
    const itemName = document.getElementById('itemName').value.trim();
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();
    const color = document.getElementById('color').value;
    const size = document.getElementById('size').value;
    
    // Validate required fields
    if (!itemName || !location || !description || !color || !size) {
        showError('Please fill out all required fields.');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Get user profile to check role
        const { data: profile, error: profileError } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
        
        if (profileError || !profile) {
            throw new Error('Unable to verify user account. Please try logging in again.');
        }
        
        // Only students can report items
        if (profile.role !== 'student') {
            throw new Error('Only students can report lost items.');
        }
        
        // Upload photo if provided
        let imageUrl = null;
        if (selectedPhotoFile) {
            const fileExt = selectedPhotoFile.name.split('.').pop();
            const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
            const filePath = `item-photos/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('item-photos')
                .upload(filePath, selectedPhotoFile);
            
            if (uploadError) {
                console.error('Photo upload error:', uploadError);
                // Continue without photo if upload fails
            } else {
                // Get public URL
                const { data: urlData } = supabaseClient.storage
                    .from('item-photos')
                    .getPublicUrl(filePath);
                imageUrl = urlData.publicUrl;
            }
        }
        
        // Insert item into database
        const { data: itemData, error: insertError } = await supabaseClient
            .from('items')
            .insert([
                {
                    student_id: currentUser.id,
                    title: itemName,
                    description: description,
                    location: location,
                    color: color,
                    size: size,
                    status: 'pending',
                    image_url: imageUrl
                }
            ])
            .select()
            .single();
        
        if (insertError) {
            throw insertError;
        }
        
        // Show success message
        showSuccess('Item reported successfully! Your report has been submitted for approval.');
        
        // Reset form
        reportForm.reset();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting report:', error);
        
        let errorMsg = 'An error occurred while submitting your report. Please try again.';
        
        if (error.message) {
            errorMsg = error.message;
        } else if (error.code === '42501') {
            errorMsg = 'Permission denied. Please make sure you are logged in as a student.';
        }
        
        showError(errorMsg);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
    }
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
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage(element) {
    element.style.display = 'none';
    element.textContent = '';
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