import { useNavigate } from "react-router-dom";
import { MoveLeft } from "lucide-react";
import TextEditor from "@/features/write/components/text-editor";

/* ---------------------------------------------------------------------------- */

export default function EditorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
        aria-label="Back to dashboard"
      >
        <MoveLeft className="h-5 w-5 text-gray-200 hover:text-gray-400 cursor-pointer" />
      </button>

      <TextEditor />
    </div>
  );
}
