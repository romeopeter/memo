import { useState } from 'react';
import { FileText, MessageSquare, BookOpen, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/shadcn/button';

/* ------------------------------------------------------------------------------- */

export default function WriteStream() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden">
            <Button onClick={() => navigate("/write")}>Write</Button>
        </div>
    );
}