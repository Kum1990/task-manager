import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskItem from './TaskItem.jsx';

const task = {
  id: 7,
  title: 'Write README',
  description: 'Setup steps',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
};

describe('TaskItem', () => {
  it('renders the task details', () => {
    render(<TaskItem task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Write README')).toBeInTheDocument();
    expect(screen.getByText('Setup steps')).toBeInTheDocument();
  });

  it('updates the status when a new one is selected', async () => {
    const onUpdate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<TaskItem task={task} onUpdate={onUpdate} onDelete={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Status of Write README'), 'done');

    expect(onUpdate).toHaveBeenCalledWith(7, { status: 'done' });
  });

  it('asks for confirmation before deleting', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TaskItem task={task} onUpdate={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete Write README' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Delete this task?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TaskItem task={task} onUpdate={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete Write README' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete Write README' })).toBeInTheDocument();
  });

  it('edits and saves the title', async () => {
    const onUpdate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<TaskItem task={task} onUpdate={onUpdate} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Edit Write README' }));
    const titleInput = screen.getByLabelText('Edit title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Write the README');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ title: 'Write the README' }),
    );
  });
});
