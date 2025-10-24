<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Register</h1>
      <p class="subtitle">Create an account to access product catalog</p>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Choose a username"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="At least 8 characters"
            required
            autocomplete="new-password"
            minlength="8"
            @input="checkPasswordStrength"
          />
          <div v-if="password" class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.percentage + '%' }"></div>
            </div>
            <span class="strength-text" :class="passwordStrength.class">{{ passwordStrength.text }}</span>
          </div>
          <small class="help-text">Must include uppercase, lowercase, number, and special character</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            required
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="jdsApiToken">JDS API Token</label>
          <input
            id="jdsApiToken"
            v-model="jdsApiToken"
            type="text"
            placeholder="Enter your JDS API token"
            required
          />
          <small class="help-text">
            Get your API token from
            <a href="https://jdsindustries.com/?view=apiRequest" target="_blank" rel="noopener noreferrer">JDS Industries</a>
          </small>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-link">
        Already have an account?
        <router-link to="/login">Sign in here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const jdsApiToken = ref('');
const errorMessage = ref('');
const loading = ref(false);
const passwordStrength = ref({
  percentage: 0,
  text: '',
  class: ''
});

const checkPasswordStrength = () => {
  const pass = password.value;
  let strength = 0;

  // Check length
  if (pass.length >= 8) strength += 25;
  if (pass.length >= 12) strength += 10;

  // Check for character types
  if (/[a-z]/.test(pass)) strength += 15;
  if (/[A-Z]/.test(pass)) strength += 15;
  if (/[0-9]/.test(pass)) strength += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 20;

  // Update strength indicator
  if (strength < 40) {
    passwordStrength.value = { percentage: strength, text: 'Weak', class: 'weak' };
  } else if (strength < 70) {
    passwordStrength.value = { percentage: strength, text: 'Fair', class: 'fair' };
  } else if (strength < 90) {
    passwordStrength.value = { percentage: strength, text: 'Good', class: 'good' };
  } else {
    passwordStrength.value = { percentage: 100, text: 'Strong', class: 'strong' };
  }
};

const handleRegister = async () => {
  errorMessage.value = '';

  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  // Validate password length
  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters';
    return;
  }

  // Validate password strength
  const hasUpperCase = /[A-Z]/.test(password.value);
  const hasLowerCase = /[a-z]/.test(password.value);
  const hasNumber = /[0-9]/.test(password.value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password.value);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    errorMessage.value = 'Password must include uppercase, lowercase, number, and special character';
    return;
  }

  // Validate JDS API token
  if (!jdsApiToken.value || jdsApiToken.value.trim() === '') {
    errorMessage.value = 'JDS API token is required';
    return;
  }

  loading.value = true;

  const result = await authStore.register(username.value, password.value, jdsApiToken.value);

  loading.value = false;

  if (result.success) {
    router.push('/products');
  } else {
    errorMessage.value = result.error;
  }
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0F3F92;
  padding: 20px;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
}

.subtitle {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #0F3F92;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #0F3F92;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(15, 63, 146, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.auth-link {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.auth-link a {
  color: #0F3F92;
  text-decoration: none;
  font-weight: 600;
}

.auth-link a:hover {
  text-decoration: underline;
}

.help-text a {
  color: #0F3F92;
  text-decoration: none;
  font-weight: 600;
}

.help-text a:hover {
  text-decoration: underline;
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-fill.weak {
  background: #f44336;
}

.strength-fill.fair {
  background: #ff9800;
}

.strength-fill.good {
  background: #2196F3;
}

.strength-fill.strong {
  background: #4CAF50;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
}

.strength-text.weak {
  color: #f44336;
}

.strength-text.fair {
  color: #ff9800;
}

.strength-text.good {
  color: #2196F3;
}

.strength-text.strong {
  color: #4CAF50;
}
</style>
