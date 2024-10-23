"use client"; 

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/toggle"

export default function Home() {
  const [message, setMessage] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const getMessage = useCallback(async () => {
    try {
      setIsEditable(false);
      setMessage('Loading...');
      const response = await fetch('/api/claude');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const textContent = data.content
        .map((block: { type: string; text: string }) => block.text)
        .join(' ') || 'No message content';
      
      const formattedMessage = textContent.split('\n\n').map((paragraph: string) => paragraph.trim()).join('\n\n');
      setMessage(formattedMessage);
      setIsEditable(true);
    } catch (error) {
      console.error('Error fetching message:', error);
      setMessage('Failed to load message');
      setIsEditable(true);
    }
  }, []);

  useEffect(() => {
    getMessage();
    
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now.toISOString().replace(/[T:]/g, '-').slice(0, -5);
      setCurrentDateTime(formattedDateTime);
    };
   
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
   
    return () => clearInterval(interval);
  }, [getMessage]);

  const copyToClipboard = useCallback(() => {
    if (contentRef.current) {
      const text = contentRef.current.innerText;
      navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  }, []);

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      setMessage(contentRef.current.innerText);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ModeToggle />
      </div>
      
      <header className="text-center mb-8">
        <h1>Agentic Loreform</h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <div 
          ref={contentRef}
          contentEditable={isEditable}
          onInput={handleContentChange}
          className="border p-4 w-full max-w-md text-sm mb-4 whitespace-pre-wrap overflow-y-auto"
          style={{ minHeight: '200px', maxHeight: '60vh' }}
        >
          {message}
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline"
            onClick={copyToClipboard}
            disabled={!message || message === 'Loading...'}
          >
            {isCopied ? 'Copied!' : 'Copy text'}
          </Button>
          <Button 
            variant="outline"
            onClick={getMessage}
            disabled={message === 'Loading...'}
          >
            Regenerate
          </Button>
        </div>
      </main>

      <footer className="mt-8 text-center">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p>{currentDateTime}</p>
              </TooltipTrigger>
              <TooltipContent>momento mori</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.p
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          Experiment by{' '}
          <motion.a
            href="https://x.com/fkpxls"
            whileHover={{ color: "#2b2b2b" }}
          >
            Fakepixels
          </motion.a>
        </motion.p>
      </footer>
    </div>
  );
}
