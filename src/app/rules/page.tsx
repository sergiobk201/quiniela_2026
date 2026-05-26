import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Rules — Quiniela 2026',
}

export default async function RulesPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Rules &amp; Scoring</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Everything you need to know to play Quiniela 2026.
        </p>
      </div>

      {/* Key dates */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Key Dates</h2>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { date: 'June 4, 2026',  label: 'Pre-tournament sheet locks', highlight: true },
            { date: 'June 11, 2026', label: 'FIFA World Cup 2026 kicks off' },
            { date: 'July 19, 2026', label: 'World Cup Final' },
          ].map(({ date, label, highlight }) => (
            <div
              key={date}
              className={`flex justify-between px-4 py-3 ${highlight ? 'font-semibold' : ''}`}
            >
              <span className={highlight ? 'text-destructive' : 'text-muted-foreground'}>{date}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Match predictions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Match Predictions</h2>
        <p className="text-sm text-muted-foreground">
          Predict the exact score of every match. Points are multiplied by the stage.
        </p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { rule: 'Exact score',    pts: '5 pts × multiplier' },
            { rule: 'Correct result', pts: '2 pts × multiplier' },
            { rule: 'Upset bonus',    pts: '+3 pts (flat, on top of any correct result)' },
            { rule: 'Wrong result',   pts: '0 pts' },
          ].map(({ rule, pts }) => (
            <div key={rule} className="flex justify-between px-4 py-3">
              <span>{rule}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold mt-4">Stage Multipliers</h3>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { stage: 'Group Stage', mult: '×1' },
            { stage: 'Round of 32', mult: '×2' },
            { stage: 'Round of 16', mult: '×3' },
            { stage: 'Quarter-Finals', mult: '×4' },
            { stage: 'Semi-Finals', mult: '×5' },
            { stage: '3rd Place / Final', mult: '×7' },
          ].map(({ stage, mult }) => (
            <div key={stage} className="flex justify-between px-4 py-3">
              <span>{stage}</span>
              <span className="font-semibold">{mult}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mt-2">
          <p>• Missing prediction defaults to 0–0.</p>
          <p>• Knockout ties: if you predicted a tie and the match went to penalties, the home team is assumed to win 1–0 for scoring purposes.</p>
        </div>
      </section>

      {/* Pre-tournament */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pre-Tournament Picks</h2>
        <p className="text-sm text-muted-foreground">
          Submit before June 4. Cannot be changed after the lock.
        </p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { pick: 'Champion', pts: '15 pts' },
            { pick: 'Runner-up', pts: '10 pts' },
            { pick: '3rd Place', pts: '7 pts' },
            { pick: 'Golden Boot / Glove / Kopa', pts: '5 pts each' },
            { pick: 'First team eliminated', pts: '5 pts' },
            { pick: 'Most yellow cards (team)', pts: '5 pts' },
            { pick: 'Total goals (exact)', pts: '10 pts' },
            { pick: 'Total goals (within ±5)', pts: '5 pts' },
          ].map(({ pick, pts }) => (
            <div key={pick} className="flex justify-between px-4 py-3">
              <span>{pick}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Group standings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Group Standings</h2>
        <p className="text-sm text-muted-foreground">
          Predict final standings for all 12 groups.
          Max 11 pts per group × 12 groups = <strong>132 pts</strong>.
        </p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { pos: '1st place correct', pts: '5 pts' },
            { pos: '2nd place correct', pts: '3 pts' },
            { pos: '3rd place correct', pts: '2 pts' },
            { pos: '4th place correct', pts: '1 pt' },
          ].map(({ pos, pts }) => (
            <div key={pos} className="flex justify-between px-4 py-3">
              <span>{pos}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3rd place qualifiers */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3rd-Place Qualifiers</h2>
        <p className="text-sm text-muted-foreground">
          Pick 8 of the 12 group 3rd-place teams you think will advance.
          3 pts per correct pick. Max <strong>24 pts</strong>.
        </p>
      </section>

      {/* Champion rebuy */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Champion Rebuy</h2>
        <p className="text-sm text-muted-foreground">
          If your predicted champion gets eliminated, the admin will unlock a one-time rebuy.
          Pick a new champion for a reduced points reward. You get one rebuy — use it wisely.
        </p>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: 'What if I miss a match prediction?',
              a: 'It defaults to 0–0. You get 2 pts × multiplier if the match actually ends 0–0; 0 pts otherwise.',
            },
            {
              q: 'Can I change my predictions after saving?',
              a: 'Yes, until the lock time for that match. Group stage locks 1 hour before kickoff.',
            },
            {
              q: 'When do scores update?',
              a: 'After each match, the admin enters the result and triggers a recompute. The leaderboard updates live.',
            },
            {
              q: 'How is the upset bonus awarded?',
              a: 'When the admin marks a match as an upset AND you correctly predicted the result, you get +3 pts flat.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="space-y-1">
              <p className="font-medium">{q}</p>
              <p className="text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
