import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginCredentials } from '@/types/api';
import { Loader2, Package } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Demographics/Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-center">
        <div className="max-w-md mx-auto text-white">
          <div className="flex justify-center mb-8">
            <Package className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Inventory Hub
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Professional Multi-Channel Inventory Management System
          </p>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Multi-Channel Support</h3>
                <p className="text-blue-100 text-sm">Shopify, Amazon, eBay integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-blue-100 text-sm">Advanced reporting and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Order Management</h3>
                <p className="text-blue-100 text-sm">Complete order lifecycle tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Stock Control</h3>
                <p className="text-blue-100 text-sm">Automated inventory management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Package className="h-12 w-12 text-blue-600 lg:hidden" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}