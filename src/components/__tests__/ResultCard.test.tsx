import React from 'react';
// @ts-ignore
import renderer from 'react-test-renderer';
import { ResultCard } from '../ResultCard';

describe('ResultCard Component', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <ResultCard title="BMI" value="22.5" />
    ).toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders category and subtitle', () => {
    const tree = renderer.create(
      <ResultCard title="BMI" value="22.5" category="Normal" subtitle="Healthy range" />
    ).toJSON();
    expect(tree).toBeTruthy();
  });
});
