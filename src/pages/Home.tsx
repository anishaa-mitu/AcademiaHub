import { Link } from 'react-router-dom';
import { BookOpen, Users, Zap, ShoppingBag, Award, ArrowRight, GraduationCap, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />

        {/* Floating cards — decorative */}
        <div className="absolute top-16 right-12 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-48">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Earnings</span>
            </div>
            <p className="text-white font-bold text-xl">৳12,400</p>
            <p className="text-blue-200 text-xs mt-1">+24% this month</p>
          </div>
        </div>

        <div className="absolute bottom-16 right-24 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-44">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Materials</span>
            </div>
            <p className="text-white font-bold text-xl">1,240+</p>
            <p className="text-blue-200 text-xs mt-1">Study resources</p>
          </div>
        </div>

        <div className="absolute top-24 left-12 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-44">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Tutors</span>
            </div>
            <p className="text-white font-bold text-xl">320+</p>
            <p className="text-blue-200 text-xs mt-1">Expert tutors</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative px-4 py-28 sm:py-36 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Bangladesh's Academic Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Unlock Your <br />
            <span className="text-blue-200">Academic Potential</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Buy notes, sell materials, and connect with tutors easily. Share knowledge, earn money, and succeed together.
          </p>

          {!user ? (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
          ) : (
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-14 flex-wrap">
            {[
              { label: 'Students', value: '5,000+' },
              { label: 'Materials', value: '1,200+' },
              { label: 'Tutors', value: '320+' },
              { label: 'Earnings Paid', value: '৳2M+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-white font-bold text-2xl">{stat.value}</p>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">Everything you need to buy, sell and learn — all in one place.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShoppingBag, title: 'Sell Materials', desc: 'Upload PDF notes, books, projects & earn money from other students', color: 'bg-blue-50 text-blue-600' },
              { icon: Award, title: 'Learn from Tutors', desc: 'Connect with expert tutors in any subject and get personalized help', color: 'bg-purple-50 text-purple-600' },
              { icon: Users, title: 'Contact via WhatsApp', desc: 'Message sellers and tutors directly via WhatsApp for quick deals', color: 'bg-green-50 text-green-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links for logged in users */}
      {user && (
        <section className="px-4 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Access</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { to: '/materials', icon: BookOpen, label: 'Browse Materials', color: 'text-blue-600 bg-blue-50' },
                { to: '/tutors', icon: GraduationCap, label: 'Find Tutors', color: 'text-purple-600 bg-purple-50' },
                { to: '/dashboard', icon: Zap, label: 'My Dashboard', color: 'text-amber-600 bg-amber-50' },
                { to: '/wanted', icon: ShoppingBag, label: 'Wanted List', color: 'text-green-600 bg-green-50' },
              ].map((link, i) => (
                <Link key={i} to={link.to}
                  className="bg-white hover:shadow-md p-6 rounded-2xl border border-gray-100 text-center transition-all hover:-translate-y-0.5">
                  <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{link.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}