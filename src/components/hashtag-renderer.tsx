'use client';
import React from 'react';

type HashtagRendererProps = {
  text: string;
  onViewHashtag: (tag: string) => void;
  isExcerpt?: boolean;
  mentionTarget?: string;
};

const HashtagRenderer: React.FC<HashtagRendererProps> = ({ text, onViewHashtag, isExcerpt = false, mentionTarget }) => {
  // Regex for hashtags, @mentions, and URLs
  const pattern = /(https?:\/\/\S+|www\.\S+|[#@]\w+)/g;
  
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
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Prevent the parent card's onClick from firing
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
        if (part.match(/^(https?:\/\/\S+|www\.\S+)/)) {
            const href = part.startsWith('www.') ? `http://${part}` : part;
            return (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline cursor-pointer"
                  onClick={handleLinkClick}
                >
                  {part}
                </a>
            );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
};

export default HashtagRenderer;
