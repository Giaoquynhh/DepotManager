import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Custom hook to handle route changes and force component refresh
 * This ensures that when navigating from Request page to any other page,
 * the component will be properly refreshed with fresh data
 */
export function useRouteRefresh() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (router.isReady) {
      setRefreshKey(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  useEffect(() => {
    const handleRouteChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return refreshKey;
}

/**
 * Custom hook to force data refresh when route changes
 * This ensures fresh data is fetched when navigating between pages
 */
export function useDataRefresh() {
  const router = useRouter();
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [previousPath, setPreviousPath] = useState('');

  useEffect(() => {
    if (router.isReady) {
      setShouldRefresh(true);
      setPreviousPath(router.pathname);
    }
  }, [router.pathname, router.isReady]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Force refresh when navigating from Request to Gate
      if (previousPath === '/LowerContainer/Request' && url === '/LowerContainer/Gate') {
        setShouldRefresh(true);
      }
      // Force refresh when navigating from Gate to Request
      else if (previousPath === '/LowerContainer/Gate' && url === '/LowerContainer/Request') {
        setShouldRefresh(true);
      }
      // Force refresh for any other route changes
      else if (previousPath !== url) {
        setShouldRefresh(true);
      }
      setPreviousPath(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, previousPath]);

  const resetRefresh = () => setShouldRefresh(false);

  return { shouldRefresh, resetRefresh };
}
