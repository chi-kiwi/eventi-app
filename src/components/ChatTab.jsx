import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Info } from 'lucide-react';
import { db } from '../services/db';

export default function ChatTab({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { eventId, otherUserId, otherUserName, eventTitle }
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      setConversations(db.getChatsForUser(user.id));
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      setMessages(db.getChatMessages(activeChat.eventId, user.id, activeChat.otherUserId));
      // Scroll to bottom
      scrollToBottom();
    }
  }, [activeChat, conversations]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const newMsg = db.sendMessage(activeChat.eventId, user.id, activeChat.otherUserId, inputText.trim());
    setInputText('');
    setMessages([...messages, newMsg]);
    
    // Refresh conversations list
    setConversations(db.getChatsForUser(user.id));
    scrollToBottom();

    // Simulator automated response after 2 seconds
    setTimeout(() => {
      const autoText = `Grazie per averci contattato! Abbiamo preso in carico la tua richiesta per l'evento "${activeChat.eventTitle}". Ti risponderemo il prima possibile.`;
      const replyMsg = db.sendMessage(activeChat.eventId, activeChat.otherUserId, user.id, autoText);
      
      // If still viewing the same chat
      if (activeChat.otherUserId === replyMsg.senderId && activeChat.eventId === replyMsg.eventId) {
        setMessages(prev => [...prev, replyMsg]);
      }
      
      setConversations(db.getChatsForUser(user.id));
      scrollToBottom();
    }, 2000);
  };

  if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>Accedi per visualizzare i messaggi.</div>;

  if (activeChat) {
    return (
      <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', padding: 0 }}>
        {/* Chat Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)' }}>
          <button 
            onClick={() => setActiveChat(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeChat.otherUserName}</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discussione su: {activeChat.eventTitle}</span>
          </div>
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.map(msg => {
            const isSent = msg.senderId === user.id;
            return (
              <div 
                key={msg.id} 
                className={`chat-bubble ${isSent ? 'sent' : 'received'}`}
                style={{ alignSelf: isSent ? 'flex-end' : 'flex-start' }}
              >
                <div>{msg.message}</div>
                <span style={{ fontSize: '9px', opacity: 0.7, float: 'right', marginTop: '4px', marginLeft: '8px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Scrivi un messaggio agli organizzatori..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ borderRadius: '24px' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="view-content animate-fade-in">
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>I tuoi Messaggi Privati</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {conversations.map(conv => (
          <div 
            key={`${conv.eventId}_${conv.otherUserId}`}
            className="glass-card animate-slide-in"
            onClick={() => setActiveChat(conv)}
            style={{ padding: '14px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
              <MessageSquare size={20} color="var(--accent-primary)" />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {conv.otherUserName}
                  {conv.otherUserRole === 'organizzatore' && <span style={{ fontSize: '10px', color: 'var(--accent-primary)', marginLeft: '6px' }}>(Org)</span>}
                </h4>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {new Date(conv.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--accent-indigo)', fontWeight: '500', marginTop: '2px' }}>{conv.eventTitle}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conv.lastMessage}
              </p>
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <Info size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
            Nessuna chat attiva. Puoi contattare gli organizzatori cliccando sul pulsante "Chiedi in privato" all'interno dei dettagli di un evento.
          </div>
        )}
      </div>
    </div>
  );
}
