import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StartWorkoutForm } from '../StartWorkoutForm';

describe('StartWorkoutForm', () => {
  it('renders the start button and a name input', () => {
    const { getByText, getByPlaceholderText } = render(
      <StartWorkoutForm onStart={jest.fn()} />,
    );

    expect(getByText('Start Workout')).toBeTruthy();
    // Placeholder is the current day name — just verify it exists
    expect(getByPlaceholderText(/Session/)).toBeTruthy();
  });

  it('calls onStart with the typed name when submitted', async () => {
    const onStart = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(
      <StartWorkoutForm onStart={onStart} />,
    );

    fireEvent.changeText(getByPlaceholderText(/Session/), 'Leg Day');
    fireEvent.press(getByText('Start Workout'));

    await waitFor(() => {
      expect(onStart).toHaveBeenCalledWith('Leg Day');
    });
  });

  it('falls back to the day-based placeholder name when input is empty', async () => {
    const onStart = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(<StartWorkoutForm onStart={onStart} />);

    fireEvent.press(getByText('Start Workout'));

    await waitFor(() => {
      expect(onStart).toHaveBeenCalledWith(expect.stringMatching(/Session$/));
    });
  });

  it('trims whitespace from the workout name', async () => {
    const onStart = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(
      <StartWorkoutForm onStart={onStart} />,
    );

    fireEvent.changeText(getByPlaceholderText(/Session/), '  Upper Body  ');
    fireEvent.press(getByText('Start Workout'));

    await waitFor(() => {
      expect(onStart).toHaveBeenCalledWith('Upper Body');
    });
  });
});
