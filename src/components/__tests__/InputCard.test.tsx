import React from 'react';
// @ts-ignore
import renderer from 'react-test-renderer';
import { InputCard } from '../InputCard';

describe('InputCard Component', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <InputCard label="Weight" value="" onChangeText={() => {}} placeholder="Enter weight" />
    ).toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders correctly with error', () => {
    const tree = renderer.create(
      <InputCard label="Weight" value="" onChangeText={() => {}} error="Invalid weight" />
    ).toJSON();
    expect(tree).toBeTruthy();
  });
});
