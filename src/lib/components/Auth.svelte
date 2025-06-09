<script lang="ts">
  import siteConfig from '../../../site.config.js';

  let email = '';
  let password = '';
  let errorMessage = '';

  async function handleSubmit() {
    errorMessage = ''; // Clear previous errors
    console.log('Auth form submitted');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Auth Source URL:', siteConfig.auth?.sourceUrl);

    // Placeholder for actual API call to siteConfig.auth.sourceUrl
    try {
      // Simulate API call
      // const response = await fetch(siteConfig.auth?.sourceUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Auth success:', data);

      if (siteConfig.auth?.destinationUrl) {
        window.location.href = siteConfig.auth.destinationUrl;
      } else {
        console.log('No destination URL configured.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      errorMessage = 'Authentication failed. Please try again.';
    }
  }
</script>

<div class="auth-container">
  <h2>Sign In / Sign Up</h2>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="email">Email:</label>
      <input type="email" id="email" bind:value={email} required />
    </div>
    <div class="form-group">
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required />
    </div>
    {#if errorMessage}
      <p class="error-message">{errorMessage}</p>
    {/if}
    <button type="submit">Submit</button>
  </form>
</div>

<style>
  .auth-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .form-group {
    margin-bottom: 1rem;
  }
  label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: bold;
  }
  input[type="email"],
  input[type="password"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 3px;
    box-sizing: border-box; /* Ensures padding doesn't affect width */
  }
  button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 1rem;
  }
  button:hover {
    background-color: #0056b3;
  }
  .error-message {
    color: red;
    background-color: #fdd;
    border: 1px solid red;
    padding: 0.5rem;
    border-radius: 3px;
    margin-bottom: 1rem;
    text-align: center;
  }
  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
</style>
