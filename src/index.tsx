declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface CustomCaptureEvents {
      click: Event;
    }
  }
}

import { isDev } from '@/config'
import '@/features/dateFormat'

if (isDev) {
  import('@/tools/mock/mock.setup')
}

import Fallback from '@/components/RenderFallback'
import PageLoading from '@/components/loading/Loading.page'
import KeepAliveProvider from '@/features/keepAlive/Provider'

import { loadLang } from '@/features/i18n'
import { Routes } from '@generouted/solid-router/lazy'
import { ErrorBoundary } from 'solid-js'
import { render, Suspense } from 'solid-js/web'

import application from '@/app/application'

import './style/index.scss'
import './style/tailwind.css'

function Root () {
  return (
    <ErrorBoundary fallback={(err, reset) => <Fallback error={err} reset={reset} />}>
      <KeepAliveProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes />
        </Suspense>
      </KeepAliveProvider>
    </ErrorBoundary>
  )
}

const root = document.body

function renderApp () {
  render(Root, root!)
}

function loading () {
  function loaded () {
    const loading = root!.querySelector('#loading')!

    if (loading) {
      root!.removeChild(loading)
    }
  }

  return loaded
}

const loaded = loading()

application.ready()
  .then(() => {
    loadLang(l => `/lang/${l}.json`, () => {
      loaded()
      renderApp()
    })
  })
