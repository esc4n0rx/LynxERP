import { lazy, ComponentType, LazyExoticComponent } from 'react';

interface AppCache {
  [key: string]: LazyExoticComponent<ComponentType<any>>;
}

const appCache: AppCache = {};

export function loadApp(internalCode: string): LazyExoticComponent<ComponentType<any>> {
  // Verifica se o app já está no cache
  if (appCache[internalCode]) {
    return appCache[internalCode];
  }

  // Carrega o app dinamicamente
  const AppComponent = lazy(() =>
    import(`@/apps/${internalCode}/index`)
      .catch(() => {
        console.error(`Failed to load app: ${internalCode}`);
        // Retorna componente de erro
        return import('@/components/apps/AppNotFound');
      })
  );

  // Adiciona ao cache
  appCache[internalCode] = AppComponent;

  return AppComponent;
}

export function clearAppCache(internalCode?: string) {
  if (internalCode) {
    delete appCache[internalCode];
  } else {
    // Limpa todo o cache
    Object.keys(appCache).forEach(key => delete appCache[key]);
  }
}

export function getLoadedApps(): string[] {
  return Object.keys(appCache);
}
