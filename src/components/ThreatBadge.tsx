import React from 'react';

interface ThreatBadgeProps {
  level: number;
}

export function ThreatBadge({ level }: ThreatBadgeProps) {
  const getColorClasses = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 4:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 5:
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-md border caption ${getColorClasses(level)}`}
    >
      Level {level}
    </span>
  );
}
