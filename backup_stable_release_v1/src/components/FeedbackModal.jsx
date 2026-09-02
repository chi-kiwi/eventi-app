import React, { useState, useEffect } from 'react';
import { Award, Star, ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, Smile } from 'lucide-react';
import { db } from '../services/db';

export default function FeedbackModal({ isOpen, onClose, user, events, onFeedbackSubmitted }) {
  const [pastEvent, setPastEvent] = useState(null);
  
  // Feedback Flow States
  const [step, setStep] = useState(1); // 1: Yes/No attended, 2: 3 Questions
  const [attended, setAttended] = useState(null); // true / false
  
  // Survey questions state
  const [rating, setRating] = useState(5);
  const [recommend, setRecommend] = useState(true);
  const [commentText, setCommentText] = useState('');
  
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    // Check if there is any past event that user clicked "Ci sarò" (going)
    // and hasn't submitted feedback for yet.
    const todayStr = new Date().toISOString().split('T')[0];
    const completedFeedbacks = db.getFeedbackDone();

    const pendingEvent = events.find(e => {
      // Event date is strictly in the past
      const isPast = e.date < todayStr;
      const isGoing = e.goingUsers?.includes(user.id);
      const notDone = !completedFeedbacks.includes(e.id);
      return isPast && isGoing && notDone;
    });

    if (pendingEvent) {
      setPastEvent(pendingEvent);
      setStep(1);
    }
  }, [user, events, isOpen]);

  const handleAttendedNo = () => {
    // Just submit and dismiss
    const feedbackData = {
      went: false,
      rating: null,
      recommend: null,
      text: "Non sono andato"
    };

    db.addFeedback(pastEvent.id, user.id, feedbackData);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
      onFeedbackSubmitted();
    }, 1500);
  };

  const handleAttendedYes = () => {
    setAttended(true);
    setStep(2);
  };

  const handleSubmitSurvey = (e) => {
    e.preventDefault();
    
    const feedbackData = {
      went: true,
      rating: rating,
      recommend: recommend,
      text: commentText || "Nessun commento specifico."
    };

    const res = db.addFeedback(pastEvent.id, user.id, feedbackData);
    setSuccessMsg(true);
    
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
      onFeedbackSubmitted();
    }, 2000);
  };

  if (!isOpen || !pastEvent) return null;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content" style={{ padding: '24px', position: 'relative' }}>
        
        {/* Header decoration */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: '8px', color: 'white' }}>
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Questionario Giorno Dopo</h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: 600 }}>Guadagna +50 punti esperienza!</span>
          </div>
        </div>

        {successMsg ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Smile size={48} color="var(--accent-green)" />
            <h4 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Feedback Ricevuto!</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Complimenti! Hai guadagnato <strong style={{ color: 'var(--accent-green)' }}>50 Punti XP</strong> ed aggiornato i tuoi badge sul profilo!
            </p>
          </div>
        ) : (
          <>
            {step === 1 ? (
              // STEP 1: Attended check
              <div className="animate-slide-in">
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Ieri si è tenuto l'evento <strong>"{pastEvent.title}"</strong> a cui avevi confermato la partecipazione.
                </p>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Alla fine sei andato?
                </p>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleAttendedNo}
                    style={{ flex: 1, borderColor: 'var(--border-glass)' }}
                  >
                    No, non sono andato
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleAttendedYes}
                    style={{ flex: 1 }}
                  >
                    Sì, sono andato
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2: 3 Questions survey
              <form onSubmit={handleSubmitSurvey} className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Aiutaci a migliorare gli eventi di <strong>{pastEvent.location}</strong> rispondendo a 3 semplici domande per gli organizzatori.
                </p>

                {/* Q1: Star rating */}
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>1. Come valuteresti l'evento?</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: star <= rating ? 'var(--accent-orange)' : 'var(--text-muted)' }}
                      >
                        <Star size={26} fill={star <= rating ? 'var(--accent-orange)' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2: Recommend */}
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>2. Lo raccomanderesti ad altri amici?</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className={`btn btn-small btn-secondary ${recommend === true ? 'active' : ''}`}
                      onClick={() => setRecommend(true)}
                      style={{ flex: 1, borderColor: recommend === true ? 'var(--accent-green)' : 'var(--border-glass)', color: recommend === true ? 'var(--accent-green)' : 'var(--text-primary)', display: 'flex', gap: '6px' }}
                    >
                      <ThumbsUp size={14} /> Sì
                    </button>
                    <button
                      type="button"
                      className={`btn btn-small btn-secondary ${recommend === false ? 'active' : ''}`}
                      onClick={() => setRecommend(false)}
                      style={{ flex: 1, borderColor: recommend === false ? 'var(--accent-pink)' : 'var(--border-glass)', color: recommend === false ? 'var(--accent-pink)' : 'var(--text-primary)', display: 'flex', gap: '6px' }}
                    >
                      <ThumbsDown size={14} /> No
                    </button>
                  </div>
                </div>

                {/* Q3: Comments */}
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>3. Consigli o pareri per l'organizzatore</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <textarea
                      className="form-input"
                      placeholder="Scrivi qui i tuoi consigli (es. gestione parcheggi, cibo, orari)..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={{ paddingLeft: '40px', height: '60px', resize: 'none', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Invia recensione e riscatta punti
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
