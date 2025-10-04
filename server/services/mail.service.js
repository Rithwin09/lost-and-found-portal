require('dotenv').config(); 
const sgMail = require('@sendgrid/mail');


// --- IMPORTANT: Set your API Key here ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// -----------------------------------------

const fromAddress = {
  name: 'Lost & Found Portal',
  email: 'nrithwinreddy@gmail.com' // The email you verified with SendGrid
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `http://localhost:8080/api/verify-item?token=${verificationToken}`;
  const msg = { to: email, from: fromAddress, subject: 'Please Verify Your Item Report', html: `<p>Thank you for reporting a found item! Please click the link below to make your post public:</p><a href="${verificationLink}">Verify My Post</a>` };
  try { await sgMail.send(msg); } catch (error) { console.error('Error sending verification email:', error); }
};

const sendMatchNotificationEmail = async (lostItemOwnerEmail, foundItem) => {
  const itemLink = `http://localhost:4200/item/${foundItem.id}`;
  const msg = { to: lostItemOwnerEmail, from: fromAddress, subject: 'Potential Match Found for Your Lost Item!', html: `<h3>Good News!</h3><p>An item was recently reported that is a potential match for your lost item.</p><p><b>Found Item Title:</b> ${foundItem.title}</p><p>Click the link below to view the details and start the claim process:</p><a href="${itemLink}">View Item Details</a>` };
  try { await sgMail.send(msg); } catch (error) { console.error('Error sending match notification email:', error); }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `http://localhost:4200/reset-password?token=${resetToken}`;
  const msg = { to: email, from: fromAddress, subject: 'Your Password Reset Link', html: `<p>You requested a password reset. Please click the link below to set a new password. This link is valid for 15 minutes.</p><a href="${resetLink}">Reset My Password</a>` };
  try { await sgMail.send(msg); } catch (error) { console.error('Error sending password reset email:', error); }
};

const sendClaimNotificationEmail = async (finderEmail, item) => {
  const verificationLink = `http://localhost:4200/item/${item.id}/verify`;
  const msg = { to: finderEmail, from: fromAddress, subject: `Someone has claimed your found item: "${item.title}"`, html: `<h3>Action Required</h3><p>Someone has submitted a claim for an item you reported as found.</p><p>Please click the link below to review their proof of ownership and either accept or reject their claim.</p><a href="${verificationLink}">Review Claim Now</a>` };
  try { await sgMail.send(msg); } catch (error) { console.error('Error sending claim notification email:', error); }
};

const sendClaimStatusEmail = async (claimantEmail, item, status) => {
  const itemLink = `http://localhost:4200/item/${item.id}`;
  const chatLink = `http://localhost:4200/messages/${item.id}`;
  let subject = '';
  let html = '';
  if (status === 'accepted') {
    subject = `Your claim for "${item.title}" has been accepted!`;
    html = `<h3>Congratulations!</h3><p>The finder has accepted your claim for the item: <strong>${item.title}</strong>.</p><p>Please click the link below to open a secure chat with the finder to arrange a safe handoff.</p><a href="${chatLink}">Open Secure Chat</a>`;
  } else {
    subject = `Update on your claim for "${item.title}"`;
    html = `<h3>Claim Update</h3><p>Unfortunately, the finder did not accept your claim for the item: <strong>${item.title}</strong>.</p><p>You can view the item again at the link below.</p><a href="${itemLink}">View Item Details</a>`;
  }
  const msg = { to: claimantEmail, from: fromAddress, subject: subject, html: html };
  try { await sgMail.send(msg); } catch (error) { console.error('Error sending claim status email:', error); }
};

const sendWarningEmail = (userEmail, userName) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Official Warning Regarding Your Account', html: `<p>Hello ${userName},</p><p>This is an official warning regarding your activity on the Lost & Found Portal. An administrator has determined that your actions were not in line with our community guidelines. Please ensure all future interactions are respectful. Further violations may result in the suspension of your account.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending warning email:", err.response ? err.response.body : err));
};

const sendSuspensionEmailWithHandoff = (userEmail, userName, item, handoffCode) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Your Account Has Been Temporarily Suspended - Action Required', html: `<p>Hello ${userName},</p><p>Your account has been suspended for 7 days. An administrator has initiated a secure handoff for the item "${item.title}". Please take the item and the following code to the Campus Security office within 24 hours.</p><h3 style="color: #fd7e14;">Handoff Code: ${handoffCode}</h3>` };
  sgMail.send(msg).catch(err => console.error("Error sending suspension with handoff email:", err.response ? err.response.body : err));
};

const sendGeneralSuspensionEmail = (userEmail, userName) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Your Account Has Been Temporarily Suspended', html: `<p>Hello ${userName},</p><p>This is an official notification that your account on the Lost & Found Portal has been temporarily suspended by an administrator.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending general suspension email:", err.response ? err.response.body : err));
};

// --- THIS IS THE NEW, DETAILED BAN EMAIL (THE MISSING RECIPE) ---
const sendBanEmailWithHandoff = (userEmail, userName, item, handoffCode) => {
  const msg = {
    to: userEmail,
    from: fromAddress,
    subject: 'Your Account Has Been Banned - Action Required',
    html: `<p>Hello ${userName},</p><p>Your account has been permanently banned. An administrator has initiated a secure handoff for the item "${item.title}". You are required to take the item and the following code to the Campus Security office within 24 hours.</p><h3 style="color: #dc3545;">Handoff Code: ${handoffCode}</h3>`,
  };
  sgMail.send(msg).catch(err => console.error("Error sending ban with handoff email:", err.response ? err.response.body : err));
};

