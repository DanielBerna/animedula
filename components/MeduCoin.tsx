import { CURRENCY, formatCoins } from '../lib/economy'

type Props = {
  amount?: number
  size?: number
  showName?: boolean
  className?: string
}

/** Icono + monto de la moneda del sitio (MéduCoins). */
export default function MeduCoin({ amount, size = 16, showName = false, className = '' }: Props) {
  return (
    <span className={`medu-coin ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden
        className="medu-coin-icon"
      >
        <defs>
          <radialGradient id="meduCoinFill" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="45%" stopColor="#f5b301" />
            <stop offset="100%" stopColor="#b8860b" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#meduCoinFill)" stroke="#8a6300" strokeWidth="1" />
        <circle cx="12" cy="12" r="8.4" fill="none" stroke="#fff2c9" strokeWidth="1" opacity="0.7" />
        <text
          x="12"
          y="16.4"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#7a5200"
          fontFamily="system-ui, sans-serif"
        >
          M
        </text>
      </svg>
      {amount != null ? <span className="medu-coin-amount">{formatCoins(amount)}</span> : null}
      {showName ? <span className="medu-coin-name">{CURRENCY.name}</span> : null}
    </span>
  )
}
