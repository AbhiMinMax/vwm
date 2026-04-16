import { useState, useEffect, useRef } from 'react'
import styles from './InfoTip.module.css'

export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  function handleClick(e) {
    e.stopPropagation()
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect()
      const left = Math.min(rect.left, window.innerWidth - 230)
      setPos({ top: rect.bottom + 6, left: Math.max(8, left) })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function dismiss() { setOpen(false) }
    document.addEventListener('click', dismiss)
    return () => document.removeEventListener('click', dismiss)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        className={`${styles.btn} ${open ? styles.open : ''}`}
        onClick={handleClick}
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <div className={styles.tip} style={{ top: pos.top, left: pos.left }}>
          {text}
        </div>
      )}
    </>
  )
}
