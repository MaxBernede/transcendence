// components/MessageInput.tsx
import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
}) => {
  return (
    <div className="mt-4 flex items-center gap-2">
      <Input
        type="text"
        placeholder="Type your message..."
        className="flex-1"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />
      <Button
        onClick={onSend}
        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
      >
        <MessageSquare size={18} />
        Send
      </Button>
    </div>
  );
};

export default MessageInput;
