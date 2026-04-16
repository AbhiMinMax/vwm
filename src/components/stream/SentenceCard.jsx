// SentenceCard.jsx — single sentence display with fade-in on reveal.

import styles from './SentenceCard.module.css'

export default function SentenceCard({ number, text, isNew }) {
  return (
    <div className={`${styles.card} ${isNew ? styles.fadeIn : ''}`}>
      <span className={styles.number}>{number}.</span>
      <span className={styles.text}>{text}</span>
    </div>
  )
}
