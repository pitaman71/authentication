# Authentication Component Library

A React component library for handling authentication flows with Google and Apple sign-in.

## Installation

```bash
npm install @pitaman71/auth-reactjs
```

## Usage

### 1. Wrap your app with AuthProvider

```tsx
import { AuthProvider } from '@pitaman71/auth-reactjs';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Use the auth hook in your components

```tsx
import { useAuth } from '@pitaman71/auth-reactjs';

function LoginComponent() {
  const { user, loginWithGoogle, loginWithApple, logout } = useAuth();

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={loginWithGoogle}>Sign in with Google</button>
      <button onClick={loginWithApple}>Sign in with Apple</button>
    </div>
  );
}
```

## Environment Configuration

Create a `.env` file in your React project:

```env
REACT_APP_API_URL=http://localhost:3000
```

## Components

### AuthProvider

The main context provider for authentication state and methods.

```tsx
interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

<AuthProvider>
  {children}
</AuthProvider>
```

### LoginScreen

A pre-built login component with Google and Apple sign-in buttons.

```tsx
import { LoginScreen } from '@pitaman71/auth-reactjs';

function App() {
  return (
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
}
```

## Hooks

### useAuth

```tsx
const {
  user,              // Current user information
  loginWithGoogle,   // Initiates Google sign-in
  loginWithApple,    // Initiates Apple sign-in
  logout,            // Logs out the current user
  refreshAccessToken // Refreshes the access token
} = useAuth();
```

### useLocalStorage

A utility hook for persistent storage:

```tsx
const [value, setValue] = useLocalStorage<T>(key: string, initialValue: T);
```

## Protected Routes

Example of protecting routes with authentication:

```tsx
import { useAuth } from '@pitaman71/auth-reactjs';
import { Navigate, Route } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Usage
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <ProtectedComponent />
    </ProtectedRoute>
  }
/>
```

## API Integration

### Token Management

The library automatically handles:
- Token storage in localStorage
- Token refresh
- Token inclusion in API requests

Example API wrapper:

```tsx
import { useAuth } from '@pitaman71/auth-reactjs';

function useApi() {
  const { refreshAccessToken } = useAuth();
  
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const accessToken = localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.status === 401) {
        await refreshAccessToken();
        return apiCall(endpoint, options);
      }
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };
  
  return { apiCall };
}
```

## Customization

### Custom Styling

The library uses Tailwind CSS classes which can be overridden:

```tsx
import { LoginScreen } from '@pitaman71/auth-reactjs';

function CustomLogin() {
  return (
    <div className="my-custom-container">
      <LoginScreen />
    </div>
  );
}
```

### Custom Login Flow

You can create your own login UI while using the auth hooks:

```tsx
import { useAuth } from '@pitaman71/auth-reactjs';

function CustomLoginScreen() {
  const { loginWithGoogle, loginWithApple } = useAuth();
  
  return (
    <div className="custom-login">
      <h1>Welcome</h1>
      <div className="login-buttons">
        <button
          onClick={loginWithGoogle}
          className="custom-google-button"
        >
          Continue with Google
        </button>
        <button
          onClick={loginWithApple}
          className="custom-apple-button"
        >
          Continue with Apple
        </button>
      </div>
    </div>
  );
}
```

## Error Handling

The library provides built-in error handling for common scenarios:

```tsx
import { useAuth } from '@pitaman71/auth-reactjs';

function LoginComponent() {
  const { loginWithGoogle } = useAuth();
  
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      // Handle specific error cases
      if (error.message === 'Popup closed') {
        console.error('Login cancelled by user');
      } else {
        console.error('Login failed:', error);
      }
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## Testing

Example test setup:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@pitaman71/auth-reactjs';

// Mock provider for testing
const TestProvider = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Auth Components', () => {
  it('shows login buttons when user is not authenticated', () => {
    render(
      <TestProvider>
        <LoginScreen />
      </TestProvider>
    );
    
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Apple/i)).toBeInTheDocument();
  });
});
```

## TypeScript Support

The library is written in TypeScript and provides full type definitions:

```tsx
import { User, AuthContextType } from '@pitaman71/auth-reactjs';

// Example type usage
const UserProfile: React.FC<{ user: User }> = ({ user }) => (
  <div>
    <h2>{user.name}</h2>
    <p>{user.email}</p>
  </div>
);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the LICENSE file for details

## Support

For issues and feature requests, please file an issue on the GitHub repository.