export const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-4 py-3">
    <div className="flex items-center gap-1 bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
      <span className="text-sm text-muted-foreground mr-2">Cola B is thinking</span>
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);
