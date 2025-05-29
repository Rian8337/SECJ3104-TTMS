import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function Home() {
 
  const isLoggedIn = false

  if (isLoggedIn) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-red-800 to-red-900">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 pr-4">
          <Image priority={true} 
            src="/LOGO UTM REVERSE (putih).png"
            alt="UTM Logo"
            width={200}
            height={200}
            
            style={{
              width: 'auto',
              height: 'auto',
              marginTop: '1rem',
              marginBottom: '1rem',
              marginLeft: '2rem',
              marginRight: '2rem'
            }}          />
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
