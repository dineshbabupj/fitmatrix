import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { ProgressScreen } from '../screens/ProgressScreen';
import { BmiScreen } from '../screens/BmiScreen';
import { BmrScreen } from '../screens/BmrScreen';
import { BodyFatScreen } from '../screens/BodyFatScreen';
import { IdealWeightScreen } from '../screens/IdealWeightScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#4CAF50' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#888888',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

          if (route.name === 'Progress') {
            iconName = 'stats-chart-outline';
          } else if (route.name === 'BMI') {
            iconName = 'scale-outline';
          } else if (route.name === 'BMR') {
            iconName = 'flame-outline';
          } else if (route.name === 'Body Fat') {
            iconName = 'fitness-outline';
          } else if (route.name === 'Ideal Weight') {
            iconName = 'barbell-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="BMI" component={BmiScreen} options={{ title: 'BMI' }} />
      <Tab.Screen name="BMR" component={BmrScreen} options={{ title: 'BMR' }} />
      <Tab.Screen name="Body Fat" component={BodyFatScreen} options={{ title: 'Body Fat' }} />
      <Tab.Screen name="Ideal Weight" component={IdealWeightScreen} options={{ title: 'Ideal Weight' }} />
    </Tab.Navigator>
  );
};
