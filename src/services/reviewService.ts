import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REVIEW_PROMPT_KEY = '@has_prompted_review';

export const checkAndPromptReview = async () => {
  try {
    // 1. Check if we already prompted the user
    const hasPrompted = await AsyncStorage.getItem(REVIEW_PROMPT_KEY);
    if (hasPrompted === 'true') {
      console.log('User has already been prompted for a review.');
      return;
    }

    // 2. Check if StoreReview is available on the device
    const isAvailable = await StoreReview.isAvailableAsync();
    
    // hasAction() is specific to expo-store-review to check if the OS supports the review dialog
    const hasAction = await StoreReview.hasAction();

    if (isAvailable && hasAction) {
      console.log('Requesting In-App Review...');
      // 3. Request the review
      await StoreReview.requestReview();
      
      // 4. Mark as prompted so we don't spam the user
      await AsyncStorage.setItem(REVIEW_PROMPT_KEY, 'true');
    } else {
      console.log('Store Review is not available on this device/environment.');
      
      // For development/Expo Go environments, StoreReview usually returns false for isAvailable/hasAction.
      // We can still mark it as prompted during testing so we simulate production behavior.
      if (__DEV__) {
        console.log('Simulating review prompt completion in DEV mode.');
        await AsyncStorage.setItem(REVIEW_PROMPT_KEY, 'true');
      }
    }
  } catch (error) {
    console.error('Error requesting app review:', error);
  }
};
