import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReflectionsTable } from './reflections-table';
import type { Reflection } from '@/hooks/use-reflections';

describe('ReflectionsTable', () => {
  it('renders the table with reflections', () => {
    const mockReflections: Reflection[] = [
      {
        _id: '1',
        user_id: 'user1',
        date: '2025-10-17T10:00:00.000Z',
        day: '2025-10-17',
        reflection: {
          barometer: 'Comfort Zone',
          tech_sessions: {
            session_name: ['React'],
            happy: 'Learning hooks',
            improve: 'State management',
          },
          non_tech_sessions: {
            session_name: ['Meeting'],
            happy: 'Good communication',
            improve: 'More focus',
          },
        },
      },
    ];

    render(<ReflectionsTable reflections={mockReflections} />);

    // Check for table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Tech Happy')).toBeInTheDocument();

    // Check for reflection content
    expect(screen.getByText('Learning hooks')).toBeInTheDocument();
    expect(screen.getByText('Good communication')).toBeInTheDocument();
    expect(screen.getByText('Comfort Zone')).toBeInTheDocument();
  });
});
