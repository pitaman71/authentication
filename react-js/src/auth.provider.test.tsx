// react-js/src/auth.provider.test.tsx
import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from './auth.provider';
import { useAuth } from './auth.hooks';
import { jwtDecode } from 'jwt-decode';

jest.mock('jwt-decode');

interface MockStorage {
    store: Map<string, string>;
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
    has: (key: string) => boolean;
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
}
  
const mockStorage: MockStorage = {
    store: new Map<string, string>(),
    getItem: jest.fn((key) => mockStorage.store.get(key) || null),
    setItem: jest.fn((key, value) => mockStorage.store.set(key, value)),
    removeItem: jest.fn((key) => mockStorage.store.delete(key)),
    clear: jest.fn(() => mockStorage.store.clear()),
    has: (key: string) => mockStorage.store.has(key),
    get: (key: string) => mockStorage.store.get(key),
    set: (key: string, value: string) => mockStorage.store.set(key, value),
};
  
Object.defineProperty(window, 'localStorage', { value: mockStorage });

// Mock location
const mockLocation = new URL('http://localhost:3000');
Object.defineProperty(window, 'location', {
    value: {
        ...window.location,
        href: mockLocation.href,
        search: '',
        assign: jest.fn((url) => {
            mockLocation.href = url;
        }),
    },
    writable: true,
});

const TestComponent = () => {
    const auth = useAuth();
    return (
        <div>
            <div data-testid="user-email">{auth.user?.email}</div>
            <button onClick={() => auth.loginWithGoogle()} data-testid="google-login">
                Google Login
            </button>
            <button onClick={() => auth.loginWithApple()} data-testid="apple-login">
                Apple Login
            </button>
            <button onClick={auth.logout} data-testid="logout">
                Logout
            </button>
        </div>
    );
};

describe('AuthProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage.clear();
        window.location.search = '';
    });

    it('initializes with null user when no token present', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.getByTestId('user-email').textContent).toBe('');
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
        
        expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    });

    it('handles social login redirects', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByTestId('google-login').click();
        });

        expect(window.location.href).toContain('/auth/google/authorize');
    });

    it('handles OAuth callback with tokens', async () => {
        window.location.search = '?accessToken=new-token&refreshToken=new-refresh-token';

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
        });

        expect(mockStorage.get('accessToken')).toBe(JSON.stringify('new-token'));
        expect(mockStorage.get('refreshToken')).toBe(JSON.stringify('new-refresh-token'));
    });

    it('handles logout', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({ ok: true });
        mockStorage.set('accessToken', JSON.stringify('test-token'));
        mockStorage.set('refreshToken', JSON.stringify('test-refresh-token'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByTestId('logout').click();
        });

        expect(mockStorage.has('accessToken')).toBe(false);
        expect(mockStorage.has('refreshToken')).toBe(false);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/logout'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            })
        );
    });

    it('refreshes expired tokens', async () => {
        // Setup expired token
        const expiredToken = {
            sub: '123',
            email: 'test@example.com',
            exp: Math.floor(Date.now() / 1000) - 3600,
        };
        
        (jwtDecode as jest.Mock).mockReturnValue(expiredToken);
        mockStorage.set('accessToken', JSON.stringify('expired-token'));
        mockStorage.set('refreshToken', JSON.stringify('refresh-token'));

        // Mock successful token refresh
        jest.spyOn(global, 'fetch').mockImplementation(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    accessToken: 'new-token',
                    refreshToken: 'new-refresh-token'
                })
            } as Response)
        );

        // Render with expired token, triggering refresh
        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
        });

        // Wait for state updates
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verify API call
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/refresh'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: 'refresh-token' })
            })
        );

        // Verify token was updated
        expect(mockStorage.get('accessToken')).toBe(JSON.stringify('new-token'));
    });
});