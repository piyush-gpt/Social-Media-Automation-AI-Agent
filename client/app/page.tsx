'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Linkedin, Twitter, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | null>(null);
  const router = useRouter();

  const handleAuth = async (platform: 'linkedin' | 'twitter') => {
    setIsLoading(true);
    setSelectedPlatform(platform);

    if (platform === 'linkedin') {
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      const redirectUri = encodeURIComponent("http://localhost:3000/linkedin-callback");
      const state = Math.random().toString(36).substring(2);
      const scope = encodeURIComponent("openid profile email w_member_social");
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
      return;
    }

    // Twitter logic (dummy for now)
    setTimeout(() => {
      router.push('/agent');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Social Media Agent
          </h1>
          <p className="text-gray-600 text-lg">
            AI-powered content creation for your social media
          </p>
        </div>

        {/* Features */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">What you'll get:</h2>
          <div className="space-y-3">
            {[
              'AI-generated content for LinkedIn & Twitter',
              'Smart image suggestions',
              'Real-time feedback and editing',
              'Professional tone optimization',
              'Multi-platform support'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => handleAuth('linkedin')}
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl border-2 transition-all duration-200 ${
              isLoading && selectedPlatform === 'linkedin'
                ? 'bg-linkedin/80 text-white border-linkedin/80'
                : 'bg-white hover:bg-linkedin hover:text-white border-linkedin text-linkedin hover:border-linkedin'
            } shadow-lg hover:shadow-xl`}
          >
            {isLoading && selectedPlatform === 'linkedin' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Linkedin className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isLoading && selectedPlatform === 'linkedin' ? 'Connecting...' : 'Continue with LinkedIn'}
            </span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleAuth('twitter')}
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl border-2 transition-all duration-200 ${
              isLoading && selectedPlatform === 'twitter'
                ? 'bg-twitter/80 text-white border-twitter/80'
                : 'bg-white hover:bg-twitter hover:text-white border-twitter text-twitter hover:border-twitter'
            } shadow-lg hover:shadow-xl`}
          >
            {isLoading && selectedPlatform === 'twitter' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Twitter className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isLoading && selectedPlatform === 'twitter' ? 'Connecting...' : 'Continue with Twitter'}
            </span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
