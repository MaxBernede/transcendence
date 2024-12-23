import React from "react";

// export default function AuthLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <section className="w-full">
//       <div className="h-screen flex items-center justify-center">
//         {children}
//       </div>
//     </section>
//   );
// }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
	  <div className="flex justify-center items-center min-h-screen px-4">
		<div className="w-full max-w-lg">{children}</div>
	  </div>
	);
  }
  