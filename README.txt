MHS Findr - Lost & Found

This project was created to help Middleton High School students efficiently track lost and found items and to facilitate reuniting items with their owners. The team behind this project consists of Saket Bonu, Rhea Rachala, and Krish Makhija.

You can contact us via Telegram:
@nikithanimmagadda
@eesha_n10
@rhearachala

Or via phone:
Rhea: 813-598-9805
Nikitha: 813-784-0860
Eesha: 813-610-5057

Table of Contents
Introduction
Code Quality
Programming Languages & Tools
Code Quality Details
Program Files
Pages & Their Descriptions
FAQS
Templates and Trademarks
Conclusion

1. Introduction

MHS Findr is a web-based lost & found system designed for students to report, browse, and claim lost or found items. Users can create student or teacher accounts, interact with a dashboard, and use a chatbot for guidance.

Key features:
Students can report lost or found items, view approved items, and claim items by providing proof of ownership.
Teachers review submissions, approve/reject items, and manage claims.
Chatbot helps users navigate the system and answer questions about reporting, browsing, and claiming items.
Notifications keep users updated on approvals, rejections, or new claims.
The system is designed to be intuitive, secure, and student-friendly, ensuring that both students and teachers can use it efficiently while developing responsibility in reporting and tracking lost items.

2. Code Quality
The project is modular, readable, and well-structured. Proper syntax, consistent naming conventions, and organized folders allow for easy debugging, future updates, and team collaboration. Each page, component, and script is logically separated to maintain clarity.

3. Programming Languages & Tools
HTML & CSS: For page structure and styling.
JavaScript: For interactive features, chatbot functionality, and dynamic content updates.
Supabase: Handles authentication, database storage, and real-time updates.
Database: Stores user data, item submissions, and claims.
This combination allows for a responsive, interactive, and secure platform with seamless integration of multiple functionalities.

4. Code Quality Details
UI: Clean, minimalistic, and user-friendly layout that guides users effortlessly.
Comments: Detailed comments explain functionality, making it easy for new developers to understand the logic.
Navigation: Top navigation bar shows key pages and user account information, including email and logout options.
Validation: Login, registration, and claim forms are validated to prevent incorrect entries and maintain data integrity.
Modularity: Components, modals, and pages are divided logically, allowing updates or bug fixes without affecting unrelated parts of the system.

5. Program Files

JavaScript Files:
dashboard.js – Handles dashboard rendering, item/claim approvals, and notifications.
browse.js – Displays items, handles search, filter, and claim modal interactions.
chatbot.js – Powers the chatbot interface for user guidance.
report.js – Handles submission of lost/found items, form validation, and interactions with Supabase database.
login.js – Validates login credentials, handles Supabase authentication, and manages login errors.
signup.js – Handles account creation, validates user inputs, and stores new user data securely in Supabase.

HTML Files:
index.html – Home page with platform introduction.
dashboard.html – User dashboard showing items, notifications, and claims.
browse.html – Browse lost & found items and submit claims.
report.html – Submit lost or found items for approval.
help.html – Help page with instructions and FAQs.
login.html – Login page with fields for email and password.
signup.html – Sign-up page with fields for email, password, and user role selection.

CSS Files:
style.css – Main styling file, handles layout, colors, modals, and responsive design.

Database:
Supabase tables store users, items, and claims. SQL commands were used to create necessary tables and Row-Level Security (RLS) to ensure users can only access data they are authorized to view/edit.
The SQL Commands used can be found in the SQL Commands folder to view them right click on the command you wish to see and select open with a text editor of your choice such as notepad

6. Pages & Their Descriptions
Home Page:
Provides an overview of the platform, instructions, and links to key actions such as browsing and reporting items.
Dashboard:
Shows personalized information:
Students: See posted items, claims, and notifications.
Teachers: Review pending items and claims, approve/reject, and manage the student directory.
Browse Page:
Displays approved items for students to claim. Search, filter, and sorting functionalities help locate items quickly.
Report Page:
Students can report lost or found items, provide images, and describe proof of ownership if claiming.
Help Page:
Contains detailed instructions, FAQs, and guidance for both students and teachers.
Modals:
Interactive pop-ups for claiming items or viewing details, designed for clarity and responsiveness.

7. FAQS
How do I claim an item? Fill out the claim modal with proof of ownership. Teachers review and approve or reject claims.
What if I forget my password? Use the reset password feature to recover access.
Who can approve items? Only teacher accounts have the authority to approve or reject items and claims.
Can I edit my submissions? Yes, students can update item descriptions or images before approval.

8. Templates and Trademarks
No templates or images were used

9. Conclusion
Rhea Rachala, Eesha Nimmagadda, and Nikitha Nimmigadda created MHS Findr to provide a secure, interactive, and accessible platform for students to track lost and found items. The program fosters responsibility, organization, and effective communication between students and teachers.
We believe this system will simplify the lost & found process, reduce confusion, and ensure students can recover their items efficiently.

Extra Information:
TMHS Findr is fully responsive and accessible across desktops, tablets, and mobile devices. The interface automatically adjusts layout, font sizes, and interactive elements using responsive CSS and media queries to ensure usability on all screen sizes.
How to Run:
Open login.html in a browser, sign up or login, and start using the platform. Ensure internet connection for Supabase authentication.

Thank you from the development team:
Rhea Rachala, Eesha Nimmagadda, and Nikitha Nimmigadda 



