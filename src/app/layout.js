export const metadata = {
  title: "QC Inspection | Worldwide Electrical Services",
  description: "Equipment quality control inspection checklist",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body style={{ margin: 0, background: "#f1f5f9", WebkitOverflowScrolling: "touch" }}>
        {children}
      </body>
    </html>
  );
}
