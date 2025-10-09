/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
	readonly VITE_BETTER_AUTH_URL: string;
	readonly VITE_AI_API_BASE?: string;
	readonly VITE_AI_MODEL?: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_GOOGLE_CLIENT_SECRET?: string;
	readonly VITE_ENABLE_ANALYTICS?: 'true' | 'false';
	readonly VITE_ENABLE_GOOGLE_OAUTH?: 'true' | 'false';
	readonly VITE_ENABLE_EXPERIMENTAL_UI?: 'true' | 'false';
	readonly VITE_SENTRY_DSN?: string;
	readonly VITE_APP_VERSION?: string;
	readonly VITE_APP_BUILD_TIME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
