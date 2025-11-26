// public/reset-password.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetPasswordForm');
  const errorDiv = document.getElementById('errorMessage');
  const successDiv = document.getElementById('successMessage');

  const API_BASE = 'http://localhost:5000/api';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const submitButton = form.querySelector('button');

    // Get the token from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        return showError('No reset token found. Please request a new link.');
    }
    
    if (password !== confirmPassword) {
      return showError('Passwords do not match.');
    }

    try {
      submitButton.disabled = true;
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      
      showSuccess(data.message + ' You can now log in.');
      form.style.display = 'none'; // Hide form on success
      setTimeout(() => {
        window.location.href = 'index.html'; // Redirect to login page
      }, 3000);

    } catch (err) {
      showError(err.message);
      submitButton.disabled = false;
    }
  });

  function showError(message) {
    successDiv.classList.add('hidden');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function showSuccess(message) {
    errorDiv.classList.add('hidden');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
  }
});