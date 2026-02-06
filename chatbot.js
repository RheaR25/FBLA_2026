
const chatbot = document.getElementById('chatbot');
const openBtn = document.getElementById('openChatbot');
const closeBtn = document.getElementById('closeChatbot');
const messages = document.getElementById('chatbotMessages');
const input = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('sendMessage');

openBtn.onclick = () => chatbot.style.display = 'flex';
closeBtn.onclick = () => chatbot.style.display = 'none';

/* Chatbot functionality */

sendBtn.onclick = sendMessage;
input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    setTimeout(() => {
        addMessage(getBotResponse(text), 'bot');
    }, 400);
}

// Add a message to the chat
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-message' : 'bot-message';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function getBotResponse(message) {
    const msg = message.toLowerCase();

    /* General Questions */
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return "Hi! 👋 I’m the MHS Findr Help Bot. Ask me anything about lost & found, reporting items, or your account.";
    }

    if (msg.includes('what is') || msg.includes('about')) {
        return "MHS Findr is a student-run lost & found platform where students report lost or found items and teachers approve them.";
    }

    /* Account and Login Questions*/
    if (msg.includes('sign up') || msg.includes('create account')) {
        return "Click Sign Up in the top menu, enter your school email, choose your role, and verify your email.";
    }

    if (msg.includes('login') || msg.includes('log in')) {
        return "Click Login in the navigation bar and enter your email and password.";
    }

    if (msg.includes('forgot') || msg.includes('password')) {
        return "Use the Forgot Password link on the login page to reset your password via email.";
    }

    if (msg.includes('logout') || msg.includes('log out')) {
        return "Click the Log Out button in the top-right corner to safely sign out.";
    }

    /* Reporting Items */
    if (msg.includes('report') && msg.includes('item')) {
        return "Go to the Report page, fill out item details, and submit. A teacher must approve it before it appears.";
    }

    if (msg.includes('lost item')) {
        return "If you lost an item, report it with as much detail as possible and check the Browse page regularly.";
    }

    if (msg.includes('found item')) {
        return "If you found an item, report it so the owner can claim it after teacher approval.";
    }

    if (msg.includes('photo') || msg.includes('picture')) {
        return "Adding a photo helps others identify the item faster, but it’s optional.";
    }

    /* Browsing & Search */
    if (msg.includes('browse') || msg.includes('search')) {
        return "Use the Browse page to search by keyword, color, size, or location.";
    }

    if (msg.includes('filter')) {
        return "Filters help narrow results by color, size, or location. Click Clear Filters to reset.";
    }

    if (msg.includes('no items')) {
        return "If no items appear, try removing filters or check back later when new items are approved.";
    }

    /* Claiming Items */
    if (msg.includes('claim')) {
        return "Click an approved item, select Claim Item, and provide proof of ownership.";
    }

    if (msg.includes('proof')) {
        return "Proof can include unique marks, where you lost it, or what was inside the item.";
    }

    if (msg.includes('claim rejected')) {
        return "If rejected, the item becomes available again for others to claim.";
    }

    if (msg.includes('claim approved')) {
        return "Once approved, you’ll receive a notification and can collect your item.";
    }

    /* Notifications */
    if (msg.includes('notification')) {
        return "Notifications alert you when items or claims are approved or rejected.";
    }

    if (msg.includes('not showing')) {
        return "Try refreshing the page. Notifications update automatically when actions occur.";
    }

    /* Dashboard */
    if (msg.includes('dashboard')) {
        return "Your dashboard shows items, claims, and notifications based on your role.";
    }

    /* Student-Specific */
    if (msg.includes('student')) {
        return "Students can report items, browse listings, submit claims, and receive notifications.";
    }

    /* Teacher-Specific */
    if (msg.includes('teacher')) {
        return "Teachers review and approve item reports and claims to ensure accuracy and safety.";
    }

    if (msg.includes('approve')) {
        return "Teachers approve items or claims from the dashboard after reviewing details.";
    }

    if (msg.includes('reject')) {
        return "Teachers can reject items or claims if information is incomplete or incorrect.";
    }

    /* Safety and Rules */
    if (msg.includes('safe') || msg.includes('security')) {
        return "All items and claims require teacher approval to maintain safety and prevent misuse.";
    }

    if (msg.includes('school')) {
        return "MHS Findr is intended only for Middleton High School students and staff.";
    }

    /* Technical Questions */
    if (msg.includes('error') || msg.includes('not working')) {
        return "Try refreshing the page or logging out and back in. If issues persist, contact a teacher.";
    }

    if (msg.includes('mobile') || msg.includes('phone')) {
        return "MHS Findr works on phones, tablets, and computers.";
    }

    /* Default */
    return "I’m not sure about that yet 🤔 Try asking about reporting items, claiming items, logging in, or teacher approvals, or try contacting this email for a better response to your question MHSFindr@gmail.com";
}


