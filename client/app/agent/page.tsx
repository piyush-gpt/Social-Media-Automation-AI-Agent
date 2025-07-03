'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Sparkles, 
  Image, 
  Edit3, 
  Check, 
  X, 
  RotateCcw, 
  Download,
  Linkedin,
  Twitter,
  MessageSquare,
  Bot,
  User,
  Save,
  Edit
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface InterruptData {
  content: string;
  type: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptData | null>(null);
  const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('linkedin');
  const [imageWanted, setImageWanted] = useState(false);
  const [postDraft, setPostDraft] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // New state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: inputValue,
          platform: platform,
          image_wanted: imageWanted,
          linkedin_access_token: localStorage.getItem("linkedin_access_token"),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      return data.session_id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  const streamExecution = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/stream/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'interrupt') {
                setCurrentInterrupt(data.data);
                setIsStreaming(false);
                return;
              } else if (data.type === 'completion') {
                setPostDraft(data.data.post_draft || '');
                setImageUrl(data.data.image_url || '');
                setIsStreaming(false);
                return;
              } else if (data.type === 'error') {
                console.error('Stream error:', data.message);
                setIsStreaming(false);
                return;
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming:', error);
      setIsStreaming(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const sessionId = await createSession();
      await streamExecution(sessionId);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (responseType: string, responseData: any) => {
    if (!sessionId) return;

    try {
      const response = await fetch('http://localhost:8000/api/human-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          response_type: responseType,
          response_data: responseData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      const data = await response.json();
      
      if (data.type === 'interrupt') {
        setCurrentInterrupt(data.data);
      } else if (data.type === 'completion') {
        setPostDraft(data.data.post_draft || '');
        setImageUrl(data.data.image_url || '');
        setCurrentInterrupt(null);
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startEditing = () => {
    setEditingContent(currentInterrupt?.content || '');
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (editingContent.trim()) {
      await handleFeedback('user_edit', editingContent);
      setIsEditing(false);
      setEditingContent('');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingContent('');
  };

  const submitCustomFeedback = async () => {
    if (customFeedback.trim()) {
      await handleFeedback('feedback', customFeedback);
      setCustomFeedback('');
      setShowFeedbackInput(false);
    }
  };

  const submitCustomImageUrl = async () => {
    if (customImageUrl.trim()) {
      await handleFeedback('image_url', customImageUrl);
      setCustomImageUrl('');
      setShowImageUrlInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Social Media Agent</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPlatform('linkedin')}
                  className={`p-2 rounded-lg transition-colors ${
                    platform === 'linkedin' 
                      ? 'bg-linkedin text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Linkedin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPlatform('twitter')}
                  className={`p-2 rounded-lg transition-colors ${
                    platform === 'twitter' 
                      ? 'bg-twitter text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Twitter className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setImageWanted(!imageWanted)}
                className={`p-2 rounded-lg transition-colors ${
                  imageWanted 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Include image"
              >
                <Image className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm">Tell me what you'd like to post about</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'agent' && (
                          <Bot className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-gray-500" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What would you like to post about?"
                    className="flex-1 input-field"
                    disabled={isLoading || isStreaming}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isLoading || isStreaming}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Interrupt Handler */}
            {currentInterrupt && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {currentInterrupt.type === 'post feedback' ? 'Post Review' : 'Image Review'}
                </h3>
                
                {currentInterrupt.type === 'post feedback' ? (
                  <div className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          rows={6}
                          placeholder="Edit your post content..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEdit}
                            className="flex-1 btn-primary text-sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 btn-secondary text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm">{currentInterrupt.content}</p>
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="space-y-2">
                        <button
                          onClick={startEditing}
                          className="w-full btn-secondary text-sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Post
                        </button>
                        
                        <button
                          onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                          className="w-full btn-secondary text-sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Give Feedback
                        </button>
                        
                        {showFeedbackInput && (
                          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                            <textarea
                              value={customFeedback}
                              onChange={(e) => setCustomFeedback(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                              rows={3}
                              placeholder="Tell me what changes you'd like..."
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={submitCustomFeedback}
                                className="flex-1 btn-primary text-sm"
                                disabled={!customFeedback.trim()}
                              >
                                Submit Feedback
                              </button>
                              <button
                                onClick={() => {
                                  setShowFeedbackInput(false);
                                  setCustomFeedback('');
                                }}
                                className="flex-1 btn-secondary text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleFeedback('satisfied', true)}
                          className="w-full btn-primary text-sm"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Looks Good
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img 
                        src={currentInterrupt.content} 
                        alt="Generated" 
                        className="w-full rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                        className="w-full btn-secondary text-sm"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Use Different Image
                      </button>
                      
                      {showImageUrlInput && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="url"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter image URL..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={submitCustomImageUrl}
                              className="flex-1 btn-primary text-sm"
                              disabled={!customImageUrl.trim()}
                            >
                              Use This Image
                            </button>
                            <button
                              onClick={() => {
                                setShowImageUrlInput(false);
                                setCustomImageUrl('');
                              }}
                              className="flex-1 btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleFeedback('satisfied', true)}
                        className="w-full btn-primary text-sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Preview */}
            {postDraft && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Post Preview</h3>
                  <div className="flex items-center space-x-2">
                    {platform === 'linkedin' ? (
                      <Linkedin className="w-4 h-4 text-linkedin" />
                    ) : (
                      <Twitter className="w-4 h-4 text-twitter" />
                    )}
                    <span className="text-sm text-gray-500 capitalize">{platform}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{postDraft}</p>
                </div>
                
                {imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={imageUrl} 
                      alt="Post image" 
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex-1 btn-primary text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setInputValue('Write a professional post about AI trends')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  💡 AI trends post
                </button>
                <button
                  onClick={() => setInputValue('Create a motivational quote for professionals')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  ✨ Motivational quote
                </button>
                <button
                  onClick={() => setInputValue('Write about remote work best practices')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  🏠 Remote work tips
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 