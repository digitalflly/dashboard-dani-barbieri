import { useDashboard } from './lib/useDashboard'
import { headerVM } from './lib/viewmodel'
import { funisVM } from './lib/funisvm'
import Header from './components/Header'
import ContaPage from './components/ContaPage'
import ConteudosPage from './components/ConteudosPage'
import InsightsPage from './components/InsightsPage'
import FunisPage from './components/FunisPage'

export default function App() {
  const dash = useDashboard()
  const { model: M, state: S } = dash
  const hv = headerVM(M, S)
  const funis = funisVM(S)

  return (
    <div
      className="dash"
      style={{
        minHeight: '100vh',
        background: 'var(--surface-page)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-body)',
        paddingBottom: 64,
      }}
    >
      <Header dash={dash} candFilters={funis.candFilters} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1, margin: 0, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
            {hv.pageTitle}
          </h1>
        </div>

        {hv.dormant && (
          <div
            className="b-card"
            style={{ padding: '16px 20px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--warning-bg)', borderColor: 'transparent' }}
          >
            <span style={{ flex: 'none', width: 8, height: 8, borderRadius: 999, background: 'var(--warning)', marginTop: 7 }}></span>
            <div>
              <div data-keepcase="1" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--wine-900)', lineHeight: 1.4 }}>
                Conta sem atividade em 2026 — pronta para retomar
              </div>
              <div data-keepcase="1" style={{ fontSize: 12.5, color: 'var(--wine-900)', lineHeight: 1.5, marginTop: 3 }}>
                A conexão ao vivo com @{M.profile.handle} está funcionando, mas o perfil não registra publicações nem alcance em 2026 (conta
                dormente). Os números abaixo refletem o que a API retorna hoje — assim que você voltar a postar, o painel preenche sozinho.
              </div>
            </div>
          </div>
        )}

        {S.page === 'conta' && <ContaPage dash={dash} />}
        {S.page === 'conteudos' && <ConteudosPage dash={dash} />}
        {S.page === 'insights' && <InsightsPage dash={dash} />}
        {S.page === 'candidaturas' && <FunisPage dash={dash} funis={funis} />}
      </main>
    </div>
  )
}
