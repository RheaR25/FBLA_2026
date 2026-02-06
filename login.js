// Supabase configuration
// Same credentials as signup.js and dashboard.js
const SUPABASE_URL = 'https://jbanjopyzckxgllpyknr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYW5qb3B5emNreGdsbHB5a25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTg4MzQsImV4cCI6MjA4Mjc3NDgzNH0.DSr8IgZ4DlUsr4PaPDv0mfrL6KgmTKJ7pVAcMbIghVI';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Form submission handler
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Reset messages
    hideMessage(errorMessage);
    hideMessage(successMessage);
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        // Sign in user
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            throw authError;
        }
        
        if (!authData.user) {
            throw new Error('Login failed. Please try again.');
        }
        
        // Show success message
        showSuccess('Login successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Provide user-friendly error messages
        let errorMsg = 'An error occurred during login. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMsg = 'Please verify your email address before logging in.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showError(errorMsg);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
    }
});

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

