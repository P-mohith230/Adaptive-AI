import type { Metadata } from "next";
import AuthShield from "@/components/AuthShield";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptiveAI - Organizational AI Intelligence Platform",
  description:
    "AdaptiveAI continuously evolves your AI infrastructure through multi-agent reasoning, market intelligence, and workflow analysis.",
  keywords: "AI, organizational intelligence, AI infrastructure, workflow automation",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                try {
                  var reason = event.reason;
                  var reasonStr = reason ? (reason.message || reason.stack || String(reason)) : '';
                  if (
                    reasonStr.indexOf('MetaMask') !== -1 ||
                    reasonStr.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                    reasonStr.indexOf('chrome-extension') !== -1
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                } catch(e) {}
              });
              window.addEventListener('error', function(event) {
                try {
                  var filename = event.filename || '';
                  var message = event.message || '';
                  if (
                    filename.indexOf('chrome-extension') !== -1 ||
                    message.indexOf('MetaMask') !== -1
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                } catch(e) {}
              });
            `
          }}
        />
      </head>
      <body style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <AuthShield>
          {children}
        </AuthShield>
      </body>
    </html>
  );
}
