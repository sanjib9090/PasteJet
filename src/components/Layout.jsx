import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Code2, 
  Home, 
  Clipboard, 
  LayoutDashboard, 
  Sun, 
  Moon, 
  Users,
  Leaf,
  LogIn
} from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Layout({ children, user }) {
  const [theme, setTheme] = useState('dark'); // 'dark', 'orange', 'green'
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const cycleTheme = () => {
    const themes = ['dark', 'orange', 'green'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "CodeLab", path: "/codelab", icon: Users },
    { name: "Clipboard", path: "/clipboard", icon: Clipboard },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }
  ];

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100',
          headerBg: 'bg-white/80 border-emerald-200/50 shadow-lg shadow-emerald-500/10',
          logoGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          titleGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent',
          text: 'text-gray-600',
          mutedText: 'text-gray-600',
          activeButton: 'bg-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-500/25',
          hoverButton: 'text-gray-700 hover:text-gray-900 hover:bg-emerald-100/50',
          userBadge: 'bg-emerald-100 text-emerald-700',
          outlineButton: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400',
          primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25',
          bottomNavBg: 'bg-white/90 border-emerald-200/50',
          activeNavText: 'text-emerald-600',
          navText: 'text-gray-600 hover:text-gray-900'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-rose-50 via-orange-50 to-pink-100',
          headerBg: 'bg-white/80 border-orange-200/50 shadow-lg shadow-orange-500/10',
          logoGradient: 'bg-gradient-to-r from-orange-500 to-pink-500',
          titleGradient: 'bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent',
          text: 'text-gray-600',
          mutedText: 'text-gray-600',
          activeButton: 'bg-orange-500/20 text-orange-600 shadow-lg shadow-orange-500/25',
          hoverButton: 'text-gray-700 hover:text-gray-900 hover:bg-orange-100/50',
          userBadge: 'bg-orange-100 text-orange-700',
          outlineButton: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400',
          primaryButton: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/25',
          bottomNavBg: 'bg-white/90 border-orange-200/50',
          activeNavText: 'text-orange-600',
          navText: 'text-gray-600 hover:text-gray-900'
        };
      default: // dark
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900',
          headerBg: 'bg-gray-900/80 border-gray-700/50 shadow-lg shadow-purple-500/10',
          logoGradient: 'bg-gradient-to-r from-purple-500 to-blue-500',
          titleGradient: 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent',
          text: 'text-white',
          mutedText: 'text-gray-400',
          backgroundColor: '#1a1a1a', // Match dark theme
          activeButton: 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/25',
          hoverButton: 'text-gray-300 hover:text-white hover:bg-gray-800/50',
          userBadge: 'bg-purple-500/20 text-purple-300',
          outlineButton: 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500',
          primaryButton: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25',
          bottomNavBg: 'bg-gray-900/90 border-gray-700/50',
          activeNavText: 'text-purple-400',
          navText: 'text-gray-400 hover:text-gray-300'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const getThemeIcon = () => {
    switch (theme) {
      case 'green':
        return <Leaf className="w-5 h-5" />;
      case 'orange':
        return <Sun className="w-5 h-5" />;
      default:
        return <Moon className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses.bg}`}>
      {/* Desktop Header */}
      {!isMobile && (
        <header className={`border-b backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${themeClasses.headerBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg ${themeClasses.logoGradient}`}>
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold transition-all duration-300 ${themeClasses.titleGradient}`}>
                    PasteJet
                  </h1>
                  <p className={`text-xs transition-colors duration-300 ${themeClasses.mutedText}`}>
                    Share • Sync • Collaborate
                  </p>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link key={item.name} to={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        isActivePage(item.path)
                          ? themeClasses.activeButton
                          : themeClasses.hoverButton
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                ))}
              </nav>

              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleTheme}
                  className={`transition-all duration-200 ${themeClasses.hoverButton}`}
                  title={`Switch to ${theme === 'dark' ? 'Orange' : theme === 'orange' ? 'Green' : 'Dark'} theme`}
                >
                  {getThemeIcon()}
                </Button>

                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full ${themeClasses.userBadge}`}>
                      <span className="text-sm font-medium">{user.displayName || user.email}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className={`transition-all duration-200 ${themeClasses.outlineButton}`}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link to="/login">
                    <Button
                      className={`transition-all duration-200 ${themeClasses.primaryButton} text-white`}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <header className={`border-b backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${themeClasses.headerBg}`}>
          <div className="px-4">
            <div className="flex justify-between items-center h-14">
              <Link to="/" className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${themeClasses.logoGradient}`}>
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className={`text-lg font-bold ${themeClasses.titleGradient}`}>
                  PasteJet
                </span>
              </Link>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleTheme}
                  className={`w-8 h-8 ${themeClasses.hoverButton}`}
                >
                  {getThemeIcon()}
                </Button>

                {user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={`text-xs ${themeClasses.hoverButton}`}
                  >
                    Logout
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button
                      size="sm"
                      className={`text-xs ${themeClasses.primaryButton} text-white`}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {React.cloneElement(children, { theme, user })}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className={`fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl z-40 transition-all duration-300 ${themeClasses.bottomNavBg}`}>
          <div className="grid grid-cols-4 h-16">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  isActivePage(item.path)
                    ? themeClasses.activeNavText
                    : themeClasses.navText
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}