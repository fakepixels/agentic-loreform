"use client"; 

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/toggle"

const CACHE_KEY = 'cachedMessage';
const CACHE_TIMESTAMP_KEY = 'lastApiCallTimestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default function Home() {
  const [message, setMessage] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [nextOracleTime, setNextOracleTime] = useState('');

  useEffect(() => {
    async function getMessage() {
      try {
        const cachedMessage = localStorage.getItem(CACHE_KEY);
        const lastApiCallTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const currentTime = new Date().getTime();

        if (cachedMessage && lastApiCallTimestamp && (currentTime - Number.parseInt(lastApiCallTimestamp) < CACHE_DURATION)) {
          
          setMessage(cachedMessage);
        } else {
          // If cache is expired or doesn't exist, make a new API call
          const response = await fetch('/api/claude');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const textContent = data.content
            .map((block: { type: string; text: string }) => block.text)
            .join(' ') || 'No message content';
          
          const formattedMessage = textContent.split('\n\n').map((paragraph: string) => paragraph.trim()).join('\n\n');
          
          // Cache the new message and timestamp
          localStorage.setItem(CACHE_KEY, formattedMessage);
          localStorage.setItem(CACHE_TIMESTAMP_KEY, currentTime.toString());

          setMessage(formattedMessage);
        }
      } catch (error) {
        console.error('Error fetching message:', error);
        setMessage('Failed to load message');
      }
    }

    getMessage(); 

    // Set up interval to fetch message every hour
    const messageInterval = setInterval(getMessage, CACHE_DURATION);
    
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now.toISOString().replace(/[T:]/g, '-').slice(0, -5);
      setCurrentDateTime(formattedDateTime);
    };
   
    const updateNextOracleTime = () => {
      const lastApiCallTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (lastApiCallTimestamp) {
        const nextCallTime = Number.parseInt(lastApiCallTimestamp) + CACHE_DURATION;
        const timeRemaining = nextCallTime - new Date().getTime();
        
        if (timeRemaining > 0) {
          const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
          setNextOracleTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setNextOracleTime('Now');
        }
      } else {
        setNextOracleTime('Now');
      }
    };

    updateDateTime();
    updateNextOracleTime();
   
    return () => {
      clearInterval(messageInterval); 
    };
  }, []); // Empty dependency array to run only once on mount

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [message]);

  return (
    <div className="flex flex-col min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ModeToggle />
      </div>
      
      <header className="text-center mb-8">
        <h1 className="text-xs">Agentic Loreform</h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <div 
          className="border p-4 w-full max-w-md text-sm mb-4 whitespace-pre-wrap overflow-y-auto"
          style={{ minHeight: '200px', maxHeight: '60vh' }}
        >
          <div className="text-xs w-full text-center">
            {message || 'Loading...'}
          </div>
        </div>
        <Button 
          className="text-xs"
          variant="outline"
          onClick={copyToClipboard}
          disabled={!message}
        >
          {isCopied ? 'Copied!' : 'Copy text'}
        </Button>
        <div className="mt-4 text-xs">
          Next Oracle — {nextOracleTime}
        </div>
      </main>

      <footer className="text-xs mt-auto pt-8 text-center">
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
