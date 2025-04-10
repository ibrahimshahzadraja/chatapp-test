'use client';
import { useEffect } from 'react';

export const ServiceWorkerWrapper = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.error('Service Worker Registration Failed', err));
    }
  }, []);

  return null;
};