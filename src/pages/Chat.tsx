import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Loader, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Chat, Message, Profile } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const chatIdParam = searchParams.get('id');

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(chatIdParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchChats();
    if (chatIdParam) {
      setActiveChat(chatIdParam);
      setMobileView('chat');
    }
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat);

    // Real-time subscription using Supabase Realtime
    const sub = supabase
      .channel(`messages:${activeChat}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${activeChat}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChat]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*, other_one:profiles!participant_one(*), other_two:profiles!participant_two(*)')
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const enriched = data.map((chat: any) => ({
        ...chat,
        other_user: chat.participant_one === user.id ? chat.other_two : chat.other_one,
      }));
      setChats(enriched);
    }
    setLoading(false);
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user?.id ?? '');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;
    setSendingMsg(true);

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      chat_id: activeChat,
      sender_id: user.id,
      content,
    });

    if (!error) {
      // Update last_message in chat
      await supabase
        .from('chats')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', activeChat);
      fetchChats();
    }
    setSendingMsg(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(c =>
    c.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChatObj = chats.find(c => c.id === activeChat);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Sign in to access chat</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[calc(100vh-8rem)]">

          {/* Sidebar - chat list */}
          <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => { setActiveChat(chat.id); setMobileView('chat'); fetchMessages(chat.id); }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      activeChat === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {chat.other_user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {chat.other_user?.full_name ?? 'Unknown'}
                          </p>
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatDate(chat.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{chat.last_message || 'No messages yet'}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main chat area */}
          <div className={`flex-1 flex flex-col ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}>
            {activeChat && activeChatObj ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <button
                    className="md:hidden text-gray-400 hover:text-gray-600"
                    onClick={() => setMobileView('list')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {activeChatObj.other_user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{activeChatObj.other_user?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 capitalize">{activeChatObj.other_user?.role}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    const showDate = i === 0 || formatDate(msg.created_at) !== formatDate(messages[i - 1].created_at);
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-1' : 'order-2'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={sendMessage} className="px-5 py-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !newMessage.trim()}
                      className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500">Select a conversation</h3>
                  <p className="text-gray-400 text-sm mt-1">Choose from your conversations on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
