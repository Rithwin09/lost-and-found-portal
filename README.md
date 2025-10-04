# lost-and-found-portal
The Lost &amp; Found Portal is a full-stack web application designed to create a centralized and secure platform for managing lost and found items within a community, such as a college campus. 


The Lost & Found Portal is a full-stack web application designed to create a centralized and secure platform for managing lost and found items within a community, such as a college campus. It features a user-friendly interface for reporting items, a finder-led claim approval process, a secure chat for arranging handoffs, and a comprehensive two-tiered admin panel for moderation and dispute resolution.

✨ Features
The platform is rich with features designed for users, guests, and administrators.

General & User Features
Report Lost & Found Items: Authenticated users can report items they have either lost or found.

Advanced Search & Filtering: A powerful search bar with filters for category and status (Lost/Found) to easily locate items.

Secure Registration & Login: User accounts are secured with JWT (JSON Web Tokens) and hashed passwords.

Full Password Recovery Flow: Users can securely reset their password via an email link.

Guest (Anonymous) User Workflow
Frictionless Reporting: A guest can report a found item without creating an account by providing their email.

Email Verification: Guest posts only go live after the user clicks a verification link sent to their email.

Private Management Link: Guests manage their posts (review claims, chat) through a unique, private link sent to their email.

Seamless Account Conversion: If a guest registers later with the same email, their previously reported items are automatically linked to their new account.

Finder & Claimant Workflow
Finder-Led Claim Approval: The user who found an item is responsible for reviewing and approving ownership claims.

Secure Real-Time Chat: Once a claim is approved, a private chat room is opened for the finder and claimant to securely coordinate the handover.

Dispute Resolution: Both users in a chat can report the other party if an issue arises, which escalates the case to an admin.

Claimant-Driven Resolution: The claimant marks the item as "Resolved" after a successful handoff, closing the case.

Administrator Panel (Role-Based Access)
Super Admin Role:

Has the exclusive ability to invite new administrators via a secure email link.

Can manage and delete other admin accounts.

Admin Role:

Manage Reports: Reviews and investigates user reports from the chat, with access to the full chat transcript.

Take Disciplinary Action: Can issue warnings, suspend, or ban users based on their investigation.

Facilitate Secure Handoffs: For disputed cases, the admin uses the Handoff Code to act as a secure intermediary for the item exchange.

Platform Oversight: Admins can manage all users and item listings on the platform.

🚀 Technology Stack
Frontend:

Angular

Bootstrap for styling

ngx-toastr for user notifications

Backend:

Node.js with Express.js

Socket.io for real-time chat

Sequelize as the ORM (Object-Relational Mapper)

JSON Web Tokens (JWT) for authentication

bcryptjs for password hashing

Multer for handling image uploads

SendGrid Mail & Nodemailer for email services

Database:

MySQL

🏁 Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
You need to have the following software installed on your machine:

Node.js (which includes npm)

MySQL Server

Angular CLI (npm install -g @angular/cli)

Installation & Setup
Clone the repository:

Bash

git clone https://github.com/YourUsername/lost-and-found-portal.git
cd lost-and-found-portal
Backend Setup:

Bash

# Navigate to the server directory
cd server

# Install NPM packages
npm install

# Create the environment file (see section below)
# Create a .env file and add your credentials

# Start the server
npm start
Your backend will be running on http://localhost:8080.

Frontend Setup:

Bash

# Open a new terminal and navigate to the client directory
cd client

# Install NPM packages
npm install

# Start the Angular development server
ng serve
Your frontend will be running on http://localhost:4200.

Open your browser and navigate to http://localhost:4200/.

🔑 Environment Variables
To run the backend, you need to create a .env file in the /server directory. Copy the example below and replace the values with your own credentials.

.env.example

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=lost_and_found_db

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random

# Email Service API Key
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
