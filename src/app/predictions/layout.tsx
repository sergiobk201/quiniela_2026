import PredictionsNav from './predictions-nav'

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PredictionsNav />
      <main>{children}</main>
    </div>
  )
}
