import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { completeOAuthCallback, isAuthCallbackRoute } from './lib/auth';

const AUTH_ERROR_KEY = 'desierotictales_auth_error';

async function bootstrap() {
  if (isAuthCallbackRoute()) {
    const { error } = await completeOAuthCallback();
    if (error) {
      sessionStorage.setItem(AUTH_ERROR_KEY, error);
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();