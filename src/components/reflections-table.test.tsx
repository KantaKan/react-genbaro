import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReflectionsTable } from './reflections-table';
import type { Reflection } from '@/hooks/use-reflections';

describe('ReflectionsTable', () => {
  it('renders reflection cards and expands to show session details', () => {
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

    // The zone label is visible on the collapsed card header.
    expect(screen.getByText('Comfort Zone')).toBeInTheDocument();

    // Session details are only rendered once the card is expanded.
    expect(screen.queryByText('Learning hooks')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Learning hooks')).toBeInTheDocument();
    expect(screen.getByText('Good communication')).toBeInTheDocument();
  });
});