// This is the simpler ban email, renamed for clarity
const sendGeneralBanEmail = (userEmail, userName) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Your Account Has Been Permanently Banned', html: `<p>Hello ${userName},</p><p>This is an official notification that your account on the Lost & Found Portal has been permanently banned due to a serious violation of our community guidelines.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending general ban email:", err.response ? err.response.body : err));
};

const sendHandoffInstructionToFinder = (finderEmail, finderName, item, handoffCode) => {
  const msg = { to: finderEmail, from: fromAddress, subject: `Action Required: Please Hand Off Found Item - "${item.title}"`, html: `<p>Hello ${finderName},</p><p>An administrator has reviewed a report concerning the item you found, "${item.title}". A secure, mediated handoff has been initiated. Please take the item and the following unique code to the official Campus Security office within 24 hours.</p><h3 style="color: #0d6efd;">Handoff Code: ${handoffCode}</h3><p>Thank you for your cooperation.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending handoff instruction to finder:", err.response ? err.response.body : err));
};

const sendHandoffNoticeToClaimant = (claimantEmail, claimantName, item, code, actionTaken) => {
  const msg = {
    to: claimantEmail,
    from: fromAddress, // Assumes 'fromAddress' is defined in your file
    subject: `Your Item "${item.title}" is Ready for Pickup`,
    html: `
      <p>Hello ${claimantName},</p>
      <p>Following a report you filed, the user in possession of your item, "<strong>${item.title}</strong>", has been <strong>${actionTaken}</strong>. The item has been safely secured and is now available at the administrative office.</p>
      <p>To collect your item, please visit the admin office and present the following <strong>Verification Code</strong> to an administrator. This is required to verify your identity.</p>
      <h3 style="text-align:center; color: #198754; letter-spacing: 2px;">Your Verification Code:</h3>
      <h2 style="text-align:center; color: #3d5a80; letter-spacing: 2px; font-family: monospace;">${code}</h2>
      <p>Thank you,<br>The Lost & Found Team</p>
    `,
  };

  sgMail.send(msg).catch(err => console.error("Error sending handoff notice to claimant:", err.response ? err.response.body : err));
};

const sendUnsuspendEmail = (userEmail, userName) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Update: Your Account Suspension Has Been Lifted', html: `<p>Hello ${userName},</p><p>This is an official notification that the temporary suspension on your Lost & Found Portal account has been lifted. You are now able to log in and use the platform as normal.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending unsuspend email:", err.response ? err.response.body : err));
};

const sendUnbanEmail = (userEmail, userName) => {
  const msg = { to: userEmail, from: fromAddress, subject: 'Update: Your Account Has Been Reinstated', html: `<p>Hello ${userName},</p><p>This is an official notification that the ban on your Lost & Found Portal account has been lifted by an administrator. You are now able to log in and use the platform.</p>` };
  sgMail.send(msg).catch(err => console.error("Error sending unban email:", err.response ? err.response.body : err));
};

const sendAdminInvitationEmail = (email, name, setupToken) => {
  const setupLink = `http://localhost:4200/admin-setup?token=${setupToken}`;
  const msg = { to: email, from: fromAddress, subject: 'You Have Been Invited to be an Administrator', html: `<p>Hello ${name},</p><p>You have been invited to become an administrator for the College Lost & Found Portal. Please click the link below to set up your account and create your private password. This link is valid for 24 hours.</p><a href="${setupLink}" style="padding: 10px 15px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Set Up My Admin Account</a>` };
  sgMail.send(msg).catch(err => console.error("Error sending admin invitation email:", err.response ? err.response.body : err));
};

// --- THIS IS THE SECOND MISSING RECIPE ---
const sendClaimVoidedToFinder = (finderEmail, finderName, item) => {
  const msg = {
    to: finderEmail,
    from: fromAddress,
    subject: `Update on the claim for your found item: "${item.title}"`,
    html: `<p>Hello ${finderName},</p><p>An administrator has reviewed a report concerning the user who claimed your item, "${item.title}". That user's claim has now been voided.</p><p>Your item is now available for other users to claim. Thank you for your patience.</p>`,
  };
  sgMail.send(msg).catch(err => console.error("Error sending claim voided email to finder:", err.response ? err.response.body : err));
};



module.exports = { 
  sendVerificationEmail,
  sendMatchNotificationEmail,
  sendPasswordResetEmail,
  sendClaimNotificationEmail,
  sendClaimStatusEmail,
  sendWarningEmail,
  sendSuspensionEmailWithHandoff, // Use the specific name
  sendGeneralSuspensionEmail,
  sendBanEmailWithHandoff, // Use the specific name
  sendGeneralBanEmail,
  sendHandoffInstructionToFinder,
  sendHandoffNoticeToClaimant,
  sendUnsuspendEmail,
  sendUnbanEmail,
  sendAdminInvitationEmail,
  sendClaimVoidedToFinder, // Make sure to export it
  
  
  
};