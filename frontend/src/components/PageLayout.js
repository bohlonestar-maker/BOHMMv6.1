import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * PageLayout - Reusable layout component for consistent UI across all pages
 * 
 * Props:
 * - title: Page title (required)
 * - icon: Lucide icon component to display next to title (optional)
 * - subtitle: Secondary text below title (optional)
 * - backTo: Route to navigate to when back button is clicked (optional, defaults to "/")
 * - backLabel: Text for back button (optional, defaults to "Back")
 * - showBack: Whether to show back button (optional, defaults to true)
 * - actions: React node(s) to render in the header action area (optional)
 * - children: Page content (required)
 * - maxWidth: Container max width class (optional, defaults to "max-w-7xl")
 */
export default function PageLayout({
  title,
  icon: Icon,
  subtitle,
  backTo = "/",
  backLabel = "Back",
  showBack = true,
  actions,
  children,
  maxWidth = "max-w-7xl"
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(backTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation Bar */}
      <nav className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-3 sm:py-4`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-2 sm:gap-4">
              {showBack && (
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Button>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white">{title}</h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-400">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            {actions && (
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {actions}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-4 sm:py-8`}>
        {children}
      </div>
    </div>
  );
}
