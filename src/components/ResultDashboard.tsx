'use client';

import React from 'react';
import styles from './ResultDashboard.module.css';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

interface RoutineDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

interface MealDetail {
  food: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

interface DietDay {
  day: string;
  totalCalories: string;
  macros: string;
  meals: {
    breakfast: MealDetail;
    midMorning: MealDetail;
    lunch: MealDetail;
    eveningSnack: MealDetail;
    dinner: MealDetail;
  };
}

interface ResultData {
  error?: string;
  physiqueAnalysis?: string;
  advice?: string;
  trainingRoutine?: RoutineDay[];
  dietChart?: DietDay[];
}

export default function ResultDashboard({ data }: { data: ResultData }) {
  if (data.error) {
    return (
      <div className={styles.dashboardContainer} style={{ marginTop: '2rem' }}>
        <div className={styles.errorBox}>
          <h3>⚠️ Image Analysis Issue</h3>
          <p>{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer} id="results" style={{ marginTop: '2rem' }}>
      <h2 className={styles.title}>Your Custom Plan</h2>
      
      {data.physiqueAnalysis && (
        <div className={styles.analysisBox}>
          <h3 className={styles.sectionTitle} style={{fontSize: '1.4rem'}}>🔍 Current Physique Analysis</h3>
          <p className={styles.advice}>{data.physiqueAnalysis}</p>
        </div>
      )}
      
      {data.advice && (
        <div style={{ marginTop: '1rem' }}>
          <p className={styles.advice}><strong>💡 Expert Advice:</strong> {data.advice}</p>
        </div>
      )}

      {data.trainingRoutine && data.trainingRoutine.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>6-Day Training Routine</h3>
          <div className={styles.grid}>
            {data.trainingRoutine.map((day, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span>{day.day}</span>
                </div>
                <div className={styles.cardFocus}>Focus: {day.focus}</div>
                
                <ul className={styles.exerciseList}>
                  {day.exercises.map((ex, eIdx) => (
                    <li key={eIdx} className={styles.exerciseItem}>
                      <div className={styles.exerciseName}>{ex.name}</div>
                      <div className={styles.exerciseDetails}>
                        <span>Sets: {ex.sets}</span>
                        <span>Reps: {ex.reps}</span>
                      </div>
                      {ex.notes && <div className={styles.exerciseNotes}>* {ex.notes}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.dietChart && data.dietChart.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>7-Day Bangladeshi Diet Chart</h3>
          <div className={styles.grid}>
            {data.dietChart.map((day, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span>{day.day}</span>
                  <span className={styles.macroPill}>{day.totalCalories}</span>
                </div>
                <div className={styles.cardFocus}>{day.macros}</div>
                
                <ul className={styles.mealList}>
                  {Object.entries(day.meals).map(([mealTime, mealDetail], mIdx) => {
                    const formattedTime = mealTime.replace(/([A-Z])/g, ' $1').trim();
                    const detail = mealDetail as MealDetail;
                    return (
                      <li key={mIdx} className={styles.mealItem}>
                        <div className={styles.mealTime}>{formattedTime}</div>
                        <div className={styles.mealFood}>{detail.food}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '0.3rem', fontWeight: 500 }}>
                          🔥 {detail.calories} | 🥩 Pro: {detail.protein} | 🍚 Carb: {detail.carbs} | 🥑 Fat: {detail.fats}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
