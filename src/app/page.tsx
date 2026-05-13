import React from 'react';
import styles from './page.module.css';
import FitnessForm from '@/components/FitnessForm';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your Personal <span className={styles.highlight}>Smart Fitness</span> Trainer
          </h1>
          <p className={styles.heroSubtitle}>
            Get highly personalized 6-day workout routines and dynamic 7-day diet charts based on your body and goals.
          </p>
        </div>
      </div>
      
      <div className="container" id="form-section">
        <FitnessForm />
      </div>
    </main>
  );
}
