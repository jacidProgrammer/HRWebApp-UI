import { createContext, useContext, useEffect } from 'react';
import { APP_NAME } from './BrandMark';

export const PageTitleContext = createContext<(title: string) => void>(() => undefined);

/** Sets the top bar heading and the document title for the current page. */
export function usePageTitle(title: string): void {
  const setTitle = useContext(PageTitleContext);
  useEffect(() => {
    setTitle(title);
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title, setTitle]);
}
