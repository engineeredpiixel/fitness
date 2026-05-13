'use client';

import React, { useState, ChangeEvent, useEffect } from 'react';
import styles from './MealTracker.module.css';
import { supabase, getLocalUserId } from '@/lib/supabase';

const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'midMorning', label: 'Mid-Morning Snack' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'eveningSnack', label: 'Evening Snack' },
  { id: 'dinner', label: 'Dinner' }
];

interface MealState {
  images: string[];
  status: 'pending' | 'analyzing' | 'completed';
  analysis?: string;
  isMatch?: boolean;
  feedback?: string;
}

export default function MealTracker({ targetGoal, planId }: { targetGoal: string, planId: string | null }) {
  const [mealData, setMealData] = useState<Record<string, MealState>>(
    MEALS.reduce((acc, meal) => ({ ...acc, [meal.id]: { images: [], status: 'pending' } }), {})
  );
  
  const [localUserId, setLocalUserId] = useState<string>('');

  useEffect(() => {
    setLocalUserId(getLocalUserId());
  }, []);

  const handleImageUpload = (mealId: string, e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImagesCount = mealData[mealId].images.length;
    if (currentImagesCount + files.length > 10) {
      alert("You can upload a maximum of 10 pictures per meal.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealData(prev => ({
          ...prev,
          [mealId]: { 
            ...prev[mealId], 
            images: [...prev[mealId].images, reader.result as string],
            status: 'pending' 
          }
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const analyzeMeal = async (mealId: string) => {
    const meal = mealData[mealId];
    if (meal.images.length === 0) return;

    setMealData(prev => ({ ...prev, [mealId]: { ...prev[mealId], status: 'analyzing' } }));

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: meal.images,
          mealType: MEALS.find(m => m.id === mealId)?.label,
          targetGoal
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMealData(prev => ({
        ...prev,
        [mealId]: {
          ...prev[mealId],
          status: 'completed',
          analysis: data.analysis,
          isMatch: data.isMatch,
          feedback: data.feedback
        }
      }));

      // Save to Supabase
      if (planId) {
        const { error } = await supabase.from('meal_logs').insert([{
          local_user_id: localUserId,
          plan_id: planId,
          meal_type: MEALS.find(m => m.id === mealId)?.label,
          analysis: data.analysis,
          is_match: data.isMatch,
          feedback: data.feedback
        }]);
        if (error) console.error("Error saving meal log:", error);
      }
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
      setMealData(prev => ({ ...prev, [mealId]: { ...prev[mealId], status: 'pending' } }));
    }
  };

  return (
    <div className={styles.trackerContainer} id="meal-tracker">
      <h2 className={styles.title}>Daily Diet Tracker</h2>
      <p className={styles.subtitle}>Upload your meal photos to ensure you are on track with your "{targetGoal}" goal.</p>

      <div className={styles.mealList}>
        {MEALS.map((meal) => {
          const state = mealData[meal.id];
          const isDone = state.status === 'completed';

          return (
            <div key={meal.id} className={`${styles.mealCard} ${isDone ? styles.completed : ''}`}>
              <div className={styles.mealHeader}>
                <div className={styles.mealName}>
                  <div className={styles.statusIcon}>{isDone ? '✓' : ''}</div>
                  {meal.label}
                </div>
              </div>

              {!isDone && (
                <div className={styles.uploadArea}>
                  {state.images.length < 10 && (
                    <label className={styles.uploadBtn}>
                      {state.images.length > 0 ? 'Add More Photos' : 'Upload Photos'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className={styles.hiddenInput} 
                        onChange={(e) => handleImageUpload(meal.id, e)}
                      />
                    </label>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {state.images.map((imgSrc, idx) => (
                      <img key={idx} src={imgSrc} alt={`Preview ${idx + 1}`} className={styles.previewImg} />
                    ))}
                  </div>
                  
                  {state.images.length > 0 && (
                    <button 
                      className="btn-primary" 
                      onClick={() => analyzeMeal(meal.id)}
                      disabled={state.status === 'analyzing'}
                    >
                      {state.status === 'analyzing' ? 'Scanning...' : `Analyze Meal (${state.images.length})`}
                    </button>
                  )}
                </div>
              )}

              {isDone && state.analysis && (
                <div className={`${styles.feedbackBox} ${state.isMatch ? styles.success : styles.warning}`}>
                  <div className={styles.analysisText}>{state.analysis}</div>
                  <div className={styles.feedbackText}>{state.feedback}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
