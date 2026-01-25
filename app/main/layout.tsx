// app/main/layout.tsx (MAIN LAYOUT - Glass container, NO sidebar yet)
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-screen w-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/arid-bg.jpg')" }}
    >
      {/* green overlay */}
      <div className="absolute inset-0 bg-green-900/70 backdrop-blur-sm"></div>

      {/* main glass container */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-[95%] max-w-7xl h-[90%] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}