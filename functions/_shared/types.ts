export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  APP_URL?: string;
  PRODUCT_VERSION?: string;
  PRODUCT_RELEASE_DATE?: string;
}
