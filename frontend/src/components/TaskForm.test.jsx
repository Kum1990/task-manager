import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm.jsx';

describe('TaskForm', () => {
  it('submits the entered task and resets the form', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<TaskForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText('Title'), 'Prepare demo');
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(onCreate).toHaveBeenCalledWith({
      title: 'Prepare demo',
      description: '',
      priority: 'high',
      dueDate: null,
    });
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('shows a validation error when the title is empty', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows the server error when creation fails', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('Validation failed'));
    const user = userEvent.setup();
    render(<TaskForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText('Title'), 'Oops');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
  });
});
