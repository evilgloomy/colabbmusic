import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";

const CHAT_URL = "https://www.artistagent.ai/chat/cola-b";

const ChatPage = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <PageLayout hideFooter>
      <div className="relative w-full" style={{ height: "calc(100vh - 4rem)" }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading Chat with Cola B…</p>
            </div>
          </div>
        )}
        <iframe
          src={CHAT_URL}
          title="Chat with Cola B"
          className="w-full h-full border-0"
          allow="clipboard-write; microphone"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </PageLayout>
  );
};

export default ChatPage;
