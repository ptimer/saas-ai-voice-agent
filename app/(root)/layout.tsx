import { ReactNode } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/actions/auth.action';

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();

  if (!isUserAuthenticated) redirect("/sign-in");

  // TODO: logo as a component
  return (
    <div className="root-layout">
      <Link href="/" className="flex flex-row items-center gap-2">
        <Image 
          src="/logo.svg"
          width={38}
          height={32}
          alt="logo"
        />
        <h2 className="text-primary-100">PrepWise</h2>
      </Link>
      
      {children}
    </div>
  )
}

export default RootLayout;