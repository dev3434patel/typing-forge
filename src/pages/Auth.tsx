import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { authService, isBackendConfigured } from '@/services/php-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { BrandWordmark } from '@/components/brand/BrandMark';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(128, 'Password must be at most 128 characters'),
});

const Auth = () => {
  const reducedMotion = useReducedMotion();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [authLoading, user, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      const passwordBytes = new TextEncoder().encode(password).length;
      if (passwordBytes > 128 || !isLogin && passwordBytes < 10) {
        setErrors({ password: 'Use a password between 10 and 128 UTF-8 bytes.' });
        return false;
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isBackendConfigured) { toast({ title: 'Guest practice is ready', description: 'Account services are disabled in this installation.', variant: 'destructive' }); return; }
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(email.trim(), password);

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        });
      } else {
        await authService.signUp(email.trim(), password);

        toast({
          title: 'Account created!',
          description: 'Your account is ready. Your practice will now sync to this account.',
        });
      }
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : 'Could not complete the account request. Try again.';
      
      if (message.includes('User already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      } else if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.';
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        className="w-full min-w-0 max-w-md [&_input]:min-h-11 [&_button]:min-h-11"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : undefined}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrandWordmark className="text-2xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? 'Sign in to track your progress and compete'
              : 'Join the community and start improving'}
          </p>
        </div>

        <div className="stat-card p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && <p className="text-sm text-muted-foreground">Choose your public handle in Profile after signing in. Your email stays private.</p>}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                  required
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isBackendConfigured && <p role="status" className="text-sm text-muted-foreground">Account services are unavailable. Guest practice and local history are ready.</p>}
            <Button type="submit" className="w-full" disabled={loading || !isBackendConfigured}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to typing
          </a>
        </div>
      </motion.div>
    </main>
  );
};

export default Auth;
