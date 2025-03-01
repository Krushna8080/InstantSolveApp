import React, { useState, useEffect } from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import TermsAndConditions from './src/screens/TermsAndConditions';
import { storageService } from './src/services/storageService';

// Wrap the app with theme providers
const ThemedApp = () => {
  const { colors } = useTheme();
  const [showTerms, setShowTerms] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    checkTermsAcceptance();
  }, []);
  const checkTermsAcceptance = async () => {
    try {
        const accepted = await storageService.hasAcceptedTerms();
        console.log('Terms accepted:', accepted);
        setTermsAccepted(accepted);
        setShowTerms(!accepted); // Show terms only if not accepted
        setIsInitialLoad(false);
    } catch (error) {
        console.error('Error checking terms acceptance:', error);
        setShowTerms(true); // Default to showing terms on error
        setIsInitialLoad(false);
    }
};

  const handleAcceptTerms = async () => {
    try {
      await storageService.setTermsAccepted(true);
      console.log('Terms accepted and saved');
      setTermsAccepted(true);
      setShowTerms(false);
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Failed to save terms acceptance. Please try again.');
    }
  };

  const handleShowTerms = () => {
    setShowTerms(true);
  };

  const handleDismissTerms = () => {
    if (termsAccepted) {
      setShowTerms(false);
    }
  };

  // Define the theme based on current theme context
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      error: colors.error,
      accent: colors.success,
    },
  };

  if (isInitialLoad) {
    return null; // Or a loading spinner
  }

  return (
    <PaperProvider theme={theme}>
      <TermsAndConditions 
        visible={showTerms}
        onAccept={!termsAccepted ? handleAcceptTerms : undefined}
        onDismiss={termsAccepted ? handleDismissTerms : undefined}
      />
      <HomeScreen onShowTerms={handleShowTerms} />
    </PaperProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
