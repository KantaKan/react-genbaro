import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReflectionsTable } from './reflections-table';
import type { Reflection } from '@/hooks/use-reflections';

describe('ReflectionsTable', () => {
  it('renders reflection rows and opens a dialog with session details on click', () => {
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

    // The zone label and a one-line preview are visible directly on the timeline row.
    expect(screen.getByText(/Comfort Zone/)).toBeInTheDocument();
    expect(screen.getByText('Learning hooks · Good communication')).toBeInTheDocument();

    // Full detail (both happy/improve fields) is only rendered once the row is clicked, opening the detail dialog.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Comfort Zone/).closest('[role="button"]')!);

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('State management')).toBeInTheDocument();
    expect(dialog.getByText('Good communication')).toBeInTheDocument();
    expect(dialog.getByText('More focus')).toBeInTheDocument();
  });
});
