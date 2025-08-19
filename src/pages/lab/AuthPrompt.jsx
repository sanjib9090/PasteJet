import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Users } from "lucide-react";

export default function AuthPrompt({ theme, themeClasses, navigate }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className={`w-full max-w-md backdrop-blur-md ${themeClasses.cardBg}`}>
        <CardContent className="text-center p-6 sm:p-8 pt-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/20' : theme === 'green' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
            }`}>
            <Users className={`w-8 h-8 ${themeClasses.heroIconColor}`} />
          </div>
          <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${themeClasses.cardTitle}`}>
            Login Required
          </h2>
          <p className={`mb-6 text-sm sm:text-base ${themeClasses.subtitleColor}`}>
            You need to be logged in to join CodeLab rooms
          </p>
          <Button
            onClick={() => navigate('/login')}
            className={`w-full sm:w-auto px-6 py-2 text-base ${themeClasses.primaryButton} text-white shadow-lg`}
          >
            Login to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}