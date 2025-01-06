export default function AuthLayout({
	children,
  }: {
	children: React.ReactNode;
  }) {
	return (
	  <div className="flex justify-center items-center min-h-screen px-4">
		<div className="w-full max-w-lg">{children}</div>
	  </div>
	);
  }
  