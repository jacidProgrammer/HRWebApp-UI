import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/errors';
import { feedbackApi } from '../api/feedback';
import {
  employeeUser,
  feedbackAboutLouisa,
  hidden,
  jose,
  louisa,
  maria,
  renderWithAuth,
  unanalysedFeedbackAboutJose,
} from '../test/render';
import { FeedbackPage } from './FeedbackPage';

vi.mock('../api/employees', () => ({ employeesApi: { list: vi.fn() } }));
vi.mock('../api/feedback', () => ({ feedbackApi: { list: vi.fn(), send: vi.fn() } }));

const listEmployees = vi.mocked(employeesApi.list);
const listFeedback = vi.mocked(feedbackApi.list);
const send = vi.mocked(feedbackApi.send);

describe('FeedbackPage', () => {
  beforeEach(() => {
    listEmployees.mockResolvedValue([jose, hidden(louisa), hidden(maria)]);
    listFeedback.mockResolvedValue([feedbackAboutLouisa, unanalysedFeedbackAboutJose]);
  });

  it('lists feedback with its sentiment, or "Not analysed" when there is none', async () => {
    renderWithAuth(<FeedbackPage />, { user: employeeUser, route: '/feedback' });

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    // newest first
    expect(within(items[0]!).getByText('Not analysed')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Positive')).toHaveTextContent('97%');
  });

  it('filters the list by sentiment', async () => {
    const user = userEvent.setup();
    renderWithAuth(<FeedbackPage />, { user: employeeUser, route: '/feedback' });
    await screen.findAllByRole('listitem');

    await user.selectOptions(screen.getByLabelText('Sentiment'), 'Not analysed');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText(unanalysedFeedbackAboutJose.message)).toBeInTheDocument();
  });

  it('offers only colleagues, not yourself, and preselects ?about=', async () => {
    renderWithAuth(<FeedbackPage />, { user: employeeUser, route: '/feedback?about=maria' });

    const select = await screen.findByLabelText('Colleague');
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Choose a colleague', 'Louisa · Senior Agile Coach', 'Maria · Account Executive']);
    expect(select).toHaveValue('Maria');
  });

  it('validates, sends the feedback and adds it to the list', async () => {
    const user = userEvent.setup();
    send.mockResolvedValue({ name: 'Maria', message: 'Great demo today!', score: null, label: null });
    renderWithAuth(<FeedbackPage />, { user: employeeUser, route: '/feedback' });
    await screen.findByLabelText('Colleague');

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText('Choose a colleague.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Colleague'), 'Maria');
    await user.type(screen.getByLabelText('Message'), 'Great demo today!');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(send).toHaveBeenCalledWith({ name: 'Maria', message: 'Great demo today!' });
    expect(await screen.findByText(/Feedback about Maria was sent/)).toHaveTextContent('shown as not analysed');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('shows backend errors inline', async () => {
    const user = userEvent.setup();
    send.mockRejectedValue(new ApiError('FORBIDDEN', 'Only registered employees can send feedback', 403, 'FORBIDDEN'));
    renderWithAuth(<FeedbackPage />, { user: employeeUser, route: '/feedback?about=Louisa' });

    await user.type(await screen.findByLabelText('Message'), 'Thanks!');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only registered employees can send feedback');
  });
});
