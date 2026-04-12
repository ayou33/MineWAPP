import AuthBrand from './components/AuthBrand'
import AuthForm from './components/AuthForm'

export default function Auth () {
  return (
    <div class="flex min-h-screen bg-c-bg">
      {/* Left brand panel — desktop only */}
      <div class="hidden lg:flex lg:w-[480px] xl:w-[560px] shrink-0">
        <AuthBrand />
      </div>

      {/* Right form panel */}
      <div class="flex-1 flex items-center justify-center px-6 py-12">
        <AuthForm />
      </div>
    </div>
  )
}
