// react-js/src/auth.hooks.tsx
import React from 'react';

import { AuthContext } from './auth.provider';

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
