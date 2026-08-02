import { PostheartsDrawer } from '@/components/posthearts-drawer'

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">Labs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          UI experiments and interaction playground
        </p>
      </div>
      <PostheartsDrawer />
    </main>
  )
}
