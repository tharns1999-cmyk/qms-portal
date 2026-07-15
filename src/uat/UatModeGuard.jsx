import React from 'react';

export function UatModeGuard({ children }) {
  if (import.meta.env.MODE !== 'uat') {
    return null; // Silent failure in production
  }
  return <>{children}</>;
}
