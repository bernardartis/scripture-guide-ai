// app/copyright/page.tsx
// Required by API.Bible Terms of Service.
// Every licensed verse display must link here.

import { getCopyrightPageData } from '@/lib/bible/router'

export const metadata = {
  title: 'Bible Translation Copyrights — ScriptureGuide AI',
}

export default function CopyrightPage() {
  const { free, licensed } = getCopyrightPageData()

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">Bible translation copyrights</h1>
      <p className="text-gray-600 mb-8 text-sm">
        ScriptureGuide AI displays Bible verses from the following translations.
        Public domain translations are free to use without restriction.
        Licensed translations are used with permission from their copyright holders.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4 border-b pb-2">Public domain translations</h2>
        <div className="space-y-3">
          {free.map((v) => (
            <div key={v.code} className="text-sm">
              <span className="font-mono font-medium bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-2">
                {v.code}
              </span>
              {v.notice}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4 border-b pb-2">Licensed translations</h2>
        <div className="space-y-4">
          {licensed.map((v) => (
            <div key={v.code} className="text-sm">
              <span className="font-mono font-medium bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-2">
                {v.code}
              </span>
              {v.notice}{' '}
              {v.url && (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {new URL(v.url).hostname}
                </a>
              )}
            </div>
          ))}
          {licensed.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              No licensed translations currently active. All verses served from public domain sources.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4 border-b pb-2">Scripture API provider</h2>
        <p className="text-sm text-gray-600">
          Public domain Scripture content is provided via the{' '}
          <a href="https://free.helloao.org" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            AO Lab Free Use Bible API
          </a>
          , operated by AO Lab (a nonprofit), MIT licensed.
          Licensed translation content (when active) is provided via{' '}
          <a href="https://api.bible" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            API.Bible
          </a>
          , operated by American Bible Society.
        </p>
      </section>
    </main>
  )
}
