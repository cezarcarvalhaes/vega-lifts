import { fireEvent, render } from '@testing-library/react-native';
import { ActiveWorkoutCard } from '../ActiveWorkoutCard';

describe('ActiveWorkoutCard', () => {
  it('renders the in-progress label and both action buttons', () => {
    const { getByText } = render(
      <ActiveWorkoutCard onContinue={jest.fn()} onDiscard={jest.fn()} />,
    );

    expect(getByText('Workout in progress')).toBeTruthy();
    expect(getByText('Continue Workout →')).toBeTruthy();
    expect(getByText('Discard workout')).toBeTruthy();
  });

  it('calls onContinue when the continue button is pressed', () => {
    const onContinue = jest.fn();
    const { getByText } = render(
      <ActiveWorkoutCard onContinue={onContinue} onDiscard={jest.fn()} />,
    );

    fireEvent.press(getByText('Continue Workout →'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when the discard link is pressed', () => {
    const onDiscard = jest.fn();
    const { getByText } = render(
      <ActiveWorkoutCard onContinue={jest.fn()} onDiscard={onDiscard} />,
    );

    fireEvent.press(getByText('Discard workout'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
