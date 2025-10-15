'use client';
import React from 'react';

type HashtagRendererProps = {
  text: string;
  onViewHashtag: (tag: string) => void;
  isExcerpt?: boolean;
  mentionTarget?: string;
};

const HashtagRenderer: React.FC<HashtagRendererProps> = ({ text, onViewHashtag, isExcerpt = false, mentionTarget }) => {
  // Regex for both hashtags and @mentions, but we only make hashtags clickable
  const pattern = /([#@]\w+)/g;
  
  let processedText = text;
  if(isExcerpt) {
      const excerpt = text.substring(text.indexOf('\n') + 1).slice(0, 100) + '...';
      processedText = excerpt.length > 3 ? excerpt : text.slice(0, 100);
  }

  const parts = processedText.split(pattern);

  const handleHashtagClick = (e: React.MouseEvent<HTMLSpanElement>, tag: string) => {
    e.stopPropagation(); // Prevent the parent card's onClick from firing
    onViewHashtag(tag.substring(1)); // Remove '#' before passing
  };

  return (
    <p className={`text-sm ${isExcerpt ? 'text-muted-foreground line-clamp-3' : 'text-foreground whitespace-pre-wrap'}`}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <span
              key={index}
              className="text-primary hover:underline cursor-pointer"
              onClick={(e) => handleHashtagClick(e, part)}
            >
              {part}
            </span>
          );
        }
        if (part.startsWith('@')) {
            const mention = part.substring(1);
            if(mention === mentionTarget){
              return (
                <span key={index} className="text-primary font-semibold">
                  {part}
                </span>
              );
            }
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
};

export default HashtagRenderer;
