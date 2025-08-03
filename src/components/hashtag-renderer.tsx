'use client';
import React from 'react';

type HashtagRendererProps = {
  text: string;
  onViewHashtag: (tag: string) => void;
  isExcerpt?: boolean;
};

const HashtagRenderer: React.FC<HashtagRendererProps> = ({ text, onViewHashtag, isExcerpt = false }) => {
  const hashtagRegex = /(#\w+)/g;
  
  let processedText = text;
  if(isExcerpt) {
      const excerpt = text.substring(text.indexOf('\n') + 1).slice(0, 100) + '...';
      processedText = excerpt.length > 3 ? excerpt : text.slice(0, 100);
  }

  const parts = processedText.split(hashtagRegex);

  const handleHashtagClick = (e: React.MouseEvent<HTMLSpanElement>, tag: string) => {
    e.stopPropagation(); // Prevent the parent card's onClick from firing
    onViewHashtag(tag.substring(1)); // Remove '#' before passing
  };

  return (
    <p className={`text-sm ${isExcerpt ? 'text-muted-foreground line-clamp-3' : 'text-foreground whitespace-pre-wrap'}`}>
      {parts.map((part, index) => {
        if (hashtagRegex.test(part)) {
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
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
};

export default HashtagRenderer;
