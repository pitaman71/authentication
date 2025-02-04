// react-js/src/auth.login.tsx
import React from 'react';
import { useAuth } from './auth.hooks';

export const LoginScreen = () => {
  const { loginWithGoogle, loginWithApple } = useAuth();
  
  return (
    <div className="w-full max-w-md p-6 space-y-4">
      <button onClick={loginWithGoogle} 
        className="w-full p-2 border rounded">
        Sign in with Google
      </button>
      <button onClick={loginWithApple}
        className="w-full p-2 border rounded">
        Sign in with Apple
      </button>
    </div>
  );
};
