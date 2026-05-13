'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import styles from './FitnessForm.module.css';
import ResultDashboard from './ResultDashboard';
import MealTracker from './MealTracker';
import { supabase, getLocalUserId } from '@/lib/supabase';

interface FormData {
  age: string;
  weight: string;
  goal: string;
  duration: string;
  healthIssues: string;
}

const BODY_PARTS = [
  { id: 'bicep', label: 'Bicep' },
  { id: 'tricep', label: 'Tricep' },
  { id: 'forearm', label: 'Forearm' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'lowerBack', label: 'Lower Back' },
  { id: 'belly', label: 'Belly' },
  { id: 'legs', label: 'Legs' },
];

export default function FitnessForm() {
  const [formData, setFormData] = useState<FormData>({
    age: '',
    weight: '',
    goal: 'weight_loss',
    duration: '',
    healthIssues: '',
  });

  const [images, setImages] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (partId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => ({
        ...prev,
        [partId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (partId: string) => {
    setImages(prev => {
      const updated = { ...prev };
      delete updated[partId];
      return updated;
    });
  };

  const [resultData, setResultData] = useState<any>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [localUserId, setLocalUserId] = useState<string>('');

  useEffect(() => {
    setLocalUserId(getLocalUserId());
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultData(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }
      
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setResultData(data);
        console.log("Result:", data);
        
        // Save to Supabase
        if (data.trainingRoutine && data.dietChart) {
          const { data: insertData, error: insertError } = await supabase
            .from('fitness_plans')
            .insert([{
              local_user_id: localUserId,
              goal: formData.goal,
              duration_months: formData.duration,
              physique_analysis: data.physiqueAnalysis,
              training_routine: data.trainingRoutine,
              diet_chart: data.dietChart
            }])
            .select()
            .single();
            
          if (insertError) {
            console.error("Failed to save to Supabase:", insertError);
          } else if (insertData) {
            setCurrentPlanId(insertData.id);
          }
        }
        
        alert("Plan generated and saved successfully!");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.sectionTitle}>1. Personal Information</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label htmlFor="age">Age</label>
            <input 
              type="number" 
              id="age" 
              name="age" 
              className={styles.inputField} 
              placeholder="e.g., 28" 
              value={formData.age}
              onChange={handleInputChange}
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="weight">Weight (kg/lbs)</label>
            <input 
              type="text" 
              id="weight" 
              name="weight" 
              className={styles.inputField} 
              placeholder="e.g., 75 kg" 
              value={formData.weight}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="goal">Fitness Goal</label>
            <select 
              id="goal" 
              name="goal" 
              className={styles.selectField}
              value={formData.goal}
              onChange={handleInputChange}
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="fat_loss">Fat Loss (Maintain Weight)</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="recomposition">Recomposition (Fat Loss & Muscle)</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="duration">Goal Duration (Months)</label>
            <input 
              type="number" 
              id="duration" 
              name="duration" 
              className={styles.inputField} 
              placeholder="e.g., 3" 
              value={formData.duration}
              onChange={handleInputChange}
              required 
            />
          </div>
        </div>

        <div className={styles.inputGroup} style={{ marginBottom: '2.5rem' }}>
          <label htmlFor="healthIssues">Health Issues or Injuries (Optional)</label>
          <textarea 
            id="healthIssues" 
            name="healthIssues" 
            className={styles.textareaField} 
            placeholder="e.g., Knee pain, asthma, diabetes..."
            value={formData.healthIssues}
            onChange={handleInputChange}
          ></textarea>
        </div>

        <h2 className={styles.sectionTitle}>2. Physique Analysis (Images)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Upload photos of these specific body parts. The system will analyze them together to understand your current fitness level perfectly.
          <br /><br />
          <strong style={{ color: 'var(--accent-primary)' }}>Tip:</strong> For the most accurate analysis, please ensure your photos are taken in good lighting and are not blurry.
        </p>

        <div className={styles.imageUploadGrid}>
          {BODY_PARTS.map((part) => {
            const hasImage = !!images[part.id];
            
            return (
              <div key={part.id} className={`${styles.imageUploadCard} ${hasImage ? styles.hasImage : ''}`}>
                {!hasImage ? (
                  <label htmlFor={`upload-${part.id}`} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
                    <span className={styles.uploadIcon}>+</span>
                    <span className={styles.uploadLabel}>{part.label}</span>
                    <input 
                      type="file" 
                      id={`upload-${part.id}`} 
                      accept="image/*" 
                      className={styles.hiddenInput} 
                      onChange={(e) => handleImageUpload(part.id, e)}
                    />
                  </label>
                ) : (
                  <>
                    <img src={images[part.id]!} alt={part.label} className={styles.previewImage} />
                    <button type="button" className={styles.removeImage} onClick={() => removeImage(part.id)}>×</button>
                    <div className={styles.partNameBadge}>{part.label}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isSubmitting}>
          {isSubmitting ? 'Analyzing Data & Generating Plan...' : 'Generate My Custom Plan'}
        </button>
      </form>

      {resultData && (
        <div style={{ marginTop: '4rem' }}>
          <ResultDashboard data={resultData} />
          
          {/* Diet Tracker Section */}
          <div style={{ marginTop: '4rem' }}>
            <MealTracker targetGoal={formData.goal} planId={currentPlanId} />
          </div>
        </div>
      )}
    </div>
  );
}
