// Frontend components needed:

// 1. ForgotPassword.js
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.forgotPassword(email);
      setMessage('Reset link sent to your email!');
    } catch (error) {
      setMessage(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required 
      />
      <button type="submit">Send Reset Link</button>
      {message && <p>{message}</p>}
    </form>
  );
};

// 2. ResetPassword.js  
const ResetPassword = () => {
  const { token } = useParams(); // From URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await authService.resetPassword(token, password);
      // Redirect to login with success message
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="password" 
        value={password}
        placeholder="New password"
        required 
      />
      <input 
        type="password" 
        value={confirmPassword}
        placeholder="Confirm password"
        required 
      />
      <button type="submit">Reset Password</button>
    </form>
  );
};

// 3. Routes in App.js
<Route exact path="/forgot-password">
  <ForgotPassword />
</Route>
<Route exact path="/reset-password/:token">
  <ResetPassword />
</Route>