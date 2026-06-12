import Script from 'next/script'

const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');var l=t==='light'||(!t&&matchMedia('(prefers-color-scheme:light)').matches);document.documentElement.classList.toggle('light',l)}catch(e){}})()`

export default function ThemeScript() {
  return (
    <Script id="animedula-theme" strategy="beforeInteractive">
      {THEME_INIT}
    </Script>
  )
}
