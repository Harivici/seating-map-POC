import { useEffect } from 'react'
import Script from 'next/script'

export default function Home() {
  const loadScript = () => {
    if (typeof window !== 'undefined' && window.VIInit) {
      console.log('has window', window.VIInit)
      const instance = window.VIInit()
      instance.initSeatSelector({
        holder: 'map',
        baseUrl: 'https://seatmap.vivenu.dev',
        eventId: '642ccf05f3622e50a284b00e',
      })
    }
  }

  useEffect(() => {
    loadScript()
  }, [])

  const handleScriptLoad = () => {
    loadScript()
  }

  return (
    <>
      <div>test</div>
      <div id="map"></div>
      <Script
        beforeInteractive
        type="application/javascript"
        src="https://seatmap.vivenu.dev/js/init.js"
        onLoad={handleScriptLoad}
      />
    </>
  )
}
