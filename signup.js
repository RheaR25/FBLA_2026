// Supabase configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://jbanjopyzckxgllpyknr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYW5qb3B5emNreGdsbHB5a25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTg4MzQsImV4cCI6MjA4Mjc3NDgzNH0.DSr8IgZ4DlUsr4PaPDv0mfrL6KgmTKJ7pVAcMbIghVI';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Teacher secret code 
const TEACHER_SECRET_CODE = 'TEACHER2026';

// DOM elements
const signupForm = document.getElementById('signupForm');
const isTeacherCheckbox = document.getElementById('isTeacher');
const teacherCodeGroup = document.getElementById('teacherCodeGroup');
const teacherCodeInput = document.getElementById('teacherCode');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Show/hide teacher code field based on checkbox
isTeacherCheckbox.addEventListener('change', function() {
    if (this.checked) {
        teacherCodeGroup.style.display = 'block';
        teacherCodeInput.setAttribute('required', 'required');
    } else {
        teacherCodeGroup.style.display = 'none';
        teacherCodeInput.removeAttribute('required');
        teacherCodeInput.value = '';
    }
});

// Form submission handler
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Reset messages
    hideMessage(errorMessage);
    hideMessage(successMessage);
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const isTeacher = isTeacherCheckbox.checked;
    const teacherCode = teacherCodeInput.value.trim();
    
    // Validation
    if (isTeacher && !teacherCode) {
        showError('Please enter the teacher code');
        return;
    }
    
    if (isTeacher && teacherCode !== TEACHER_SECRET_CODE) {
        showError('Invalid teacher code. Please contact your administrator.');
        return;
    }
    
    // Optional: Validate teacher email domain
    //if (isTeacher && !email.endsWith('@school.edu')) {
    //    showError('Teacher accounts must use a @school.edu email address');
    //    return;
    //}

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        // Create user in Supabase Auth (email verification disabled)
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/login.html`,
                data: {
                    email_verified: true
                }
            }
        });
        
        if (authError) {
            throw authError;
        }
        
        if (!authData.user) {
            throw new Error('Failed to create user');
        }
        
        // Determine user role
        const role = isTeacher ? 'teacher' : 'student';
        
        // Create user profile in database
        console.log('Creating user profile...', { id: authData.user.id, email, role });
        const { data: profileData, error: profileError } = await supabaseClient
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    role: role
                    //created_at will be set by database default
                }
            ])
            .select()
            .single();
        
        if (profileError) {
            console.error('Profile creation error:', profileError);
            console.error('Profile error details:', JSON.stringify(profileError, null, 2));
            // Show error to user but don't fail completely - the trigger might create it
            if (profileError.code !== '23505') { // 23505 is unique violation - might mean profile already exists
                showError('Warning: Profile creation failed. You may need to contact support. Error: ' + (profileError.message || 'Unknown error'));
            }
        } else {
            console.log('Profile created successfully:', profileData);
        }
        
        // Show success message
        showSuccess(
            isTeacher 
                ? 'Account created! Please check your email to verify your account before logging in.'
                : 'Account created successfully! You can now log in.'
        );
        
        // Reset form
        signupForm.reset();
        teacherCodeGroup.style.display = 'none';
        
        // Redirect to login after 3 seconds (for students)
        if (!isTeacher) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'An error occurred during signup. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
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

