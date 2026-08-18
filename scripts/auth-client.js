// UniThrift Custom Email OTP Auth Client SDK
// Connects frontend UI to Node.js Nodemailer Auth Backend

(function(window) {
  const CLOUD_API_URL = 'https://api.unithrift.co.in/api/auth';
  const LOCAL_API_URL = 'http://localhost:5000/api/auth';
  
  // Use localhost when running locally, cloud URL when on live site
  const API_BASE_URL = window.UNITHRIFT_AUTH_API || 
    ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
      ? LOCAL_API_URL 
      : CLOUD_API_URL);
  const TOKEN_KEY = 'unithrift_auth_token';
  const USER_KEY = 'unithrift_user';

  const AuthClient = {
    // 1. Send OTP Code to Email
    async sendOtp(email, role = 'customer') {
      try {
        const response = await fetch(`${API_BASE_URL}/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to send OTP code.');
        }

        // Store pending email for OTP verification step
        sessionStorage.setItem('unithrift_pending_email', email.trim().toLowerCase());
        return data;
      } catch (err) {
        console.error('AuthClient.sendOtp Error:', err);
        throw err;
      }
    },

    // 2. Verify 6-Digit OTP Code
    async verifyOtp(email, otp) {
      try {
        const targetEmail = email || sessionStorage.getItem('unithrift_pending_email');
        if (!targetEmail) {
          throw new Error('Email address is missing. Please enter your email again.');
        }

        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, otp: otp.trim() })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Invalid or expired OTP code.');
        }

        // Store Auth Session
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Sync with existing cached profile key for full site compatibility
        sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(data.user));

        return data;
      } catch (err) {
        console.error('AuthClient.verifyOtp Error:', err);
        throw err;
      }
    },

    // 3. Get Authenticated User Token
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    // 4. Get Current Authenticated User Profile
    getUser() {
      try {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return null;
    },

    // 5. Fetch Fresh User Profile from Server
    async fetchUser() {
      const token = this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(data.user));
          return data.user;
        }
      } catch (err) {}
      return this.getUser();
    },

    // 6. Update User Profile
    async updateProfile(profileData) {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      sessionStorage.setItem('unimatch_cached_profile', JSON.stringify(data.user));
      return data.user;
    },

    // 7. Onboarding Engine Redirect Decision Matrix
    handleAuthWorkflowRedirect(user, defaultRedirect = '/index.html') {
      const currentUser = user || this.getUser();

      if (!currentUser) {
        window.location.href = '/auth/login.html';
        return;
      }

      // Check Profile Completeness
      const hasFullProfile = currentUser.full_name && currentUser.phone_number && currentUser.college;

      if (!hasFullProfile) {
        console.log('[AUTH WORKFLOW] Profile incomplete. Redirecting to Profile Setup...');
        window.location.href = '/auth/profile_setup.html';
        return;
      }

      // Check Student ID Verification Status
      if (!currentUser.is_verified && currentUser.verification_status !== 'pending') {
        console.log('[AUTH WORKFLOW] Student ID unverified. Redirecting to ID Verification...');
        window.location.href = '/auth/id_verification.html';
        return;
      }

      // Fully Onboarded! Redirect to target page or home
      console.log('[AUTH WORKFLOW] Authenticated & Verified. Redirecting to destination...');
      window.location.href = defaultRedirect;
    },

    // 8. Sign Out
    logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem('unimatch_cached_profile');
      sessionStorage.removeItem('unithrift_pending_email');
      window.location.href = '/auth/login.html';
    },

    // 9. Send Real-Time Email Notification (UniThrift & UniMatch)
    async sendEmailNotification({ to, title, message, platform = 'unithrift', actionUrl, actionText }) {
      try {
        if (!to || !to.includes('@')) return null;

        const NOTIFY_API_URL = API_BASE_URL.replace('/api/auth', '/api/notify/send-email');
        const response = await fetch(NOTIFY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: to.trim().toLowerCase(),
            title,
            message,
            platform,
            actionUrl,
            actionText
          })
        });

        const data = await response.json();
        return data;
      } catch (err) {
        console.error('AuthClient.sendEmailNotification Error:', err);
      }
      return null;
    }
  };

  window.AuthClient = AuthClient;
})(window);
