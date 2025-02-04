import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider } from './auth.provider';
import { useAuth } from './auth.hooks';
import { jwtDecode } from 'jwt-decode';

jest.mock('jwt-decode');

// Mock storage
const mockStorage = new Map<string, string>();

const localStorageMock = {
  getItem: jest.fn((key: string) => mockStorage.get(key) || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock event listener management with proper types
type EventHandler = (event: MessageEvent) => void;
const eventListeners: { [key: string]: EventHandler[] } = {};

const mockAddEventListener = jest.fn((event: string, handler: EventHandler) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(handler);
});

const mockRemoveEventListener = jest.fn((event: string, handler: EventHandler) => {
  if (!eventListeners[event]) return;
  const idx = eventListeners[event].indexOf(handler);
  if (idx > -1) {
    eventListeners[event].splice(idx, 1);
  }
});

window.addEventListener = mockAddEventListener as any;
window.removeEventListener = mockRemoveEventListener as any;

// Helper to trigger events
const triggerEvent = (event: string, data: any) => {
  if (eventListeners[event]) {
    eventListeners[event].forEach(handler => 
      handler(new MessageEvent('message', {
        data,
        origin: 'http://localhost:3000'
      }))
    );
  }
};

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user-email">{auth.user?.email}</div>
      <button onClick={auth.loginWithGoogle} data-testid="google-login">Google Login</button>
      <button onClick={auth.logout} data-testid="logout">Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    Object.keys(eventListeners).forEach(key => {
      delete eventListeners[key];
    });
    window.open = jest.fn().mockReturnValue({ closed: false });
  });

  it('initializes with null user when no token present', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('user-email')?.textContent).toBe('');
  });

  it('initializes user from valid access token', () => {
    const mockDecodedToken = {
      sub: '123',
      email: 'test@example.com',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    (jwtDecode as jest.Mock).mockReturnValue(mockDecodedToken);
    
    mockStorage.set('accessToken', JSON.stringify('valid-token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email')?.textContent).toBe('test@example.com');
  });

  it('handles Google login flow', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('google-login');
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('/auth/google'),
      'Google Sign In',
      expect.any(String)
    );

    const mockTokenResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    await act(async () => {
      triggerEvent('message', mockTokenResponse);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'accessToken',
      JSON.stringify(mockTokenResponse.accessToken)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'refreshToken',
      JSON.stringify(mockTokenResponse.refreshToken)
    );
  });

  it('handles logout', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true
      })
    );

    mockStorage.set('accessToken', JSON.stringify('test-token'));
    mockStorage.set('refreshToken', JSON.stringify('test-refresh-token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByTestId('logout');
    
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(mockStorage.has('accessToken')).toBe(false);
    expect(mockStorage.has('refreshToken')).toBe(false);
  });
});