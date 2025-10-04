// This is our new, reusable password validation tool
module.exports = function(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  // If there are no errors, the password is valid
  if (errors.length === 0) {
    return { isValid: true };
  } else {
    // If there are errors, return them in a helpful message
    return { isValid: false, message: errors.join(' ') };
  }
};