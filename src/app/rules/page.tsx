import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Rules — Quiniela 2026',
}

export default async function RulesPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('rules')

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('keyDates')}</h2>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { date: t('date1'), label: t('date1Label'), highlight: true },
            { date: t('date2'), label: t('date2Label') },
            { date: t('date3'), label: t('date3Label') },
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('matchPredictions')}</h2>
        <p className="text-sm text-muted-foreground">{t('matchPredSubtitle')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { rule: t('exactScore'),    pts: t('exactScorePts') },
            { rule: t('correctResult'), pts: t('correctResultPts') },
            { rule: t('upsetBonus'),    pts: t('upsetBonusPts') },
            { rule: t('wrongResult'),   pts: t('wrongResultPts') },
          ].map(({ rule, pts }) => (
            <div key={rule} className="flex justify-between px-4 py-3">
              <span>{rule}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold mt-4">{t('stageMultipliers')}</h3>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { stage: t('groupStage'),     mult: '×1' },
            { stage: t('r32'),            mult: '×2' },
            { stage: t('r16'),            mult: '×3' },
            { stage: t('qf'),             mult: '×4' },
            { stage: t('sf'),             mult: '×5' },
            { stage: t('thirdAndFinal'),  mult: '×7' },
          ].map(({ stage, mult }) => (
            <div key={stage} className="flex justify-between px-4 py-3">
              <span>{stage}</span>
              <span className="font-semibold">{mult}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mt-2">
          <p>{t('missingDefault')}</p>
          <p>{t('knockoutTie')}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('preTournamentPicks')}</h2>
        <p className="text-sm text-muted-foreground">{t('preTournamentSubtitle')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { pick: t('pickChampion'),        pts: '15 pts' },
            { pick: t('pickRunnerUp'),        pts: '10 pts' },
            { pick: t('pick3rd'),             pts: '7 pts' },
            { pick: t('pickAwards'),          pts: '5 pts each' },
            { pick: t('pickFirstElim'),       pts: '5 pts' },
            { pick: t('pickMostYellows'),     pts: '5 pts' },
            { pick: t('pickTotalGoalsExact'), pts: '10 pts' },
            { pick: t('pickTotalGoalsRange'), pts: '5 pts' },
          ].map(({ pick, pts }) => (
            <div key={pick} className="flex justify-between px-4 py-3">
              <span>{pick}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('funBetsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('funBetsRulesSub')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            t('ruleFunBet1'),
            t('ruleFunBet2'),
            t('ruleFunBet3'),
            t('ruleFunBet4'),
            t('ruleFunBet5'),
            t('ruleFunBet6'),
          ].map(bet => (
            <div key={bet} className="flex justify-between px-4 py-3">
              <span>{bet}</span>
              <span className="text-muted-foreground text-xs italic">no pts</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('groupStandingsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('groupStandingsSubtitle')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { pos: t('pos1'), pts: '5 pts' },
            { pos: t('pos2'), pts: '3 pts' },
            { pos: t('pos3'), pts: '2 pts' },
            { pos: t('pos4'), pts: '1 pt' },
          ].map(({ pos, pts }) => (
            <div key={pos} className="flex justify-between px-4 py-3">
              <span>{pos}</span>
              <span className="font-medium">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('thirdPlaceQualifiers')}</h2>
        <p className="text-sm text-muted-foreground">{t('thirdPlaceSubtitle')}</p>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          💡 {t('thirdPlaceSmartNote')}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('communityBetsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('communityBetsSub')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[t('communityBetsHow1'), t('communityBetsHow2'), t('communityBetsHow3')].map(step => (
            <div key={step} className="px-4 py-3">{step}</div>
          ))}
        </div>

        <h3 className="text-sm font-semibold mt-4">{t('communityBetsActiveTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('communityBetsActiveSub')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[
            { bet: t('communityBetsActiveBet1'), pts: t('communityBetsActiveBet1Pts') },
            { bet: t('communityBetsActiveBet2'), pts: t('communityBetsActiveBet2Pts') },
            { bet: t('communityBetsActiveBet3'), pts: t('communityBetsActiveBet3Pts') },
          ].map(({ bet, pts }) => (
            <div key={bet} className="flex justify-between px-4 py-3">
              <span>{bet}</span>
              <span className="font-medium text-green-600 dark:text-green-400 shrink-0 ml-4">{pts}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic">{t('communityBetsNote')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('predictionTools')}</h2>
        <p className="text-sm text-muted-foreground">{t('predictionToolsSub')}</p>
        <div className="border rounded-lg divide-y text-sm">
          {[t('toolSync'), t('toolWarnings'), t('toolQualifiers')].map(tool => (
            <div key={tool} className="px-4 py-3">{tool}</div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('championRebuy')}</h2>
        <p className="text-sm text-muted-foreground">{t('championRebuyBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('faq')}</h2>
        <div className="space-y-4 text-sm">
          {[
            { q: t('faq1q'), a: t('faq1a') },
            { q: t('faq2q'), a: t('faq2a') },
            { q: t('faq3q'), a: t('faq3a') },
            { q: t('faq4q'), a: t('faq4a') },
            { q: t('faq5q'), a: t('faq5a') },
            { q: t('faq6q'), a: t('faq6a') },
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
