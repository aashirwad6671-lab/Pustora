'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initializeAuthListener();
      initialized.current = true;
    }
  }, [initializeAuthListener]);

  return <>{children}</>;
}
