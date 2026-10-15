import {afterEach,describe,it,expect,vi} from 'vitest';
afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});
describe('optional Supabase client configuration',()=>{
  it('leaves guest practice usable when cloud configuration is absent',async()=>{
    vi.stubEnv('VITE_SUPABASE_URL','');vi.stubEnv('VITE_SUPABASE_ANON_KEY','');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','');vi.resetModules();
    const client=await import('../client');expect(client.isSupabaseConfigured).toBe(false);expect(client.supabase.auth).toBeDefined();
  });
  it('accepts the publishable-key alias without requiring a service credential',async()=>{
    vi.stubEnv('VITE_SUPABASE_URL','https://forge-fixture.invalid');vi.stubEnv('VITE_SUPABASE_ANON_KEY','');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-fixture-key');vi.resetModules();
    const client=await import('../client');expect(client.isSupabaseConfigured).toBe(true);expect(client.supabase.auth).toBeDefined();
  });
  it('treats malformed cloud URLs as unavailable without crashing the app',async()=>{
    vi.stubEnv('VITE_SUPABASE_URL','invalid-url');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public-fixture-key');vi.resetModules();
    const client=await import('../client');expect(client.isSupabaseConfigured).toBe(false);expect(client.supabase.auth).toBeDefined();
  });
});
