// Quick script to create demo user
// Run this in browser console on the login page

// Fill the registration form with demo credentials
document.querySelector('button[type="button"]').click(); // Switch to registration
setTimeout(() => {
  document.querySelector('input[name="name"]').value = 'Demo User';
  document.querySelector('input[name="email"]').value = 'demo@example.com';
  document.querySelector('input[name="password"]').value = 'demo123';
  
  // Trigger change events
  ['name', 'email', 'password'].forEach(name => {
    const input = document.querySelector(`input[name="${name}"]`);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  
  console.log('Demo user form filled. Click "Create Account" to register.');
}, 100);
