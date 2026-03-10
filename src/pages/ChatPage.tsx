import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ChatAuthForm } from '@/components/chat/ChatAuthForm';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useArtistAgentAuth } from '@/contexts/ArtistAgentAuth';
import { artistAgent } from '@/lib/artistAgent';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'character';
  created_at: string;
}

const ChatPage = () => {
  const { user, session, loading: authLoading, signOut } = useArtistAgentAuth();
  const [character, setCharacter] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  // Load character + conversation once authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPageLoading(false);
      return;
    }
    initChat();
  }, [user, authLoading]);

  const initChat = async () => {
    setPageLoading(true);
    setError('');
    try {
      // 1. Look up Cola B character by name
      const { data: charData, error: charErr } = await artistAgent
        .from('characters')
        .select('id,name,greeting,description,personality,system_prompt,instruction_details,avatar_url,is_premium,is_public')
        .ilike('name', 'Cola B')
        .limit(1)
        .maybeSingle();

      if (charErr || !charData) {
        setError('Could not find Cola B character. Please try again later.');
        setPageLoading(false);
        return;
      }
      setCharacter(charData);

      // 2. Find or create conversation
      const { data: existingConvo } = await artistAgent
        .from('conversations')
        .select('*')
        .eq('user_id', user!.id)
        .eq('character_id', charData.id)
        .maybeSingle();

      let convoId: string;

      if (existingConvo) {
        convoId = existingConvo.id;
      } else {
        const { data: newConvo, error: convoErr } = await artistAgent
          .from('conversations')
          .insert({
            user_id: user!.id,
            character_id: charData.id,
            title: `Chat with ${charData.name}`,
          })
          .select()
          .single();

        if (convoErr || !newConvo) {
          setError('Could not start conversation. Please try again.');
          setPageLoading(false);
          return;
        }
        convoId = newConvo.id;

        // Add greeting
        if (charData.greeting?.trim()) {
          await artistAgent.from('messages').insert({
            conversation_id: convoId,
            content: charData.greeting,
            sender: 'character',
            message_type: 'text',
          });
        }
      }

      setConversationId(convoId);

      // 3. Fetch messages
      const { data: msgs } = await artistAgent
        .from('messages')
        .select('id,content,sender,created_at,message_type')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });

      setMessages(
        (msgs || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          sender: m.sender as 'user' | 'character',
          created_at: m.created_at,
        }))
      );
    } catch (err) {
      console.error('Chat init error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSend = useCallback(async (content: string) => {
    if (!conversationId || !character || !session) return;
    setIsSending(true);

    try {
      // Save user message
      const { data: savedMsg } = await artistAgent
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender: 'user',
          message_type: 'text',
        })
        .select()
        .single();

      const userMessage: Message = {
        id: savedMsg?.id || crypto.randomUUID(),
        content,
        sender: 'user',
        created_at: savedMsg?.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Call chat-with-ai edge function
      const { data: aiData, error: aiError } = await artistAgent.functions.invoke('chat-with-ai', {
        body: {
          message: content,
          conversationId,
          characterId: character.id,
          characterName: character.name,
          characterPersonality: character.personality,
          characterDescription: character.description,
          characterInstructions: character.instruction_details,
          systemPrompt: character.system_prompt,
        },
      });

      if (aiError) throw aiError;

      const aiContent = aiData?.response || 'Sorry, I could not generate a response.';

      // Save AI message
      const { data: savedAi } = await artistAgent
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: aiContent,
          sender: 'character',
          message_type: 'text',
        })
        .select()
        .single();

      const aiMessage: Message = {
        id: savedAi?.id || crypto.randomUUID(),
        content: aiContent,
        sender: 'character',
        created_at: savedAi?.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation timestamp
      await artistAgent
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Send error:', err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: '❌ Failed to send message. Please try again.',
        sender: 'character',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, character, session]);

  // Loading state
  if (authLoading || pageLoading) {
    return (
      <PageLayout hideFooter>
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading Chat with Cola B…</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <PageLayout hideFooter>
        <div style={{ height: 'calc(100vh - 4rem)' }}>
          <ChatAuthForm />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout hideFooter>
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="text-center space-y-3">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={initChat}>Try Again</Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout hideFooter>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Chat header */}
        <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {character?.avatar_url && (
              <img
                src={character.avatar_url}
                alt={character.name}
                className="w-9 h-9 rounded-full object-cover border border-border"
              />
            )}
            <div>
              <h1 className="text-sm font-semibold text-foreground font-sora">{character?.name || 'Cola B'}</h1>
              <p className="text-xs text-muted-foreground">AI Chat</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isSending}
          characterName={character?.name || 'Cola B'}
        />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </PageLayout>
  );
};

export default ChatPage;
